const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../utils/timeFunction");

const organizationSchema = new mongoose.Schema({
  orgHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employees",
    default: null,
  },
  orgCeoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employees",
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  status: {
    type: String,
  },
  regDate: {
    type: String,
  },
  organizationEmail: {
    type: String,
    default: ""
  },
  organizationAppPassword: {
    type: String,
    default: ""
  },
  productionAttendanceApi: {
    type: String,
    default: ""
  },
  stagingAttendanceApi: {
    type: String,
    default: ""
  },
  orgLogo: {
    type: String,
    default: ""
  },
  orgStamp: {
    type: String,
    default: ""
  },
  orgBanner: {
    type: String,
    default: ""
  },
  colorPalette: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("Organization", organizationSchema);
