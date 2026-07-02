const { get } = require("mongoose");
const attendenceStatusTypesSchema = require("../../models/AttendenceSchemaManagement/attendenceStatusTypesSchema");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const { productDefinedAttendenceStatus } = require("../../config/productDefined");
const logger = require("../../utils/logger");

// function to attendence Status Types
const addAttendenceStatusTypes = async (req, res) => {
  try {
    const { name, shortName } = req.body;
    const employeeId = req?.user?._id;
    const orgId = req?.user?.orgId;
    if (!name || !shortName) {
      return res
        .status(400)
        .json({ message: "Please Provide the required fields" });
    }

    if (await attendenceStatusTypesSchema.findOne({ name, orgId })) {
      return res
        .status(400)
        .json({ message: "Attendence Status Type Already Exists" });
    }

    const newAttendenceStatusType = new attendenceStatusTypesSchema({
      orgId,
      name,
      shortName,
      createdBy: employeeId,
    });

    await newAttendenceStatusType.save();
    logger.info(`Attendance status type '${name}' added by user ${req.user.firstName} ${req.user.lastName}`);
    return res
      .status(201)
      .json({ message: "Attendence Status Type Added Successfully" });
  } catch (error) {
    console.log("Error while adding the attendance status type", error.message);
    return res.status(500).json({
      message: "Internal Server Error While Adding the Attendence Status Type",
      error: error.message,
    });
  }
};

//get attendence Status Types
const getAttendanceStatusTypes = async (req, res) => {
  try {
    const orgId = req?.user?.orgId;
    const attendenceStatusTypes = await attendenceStatusTypesSchema.find(
      { orgId },
      { name: 1, shortName: 1 }
    );
    return res.status(200).json({
      message: "Attendence Status Types Fetched Successfully",
      data: attendenceStatusTypes,
    });
  } catch (error) {
    console.log(
      "Error while fetching the attendance status types",
      error.message
    );
    return res.status(500).json({
      message:
        "Internal Server Error While Fetching the Attendence Status Types",
      error: error.message,
    });
  }
};

//update attendence Status types
const updateAttendenceStatusTypes = async (req, res) => {
  try {
    const { id, name, shortName } = req.body;
    const employeeId = req?.user?._id;
    const orgId = req?.user?.orgId;

    if (!id ) {
      return res
        .status(400)
        .json({ message: "Please Provide the required Status type Id" });
    }

    if(!name && !shortName) {
      return res
        .status(400)
        .json({ message: "Please Provide the required fields" });
    }

    const existingStatusType = await attendenceStatusTypesSchema.findById(id);
    if (!existingStatusType) {
      return res
        .status(404)
        .json({ message: "Attendence Status Type Not Found" });
    }

    if (Object.keys(productDefinedAttendenceStatus).includes(existingStatusType.name)) {
      return res.status(400).json({
      message: "Cannot update product defined Attendence Status Types",
      });
    }

    const updatedAttendenceStatusType =
      await attendenceStatusTypesSchema.findByIdAndUpdate(
        id,
        {
          ...(name && { name }),
          ...(shortName && { shortName }),
          updatedBy: employeeId,
          updatedAt: getISTDateAndTime(),
        },
        { new: true }
      );

    if (!updatedAttendenceStatusType) {
      return res
        .status(404)
        .json({ message: "Attendence Status Type Not Found" });
    }

    logger.info(`Attendance status type '${existingStatusType.name}' updated to '${updatedAttendenceStatusType.name}' by user ${req.user.firstName} ${req.user.lastName}`);
    return res.status(200).json({
      message: "Attendence Status Type Updated Successfully"
    });
  } catch (error) {
    console.log(    
      "Error while updating the attendance status types",
      error.message
    );
    return res.status(500).json({
      message:
        "Internal Server Error While Updating the Attendence Status Types",
      error: error.message,
    });
  }
};

//delete attendence Status Types
const deleteAttendenceStatusTypes = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Please Provide the required fields" });
    }

    const deletedAttendenceStatusType =
      await attendenceStatusTypesSchema.findByIdAndDelete(id);

    if (!deletedAttendenceStatusType) {
      return res
        .status(404)
        .json({ message: "Attendence Status Type Not Found" });
    }

    logger.info(`Attendance status type '${deletedAttendenceStatusType.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
    return res.status(200).json({
      message: "Attendence Status Type Deleted Successfully",
    });
  } catch (error) {
    console.log(
      "Error while deleting the attendance status types",
      error.message
    );
    return res.status(500).json({
      message:
        "Internal Server Error While Deleting the Attendence Status Types",
      error: error.message,
    });
  }
};


module.exports = {
  addAttendenceStatusTypes,
  getAttendanceStatusTypes,
  updateAttendenceStatusTypes,
  deleteAttendenceStatusTypes,
};
