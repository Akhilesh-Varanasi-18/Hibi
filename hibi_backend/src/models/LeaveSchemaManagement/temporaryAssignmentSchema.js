const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");

const temporaryAssignmentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  temporaryHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  leaveRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveRequest",
    required: true,
  },
  // startDate: {
  //   type: Date,
  //   required: true,
  // },
  // endDate: {
  //   type: Date,
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
  updatedAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
});

module.exports = mongoose.model(
  "TemporaryAssignment",
  temporaryAssignmentSchema
);
