const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");

const DailyAttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  orgId :{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift",
    required: true,
  },
  logInTime: {
    type: Date,
    default: null,
  },
  logOutTime: {
    type: Date,
    default: null,
  },
  totalHours: {
    type: Number,
    default: 0,
  },
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendenceStatusTypes",
  },
  lateIn: {
    type: Boolean,
    default: false,
  },
  earlyOut: {
    type: Boolean,
    default: false,
  },
  halfDay: {
    type: Boolean,
    default: false,
  },
  permissions: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  thumbId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  finalizedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
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

module.exports = mongoose.model("DailyAttendance", DailyAttendanceSchema);
