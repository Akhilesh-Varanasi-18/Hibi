const leaveConsidarationSchema = require("../../models/LeaveSchemaManagement/leaveConsidarationSchema");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const { productDefinedLeaveConsiderations } = require("../../config/productDefined");
const logger = require("../../utils/logger");

// Add Leave Consideration Type
const addLeaveConsiderationType = async (req, res) => {
  try {
    const { considerType, considerTypeCode } = req.body;
    const employeeId = req?.user?._id;

    // Validate input
    if (
      !considerType ||
      typeof considerType !== "string" ||
      considerType.trim() === ""
    ) {
      return res.status(400).json({
        error: "Invalid consideration type",
        data: "Consideration type is required and must be a non-empty string",
      });
    }

    if (
      !considerTypeCode ||
      typeof considerTypeCode !== "string" ||
      considerTypeCode.trim() === ""
    ) {
      return res.status(400).json({
        error: "Invalid consideration type code",
        data: "Consideration type code is required and must be a non-empty string",
      });
    }

    // Check if the consideration type already exists
    const existingConsiderationType = await leaveConsidarationSchema.findOne({
      orgId: req?.user?.orgId,
      $or: [
        { considerType: considerType.toUpperCase().trim() },
        { considerTypeCode: considerTypeCode.toUpperCase().trim() },
      ],
    });

    if (existingConsiderationType) {
      return res.status(400).json({
        message: "Consideration type or code already exists",
        data: "This consideration type or code already exists",
      });
    }

    // Create new consideration type
    const newConsiderationType = new leaveConsidarationSchema({
      considerType: considerType.toUpperCase().trim(),
      considerTypeCode: considerTypeCode.toUpperCase().trim(),
      createdBy: employeeId,
      updatedBy: employeeId,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
      orgId: req?.user?.orgId,
    });

    await newConsiderationType.save();
    logger.info(`Leave consideration type '${considerType}' added by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(201).json({ message: "Consideration type added successfully" });
  } catch (error) {
    console.error("Error adding consideration type:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Leave Consideration Types
const getAllLeaveConsiderationTypes = async (req, res) => {
  try {
    const orgId = req?.user?.orgId;
    const considerationTypes = await leaveConsidarationSchema.find({ orgId });
    res
      .status(200)
      .json({
        message: "Leave consideration types fetched successfully",
        data: considerationTypes,
      });
  } catch (error) {
    console.error("Error fetching consideration types:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Update Leave Consideration Type
const updateLeaveConsiderationType = async (req, res) => {
  try {
    const { considerType, considerTypeCode, considerationTypeId } = req.body;
    const employeeId = req?.user?._id;

    // Validate input
    if (
      !considerType ||
      typeof considerType !== "string" ||
      considerType.trim() === ""
    ) {
      return res.status(400).json({
        error: "Invalid consideration type",
        data: "Consideration type is required and must be a non-empty string",
      });
    }
    if (
      !considerTypeCode ||
      typeof considerTypeCode !== "string" ||
      considerTypeCode.trim() === ""
    ) {
      return res.status(400).json({
        error: "Invalid consideration type code",
        data: "Consideration type code is required and must be a non-empty string",
      });
    }

    if(!considerationTypeId){
        return res.status(404).json({message: "Consideration type ID is required"});
    }   


    // Check if the consideration type exists
    const existingConsiderationType = await leaveConsidarationSchema.findById(
      considerationTypeId
    );

    if (!existingConsiderationType) {
      return res.status(404).json({
        error: "Consideration type not found",
        data: "No consideration type found with the provided ID",
      });
    }

    const isProductDefined =
      Object.prototype.hasOwnProperty.call(
      productDefinedLeaveConsiderations,
      existingConsiderationType.considerType
      ) ||
      Object.values(productDefinedLeaveConsiderations).includes(
      existingConsiderationType.considerTypeCode
      );

    if (isProductDefined) {
      return res.status(400).json({
      message: "This is a product defined consideration type and cannot be updated",
      data: "Product defined consideration types cannot be updated",
      });
    }

    const alreadyExist = await leaveConsidarationSchema.findOne({
        orgId: req?.user?.orgId,
        $or: [
            { considerType: considerType.toUpperCase().trim() },
            { considerTypeCode: considerTypeCode.toUpperCase().trim() },
        ],
        _id: { $ne: considerationTypeId } 
    });

    if (alreadyExist) {
        return res.status(400).json({
            message: "Consideration type or code already exists",
            data: "This consideration type or code already exists",
        });
    }



    // Update consideration type
    existingConsiderationType.considerType = considerType
      .toUpperCase()
      .trim();
    existingConsiderationType.considerTypeCode = considerTypeCode
      .toUpperCase()
      .trim();
    existingConsiderationType.updatedBy = employeeId;
    existingConsiderationType.updatedAt = getISTDateAndTime();
    await existingConsiderationType.save();
    logger.info(`Leave consideration type '${existingConsiderationType.considerType}' updated to '${considerType}' by user ${req.user.firstName} ${req.user.lastName}`);
    res
      .status(200)
      .json({ message: "Consideration type updated successfully" });
  } catch (error) {
    console.error("Error updating consideration type:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Leave Consideration Type
const deleteLeaveConsiderationType = async (req, res) => {
  try {
    const { considerationTypeId } = req.params;

    // Check if the consideration type exists
    const existingConsiderationType = await leaveConsidarationSchema.findById(
      considerationTypeId
    );
    
    if (!existingConsiderationType) {
      return res.status(404).json({
        error: "Consideration type not found",
        data: "No consideration type found with the provided ID",
      });
    }
    // Delete consideration type
    await leaveConsidarationSchema.findByIdAndDelete(considerationTypeId);
    logger.info(`Leave consideration type '${existingConsiderationType.considerType}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
    res
      .status(200)
      .json({ message: "Consideration type deleted successfully" });
  } catch (error) {
    console.error("Error deleting consideration type:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addLeaveConsiderationType,
  getAllLeaveConsiderationTypes,
  updateLeaveConsiderationType,
  deleteLeaveConsiderationType,
};
