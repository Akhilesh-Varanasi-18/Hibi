const mongoose = require("mongoose");

const { getISTDateAndTime } = require("../utils/timeFunction");
const { create } = require("./firebaseMessageingTockenSchema");

// const odSchema = new mongoose.Schema({
//     orgId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Organization',
//         required: true
//     },
//     employeeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee',
//         required: true
//     },
//     reason: {
//         type: String,
//         // required: true
//     },
//     totalDays: {
//         type: Number,
//         required: true
//     },
//     status: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Status',
//         required: true
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'Employee'
//     },
//     updatedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee'
//     },
//     createdAt: {
//         type: Date,
//         required: true,
//         default: () => getISTDateAndTime()
//     },
//     updatedAt: {
//         type: Date,
//         default: () => getISTDateAndTime()
//     },
//     expiresAt: {
//         type: Date,
//     }
// })

const odSchema = new mongoose.Schema({
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
    ref: "StatusType",
    required: true,
  },
  leaveRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveRequest",
    default: null,
  },
  odRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ODRequest",
    default: null,
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
  expiresAt: {
    type: Date,
    default: () => {
      const createdAt = getISTDateAndTime();
      return new Date(createdAt.setDate(createdAt.getDate() + 60));
    },
  },
});

module.exports = mongoose.model("ODS", odSchema);
