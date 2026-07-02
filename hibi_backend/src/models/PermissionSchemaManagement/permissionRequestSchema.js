const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const Schema = mongoose.Schema;

// Approval List Schema
// This schema is used to maintain the hierarchy of approvers for the permission request
const approvalListSchema = new Schema({
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
    required: true,
  },
  statusId: {
    type: Schema.Types.ObjectId,
    ref: "StatusType",
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

// Permission Request Schema
const permissionRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Employee",
  },
  approvalList: {
    type: [approvalListSchema],
    default: [],
  },
  notifyTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
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
  permissionTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "PermissionType",
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  permissionReason: {
    type: String,
    // required: true
  },
  totalHours: {
    type: Number,
    // required: true
  },
  isFirstHalf: {
    type: Boolean,
  },
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "StatusType",
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

module.exports = mongoose.model("PermissionRequests", permissionRequestSchema);
