const mongoose = require("mongoose");

const { getISTDateAndTime } = require("../utils/timeFunction");

// const utilizedCLSchema = new mongoose.Schema({
//   leaveRequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "LeaveRequests",
//     required: true,
//   },
//   daysUsed: {
//     type: Number,
//     required: true,
//   },
// });

// const yearEndRemainingClSchema = new mongoose.Schema({
//   year: {
//     type: Number,
//     required: true,
//   },
//   remainingCl: {
//     type: Number,
//     required: true,
//     default: 0,
//   },
//   carriedForwardCl: {
//     type: Number,
//     required: true,
//     default: 0,
//   },
//   expiredCl: {
//     type: Number,
//     required: true,
//     default: 0,
//   },
// });

// const requestedClSchema = new mongoose.Schema({
//   leaveRequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "LeaveRequests",
//     required: true,
//   },
//   daysUsed: {
//     type: Number,
//     required: true,
//   },
// })

// const clsSchema = new mongoose.Schema({
//   orgId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Organization",
//     required: true,
//   },
//   employeeId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Employee",
//     required: true,
//   },
//   availableCl: {
//     type: Number,
//     required: true,
//   },
//   requestedCl: {
//     type: [requestedClSchema],
//     default: [],
//   },
//   utilizedCl: {
//     type: [utilizedCLSchema],
//     default: [],
//   },
//   yearEndRemainingCl: {
//     type: [yearEndRemainingClSchema],
//     default: [],
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "Employee",
//   },
//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Employee",
//   },
//   createdAt: {
//     type: Date,
//     required: true,
//    default: () => getISTDateAndTime()

//   },
//   updatedAt: {
//     type: Date,
//     default: () => getISTDateAndTime(),
//   },
// });

const clsSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "StatusType",
  },
  leaveRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveRequests",
    default: null,
    // required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => getISTDateAndTime(),
  },
  updatedAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
});

module.exports = mongoose.model("CLS", clsSchema);
