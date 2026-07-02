const express = require("express");
const mongoose = require("mongoose");

const { getISTDateAndTime } = require("../../utils/timeFunction");

const shiftSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  name: {
    type: String,
    trim: true,
    uppercase: true,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
  },
  breakTimeStart: {
    type: String,
    required: true,
    trim: true,
  },
  breakTimeEnd: {
    type: String,
    required: true,
    trim: true,
  },
  gracePeriodMin: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employees",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employees",
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

module.exports = mongoose.model("Shifts", shiftSchema);
