const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const Schema = mongoose.Schema;

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

const thumbRequestSchema = new Schema({
  orgId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  requestFor: {
    type: Schema.Types.ObjectId,
    ref: "AttendenceRequestType",
    required: true,
  },
  approvalList: {
    type: [approvalListSchema],
    default: [],
  },
  notifyTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  ],
  thumbDate: {
    type: Date,
    required: true,
  },
  punchType: {
    type: String,
    enum: ["IN", "OUT"],
    required: true,
  },
  shiftId: {
    type: Schema.Types.ObjectId,
    ref: "Shifts",
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  statusId: {
    type: Schema.Types.ObjectId,
    ref: "StatusTypes",
  },
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    default: null,
  },
  actionReason: {
    type: String,
    trim: true,
    default: "",
  },
  actionedAt: {
    type: Date,
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

module.exports = mongoose.model("ThumbRequest", thumbRequestSchema);
