const express = require("express");
const router = express.Router();
const {
  getEmployeeStats,
  getAllPendingRequets
} = require("../controllers/employeeStats");

router.post("/get-employee-stats", getEmployeeStats);
router.post("/get-all-pending-requests", getAllPendingRequets);

module.exports = router