const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const { getISTDateAndTime } = require("../../utils/timeFunction");

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

const ODSchema = new Schema({
    orgId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  totalDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  statusId: {
    type: Schema.Types.ObjectId,
    ref: "statusTypes",
    required: true,
  },
  actionedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
    default: null,
  },
  actionedAt: {
    type: Date,
    default: null,
  },
  actionReason: {
    type: String,
    default: "",
    trim: true,
  },
  notifyTo: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Employees",
    },
  ],
  approvalList: {
    type: [approvalListSchema],
    default: [],
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


module.exports = mongoose.model("ODRequests", ODSchema);