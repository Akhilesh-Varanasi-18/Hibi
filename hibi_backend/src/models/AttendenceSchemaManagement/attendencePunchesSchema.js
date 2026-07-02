const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");

// Schema for Attendance Punches
const attendancePunchesSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employees",
    // required: true,
  },
  employeeCode: {
    type: String,
    required: true,
  },
  // inTime: {
  //   type: Date,
  //   required: true,
  // },
  // outTime: {
  //   type: Date,
  //   // required: true,
  // },
  punchTime:{
    type: Date,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  sourceId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
  updatedAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
});


module.exports = mongoose.model("AttendancePunches", attendancePunchesSchema);
