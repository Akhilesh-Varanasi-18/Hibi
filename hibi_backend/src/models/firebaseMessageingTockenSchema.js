const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../utils/timeFunction");

const firebaseMessagingTokenSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employee",
    required: true,
  },
  token: {
    type: String,
    trim: true,
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

module.exports = mongoose.model("FirebaseMessagingToken",firebaseMessagingTokenSchema);
