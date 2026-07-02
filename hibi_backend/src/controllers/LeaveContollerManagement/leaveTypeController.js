const leaveSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const leaveTypeSchema = require("../../models/LeaveSchemaManagement/leaveTypesSchema");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const { productDefinedLeaveTypes } = require("../../config/productDefined"); // Add this import
const logger = require("../../utils/logger");

const mongoose = require("mongoose");

const addLeaveType = async (req, res) => {
  try {
    const { leaveType, shortCode } = req.body;
    const employeeId = req?.user?._id;

    // Validate input
    if (
      !leaveType ||
      typeof leaveType !== "string" ||
      leaveType.trim() === ""
    ) {
      return res.status(400).json({
        error: "Invalid leave type",
        data: "Leave type is required and must be a non-empty string",
      });
    }

    // if (
    //   !shortCode ||
    //   typeof shortCode !== "string" ||
    //   shortCode.trim() === ""
    // ) {
    //   return res.status(400).json({
    //     error: "Invalid short code",
    //     data: "Short code is required and must be a non-empty string",
    //   });
    // }

    // Check if the leave type already exists
    const existingLeaveType = await leaveTypeSchema.findOne({
      leaveType: leaveType.toUpperCase().trim(),
      orgId: req?.user?.orgId,
    });
    if (existingLeaveType) {
      return res.status(400).json({
        error: "Leave type already exists",
        data: "This leave type already exists",
      });
    }

    // Create new leave type
    const newLeaveType = new leaveTypeSchema({
      leaveType: leaveType.toUpperCase().trim(),
      // shortCode: shortCode.toUpperCase().trim(),
      createdBy: employeeId,
      updatedBy: employeeId,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
      orgId: req?.user?.orgId,
    });
    await newLeaveType.save();

    logger.info(`Leave type '${leaveType}' added by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(201).json({ message: "Leave type added successfully" });
  } catch (error) {
    console.error("Error while adding leave type:", error);
    res.status(500).json({
      error: "Internal server error",
      data: "Error while adding leave type",
    });
  }
};

const updateLeaveType = async (req, res) => {
  try {
    const { leaveType, leaveTypeId, shortCode } = req.body;
    const employeeId = req?.user?._id;

    // Validate input
    if (!leaveType || typeof leaveType !== "string" || leaveType.trim() === "")
      return res.status(400).json({
        error: "Invalid leave type",
        data: "Leave type is required and must be a non-empty string",
      });

    if (!leaveTypeId || !mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res.status(400).json({
        error: "Invalid leave type ID",
        data: "Leave type ID is required and must be a valid ObjectId",
      });
    }

    // if (
    //   !shortCode ||
    //   typeof shortCode !== "string" ||
    //   shortCode.trim() === ""
    // ) {
    //   return res.status(400).json({
    //     error: "Invalid short code",
    //     data: "Short code is required and must be a non-empty string",
    //   });
    // }

    const leaveTypeDoc = await leaveTypeSchema.findById(leaveTypeId);
    if (!leaveTypeDoc)
      return res.status(404).json({
        error: "Leave type not found",
        data: "No leave type found with the provided ID",
      });

    // Restrict update if product defined
    if (productDefinedLeaveTypes.includes(leaveTypeDoc.leaveType)) {
      return res.status(403).json({
        message: "This is a product defined leave type and cannot be updated.",
      });
    }

    // Find and update leave type
    const updatedLeaveType = await leaveTypeSchema.findByIdAndUpdate(
      leaveTypeId,
      {
        leaveType: leaveType.toUpperCase().trim(),
        // shortCode: shortCode.toUpperCase().trim(),
        updatedBy: employeeId,
        updatedAt: getISTDateAndTime(),
      },
      { new: true }
    );

    if (!updatedLeaveType)
      return res.status(404).json({
        error: "Leave type not found",
        data: "No leave type found with the provided ID",
      });

    logger.info(`Leave type '${leaveTypeDoc.leaveType}' updated to '${leaveType}' by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({ message: "Leave type updated successfully" });
  } catch (error) {
    console.error("Error while updating leave type:", error);
    res.status(500).json({
      error: "Internal server error",
      data: "Error while updating leave type",
    });
  }
};

const deleteLeaveType = async (req, res) => {
  try {
    const { leaveTypeId } = req.params;

    // Validate input
    if (!leaveTypeId || !mongoose.Types.ObjectId.isValid(leaveTypeId))
      return res.status(400).json({
        error: "Invalid leave type ID",
        data: "Leave type ID is required and must be a valid ObjectId",
      });

    // Find leave type
    const leaveTypeDoc = await leaveTypeSchema.findById(leaveTypeId);
    if (!leaveTypeDoc)
      return res.status(404).json({
        error: "Leave type not found",
        data: "No leave type found with the provided ID",
      });

    // Restrict deletion if product defined
    if (productDefinedLeaveTypes.includes(leaveTypeDoc.leaveType)) {
      return res.status(403).json({
        message: "This is a product defined leave type and cannot be deleted.",
      });
    }

    // Delete leave type
    await leaveTypeSchema.findByIdAndDelete(leaveTypeId);

    logger.info(`Leave type '${leaveTypeDoc.leaveType}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({ message: "Leave type deleted successfully" });
  } catch (error) {
    console.error("Error while deleting leave type:", error);
    res.status(500).json({
      error: "Internal server error",
      data: "Error while deleting leave type",
    });
  }
};

const getLeaveTypes = async (req, res) => {
  try {
    const orgId = req?.user?.orgId;
    if (!orgId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    const leaveTypes = await leaveTypeSchema.find(
      { orgId },
      { leaveType: 1,
        //  shortCode: 1 
        }
    );
    if (leaveTypes.length === 0) {
      return res.status(404).json({ message: "No leave types found" });
    }
    res.status(200).json(leaveTypes);
  } catch (error) {
    console.error("Error while fetching leave types:", error);
    res.status(500).json({
      error: "Internal server error",
      data: "Error while fetching leave types",
    });
  }
};

module.exports = {
  addLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getLeaveTypes,
};
