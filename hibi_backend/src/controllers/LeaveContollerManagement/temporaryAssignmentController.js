const temporaryAssignmentSchema = require("../../models/LeaveSchemaManagement/temporaryAssignmentSchema")
const {getISTDateAndTime} = require("../../utils/timeFunction")
const logger = require("../../utils/logger");


const addTemporaryAssignment = async (assignmentData) => {
  try {
    const {employeeId, temporaryHeadId, leaveRequestId, startDate, endDate } = assignmentData;

    const newTemporaryAssignment = new temporaryAssignmentSchema({
      employeeId,
      temporaryHeadId,
      leaveRequestId,
      startDate,
      endDate,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
    });

    await newTemporaryAssignment.save();

    logger.info(`Temporary assignment created for employee '${employeeId}' with temporary head '${temporaryHeadId}'`);
    return {
        success: true,
        message: "Temporary assignment completed successfully",
    }
  } 
  catch (error) {
    console.error("Error creating temporary assignment:", error);
    return {
      success: false,
      message: "Internal server error While creating temporary assignment",
    };
  }
};





module.exports = {
  addTemporaryAssignment,
};
