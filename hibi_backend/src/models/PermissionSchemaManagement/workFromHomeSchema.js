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

const wfhRequestSchema = new Schema({
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
  wfhReason: {
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

module.exports = mongoose.model("WfhRequest", wfhRequestSchema);
