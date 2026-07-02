const mongoose = require("mongoose");
const { Schema } = mongoose;
const { getISTDateAndTime } = require("../utils/timeFunction");

const requestApprovals = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  status: {
    type: Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
});

const organizationHeadChangeRequestSchema = new Schema({
  orgId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  newHeadId: {
    type: Schema.Types.ObjectId,
    ref: "employee",
    required: true,
  },
  oldHeadId: {
    type: Schema.Types.ObjectId,
    ref: "employee",
    required: true,
  },
  status: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  requestReason: {
    type: String,
    required: true,
    trim: true,
  },
  actionReason: {
    type: String,
    trim: true,
  },
  statusId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  requestApprovals:{
    type: [requestApprovals],
    default: [],
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: "employee",
    required: true,
  },
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "employee",
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



module.exports = mongoose.model("OrganizationHeadChangeRequest", organizationHeadChangeRequestSchema);