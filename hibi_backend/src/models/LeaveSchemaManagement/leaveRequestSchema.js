const mongoose = require("mongoose");
const { Schema } = mongoose;
const { getISTDateAndTime } = require("../../utils/timeFunction");

// Approval List Schema
// This schema is used to maintain the hierarchy of approvers for the leave request
const approvalListSchema = new Schema({
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
    required: true,
  },
  statusId: {
    type: Schema.Types.ObjectId,
    ref: "Status",
    required: true,
  },
  actionReason: {
    type: String,
    default: "",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
});

// Leave Request Schema
const leaveRequestSchema = new Schema({
  orgId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Employees",
  },
  approvalList: {
    type: [approvalListSchema],
    default: [],
  },
  // temporaryAssignmentId: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Employees",
  // },
  notifyTo: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Employees",
    },
  ],
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
  },
  actionedAt: {
    type: Date,
  },
  actionReason: {
    type: String,
    default: "",
    trim: true,
  },
  leaveTypeId: {
    type: Schema.Types.ObjectId,
    ref: "LeaveTypes",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isHalfDay: {
    type: Boolean,
    default: false,
    required: true,
  },
  halfDayPeriod: {
    type: String,
    default: "",
    required: function () {
      return this.isHalfDay;
    },
  },
  totalDays: {
    type: Number,
    trim: true,
    required: true,
  },
  actualWorkingDays: {
    type: Number,
    required: true,
  },
  odDays: {
    type: Number,
    required: true,
    default: 0,
  },
  clDays: {
    type: Number,
    required: true,
    default: 0,
  },
  lopDays: {
    type: Number,
    required: true,
    default: 0,
  },
  considerationTypeId: {
    type: Schema.Types.ObjectId,
    ref: "LeaveConsideration",
    // required: true,
  },
  leaveReason: {
    type: String,
    // required: true,
    trim: true,
    default: "",
  },
  statusId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "StatusType",
  },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
    required: true,
  },
  updatedAt: {
    type: Date,
    default: () => getISTDateAndTime(),
    required: true,
  },
});

module.exports = mongoose.model("LeaveRequests", leaveRequestSchema);
