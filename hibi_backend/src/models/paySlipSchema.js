const mongoose = require("mongoose");
const { Schema } = mongoose;

const { getISTDateAndTime } = require("../utils/timeFunction");

const paySlipSchema = new Schema({
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
  basicSalary: {
    type: Number,
    default: 0,
  },
  da: {
    type: Number,
    default: 0,
  },
  houseRentAllowance: {
    type: Number,
    default: 0,
  },
  earningsOthers: {
    type: Number,
    default: 0,
  },
  lossOfPay: {
    type: Number,
    default: 0,
  },
  professionalTax: {
    type: Number,
    default: 0,
  },
  epf: {
    type: Number,
    default: 0,
  },
  groupInsurance: {
    type: Number,
    default: 0,
  },
  canteen: {
    type: Number,
    default: 0,
  },
  advance: {
    type: Number,
    default: 0,
  },
  tds: {
    type: Number,
    default: 0,
  },
  contribution: {
    type: Number,
    default: 0,
  },
  esi: {
    type: Number,
    default: 0,
  },
  others: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    required: true,
  },
  totalDeductions: {
    type: Number,
    required: true,
  },
  netSalary: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "Employees",
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

module.exports = mongoose.model("PaySlips", paySlipSchema);
