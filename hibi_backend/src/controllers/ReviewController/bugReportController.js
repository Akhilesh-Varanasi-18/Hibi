const bugReportSchema = require('../../models/ReviewSchemaManagement/bugReportSchema');
const employeeSchema = require('../../models/EmployeeSchemaManagement/employeeSchema');
const logger = require('../../utils/logger');

// Import your S3 upload utility
const { uploadToS3 } = require('../../utils/s3Upload');
const { getISTDateAndTime } = require('../../utils/timeFunction');

// Function to create a new bug report with file upload support
const createBugReport = async (req, res) => {
    try {
        const { title, description } = req.body;
        const orgId = req.user.orgId;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        // req.files is an array of uploaded files (from multer)
        const files = req.files || [];
        console.log("Received attachments:", files.map(f => f.originalname)); // Debug: log incoming files

        if (!files.length) {
            return res.status(400).json({ message: "Please add at least one proof/attachment." });
        }

        const attachmentUrls = [];

        for (const file of files) {
            try {
                // uploadToS3 expects (fileBuffer, originalName, mimetype)
                const { fileUrl } = await uploadToS3(file.buffer, file.originalname, file.mimetype, "bug-reports");
                console.log(`Uploaded ${file.originalname} to S3: ${fileUrl}`); // Debug: log S3 upload result
                attachmentUrls.push(fileUrl);
            } catch (uploadErr) {
                console.error(`Error uploading ${file.originalname} to S3:`, uploadErr);
            }
        }

        const newBugReport = new bugReportSchema({
            employeeId: req.user._id, // Assuming req.user contains the authenticated user's info
            title,
            orgId,
            description,
            attachments: attachmentUrls,
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await newBugReport.save();

        logger.info(`Bug report with title '${title}' created by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(201).json({ message: "Bug report created successfully" });
    } catch (error) {
        console.error("Error creating bug report:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to get all bug reports
const getAllBugReports = async (req, res) => {
    try {
        const userId = req.user._id;
        const orgId = req.user.orgId;

        // Use findOne, not find, to get a single employee
        const employee = await employeeSchema.findOne({ _id: userId, orgId }, { __v: 0 }).populate('privilegeId', 'name');

        // if the user privilege is superadmin, fetch all bug reports
        if (employee && employee.privilegeId && employee.privilegeId.name === 'SUPERADMIN') {
            const bugReports = await bugReportSchema.find({ orgId }, { __v: 0 })
                .populate('employeeId', 'name employeeCode officeMail firstName lastName')
                .sort({ createdAt: -1 });
            return res.status(200).json({ message: "Bug reports fetched successfully", bugReports });
        }

        const bugReports = await bugReportSchema.find({ employeeId: userId }, { __v: 0 })
            .populate('employeeId', 'name employeeCode officeMail firstName lastName');
        res.status(200).json({ message: "Bug reports fetched successfully", bugReports });

    } catch (error) {
        console.error("Error fetching bug reports:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to update a bug report's status and remarks (for admin use)
const updateBugReport = async (req, res) => {
    try {
        const { bugReportId, status, remarks } = req.body;

        if (!bugReportId || !status) {
            return res.status(400).json({ message: "Bug report ID and status are required" });
        }

        // Validate status
        const validStatuses = ["PENDING", "IN PROCESS", "RESOLVED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const bugReport = await bugReportSchema.findById(bugReportId);
        if (!bugReport) {
            return res.status(404).json({ message: "Bug report not found" });
        }

        bugReport.status = status;
        if (remarks) {
            bugReport.remarks = remarks;
        }
        bugReport.updatedAt = new Date();
        bugReport.updatedBy = req.user._id;

        // Save with validateModifiedOnly to avoid validating unchanged fields like attachments
        await bugReport.save({ validateModifiedOnly: true });

        logger.info(`Bug report with ID '${bugReportId}' updated to status '${status}' by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Bug report updated successfully" });
    } catch (error) {
        console.error("Error updating bug report:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

module.exports = {
    createBugReport,        // Function to create a new bug report

    getAllBugReports,       // Function to get all bug reports

    updateBugReport         // Function to update a bug report's status and remarks
};