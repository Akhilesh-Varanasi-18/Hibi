const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../utils/timeFunction");
const { Schema } = mongoose;

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: () => getISTDateAndTime(),
  },
  expiresAt: {
    type: Date,
    required: true,
    default: (getISTDateAndTime().getTime() + (5 * 60 * 1000))
  },
});

module.exports = mongoose.model("OTPSchema", otpSchema);
