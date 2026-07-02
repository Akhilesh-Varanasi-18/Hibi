const announcementSchema = require("../models/announcementSchema");
const { getISTDateAndTime } = require("../utils/timeFunction");
const logger = require("../utils/logger");

// Import your S3 upload utility
const { uploadToS3, deleteFromS3 } = require("../utils/s3Upload");

// create a new announcement
const createAnnouncement = async (req, res) => {
  logger.info(`createAnnouncement call by ${req.user.employeeCode}`);
  try {
    // Expecting announcements as JSON string in req.body.announcements
    let { announcements, expiresAt, description } = req.body;
    const orgId = req.user.orgId;
    console.log("Received Date: ", expiresAt);
    if (typeof announcements === "string") {
      announcements = JSON.parse(announcements);
    }

    if (
      !announcements ||
      !Array.isArray(announcements) ||
      announcements.length === 0
    ) {
      return res.status(400).json({ message: "Invalid announcements data" });
    }

    if (!expiresAt || isNaN(Date.parse(expiresAt))) {
      return res
        .status(400)
        .json({ message: "Invalid or missing expiresAt date" });
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return res.status(400).json({ message: "Description is required" });
    }

    announcements = announcements.map((item) => ({
      title: item.title ? item.title.trim() : "",
    }));

    // Validate that expiresAt is a future date
    const expiresDate = new Date(expiresAt);
    console.log("Parsed Date: ", expiresDate);
    const now = new Date();
    // Allow expiresAt to be today or in the future (ignore time part)
    const expiresDateOnly = new Date(expiresDate.getFullYear(), expiresDate.getMonth(), expiresDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (expiresDateOnly < nowDateOnly) {
      return res
        .status(400)
        .json({ message: "expiresAt must be today or a future date" });
    }

    // Set expiresAt for the announcement document
    expiresAt = expiresDate;

    // Check for duplicate titles in DB (ignoring empty string titles)
    const titles = announcements
      .map((item) => (item.title || "").trim())
      .filter((title) => title !== "");

    if (titles.length > 0) {
      const duplicate = await announcementSchema.findOne({
        "announcements.title": { $in: titles },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ message: "Announcement with the same title already exists" });
      }
    }

    // req.files is an array of files uploaded
    const files = req.files || [];
    if (files.length !== announcements.length) {
      return res
        .status(400)
        .json({ message: "Number of images and announcements do not match" });
    }

    // Upload each file to S3 and collect URLs
    const uploadedAnnouncements = await Promise.all(
      announcements.map(async (item, idx) => {
        const file = files[idx];
        if (!file) throw new Error("Missing file for announcement");
        let imageUrl;
        try {
          // uploadToS3 should return an object with fileUrl
          const uploadResult = await uploadToS3(
            file.buffer,
            file.originalname,
            file.mimetype,
            "announcements"
          );
          imageUrl = uploadResult.fileUrl;
        } catch (uploadErr) {
          throw new Error(
            `Failed to upload image for announcement "${item.title}": ${uploadErr.message}`
          );
        }
        return {
          title: item.title,
          imageUrl,
        };
      })
    );

    const newAnnouncement = new announcementSchema({
      orgId,
      announcements: uploadedAnnouncements,
      description,
      createdBy: req.user._id,
      expiresAt,
    });
    await newAnnouncement.save();
    logger.info(`Announcement with description '${description}' created by user ${req.user.firstName} ${req.user.lastName}`);
    return res
      .status(201)
      .json({ message: "Announcement created successfully" });
  } catch (error) {
    logger.error(`Error creating announcement: ${error.message}`);
    console.error("Error creating announcement:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

// get all announcements
const getAnnouncements = async (req, res) => {
  logger.info(`getAnnouncements call by ${req.user.employeeCode}`);
  try {
    // search and remove all the expired announcements
    // await announcementSchema.deleteMany({ expiresAt: { $lte: getISTDateAndTime() } });

    // Remove expired announcements (expiresAt before today)
    const today = getISTDateAndTime();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    await announcementSchema.deleteMany({
      expiresAt: { $lt: todayDateOnly }
    });

    const announcements = await announcementSchema.aggregate([
      {
        $match: {
          orgId: req.user.orgId,
          expiresAt: { $gte: todayDateOnly },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "createdBy",
          foreignField: "_id",
          as: "creatorDetails",
        },
      },
      { $unwind: "$creatorDetails" },
      {
        $project: {
          announcements: 1,
          description: 1,
          createdAt: 1,
          expiresAt: 1,
          createdBy: {
            _id: "$creatorDetails._id",
            name: {
              $concat: [
                "$creatorDetails.firstName",
                " ",
                "$creatorDetails.lastName",
              ],
            },
          },
          officeMail: "$creatorDetails.officeMail",
          employeeCode: "$creatorDetails.employeeCode",
        },
      },
    ]);

    return res
      .status(200)
      .json({
        message: "Announcements fetched successfully",
        data: announcements,
      });
  } catch (error) {
    logger.error(`Error fetching announcements: ${error.message}`);
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

// function to delete an announcement
const deleteAnnouncement = async (req, res) => {
  logger.info(`deleteAnnouncement call by ${req.user.employeeCode}`);
  try {
    const { id } = req.params;
    const announcement = await announcementSchema.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Delete associated images from S3 if needed
    for (const item of announcement.announcements) {
      try {
        // Extract S3 key from imageUrl
        const s3Key = item.imageUrl.split(".amazonaws.com/")[1];
        if (s3Key) {
          await deleteFromS3(s3Key);
          console.log(`Deleted image ${s3Key} from S3`);
        } else {
          console.warn(`Could not extract S3 key from URL: ${item.imageUrl}`);
        }
      } catch (deleteErr) {
        console.error(
          `Failed to delete image ${item.imageUrl} from S3:`,
          deleteErr
        );
      }
    }

    await announcement.deleteOne();
    logger.info(`Announcement with description '${announcement.description}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
    return res
      .status(200)
      .json({ message: "Announcement deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting announcement: ${error.message}`);
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

module.exports = {
  createAnnouncement, // function to create announcement

  getAnnouncements, // function to get announcements

  deleteAnnouncement, // function to delete announcement
};