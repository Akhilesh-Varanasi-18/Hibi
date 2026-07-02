const express = require("express");
const router = express.Router();

const {
    getUnActiveEmployee,
    getActiveEmployee,
    getAttendenceReport,
} = require("../controllers/AttendenceControler/attendenceReportController");


// Router to get unactive employees
router.get("/get-inactive-employee", getUnActiveEmployee);

// Router to get active employees
router.get("/get-active-employee", getActiveEmployee);

// Router to get attendence report
router.post("/get-attendence-report", getAttendenceReport);

module.exports = router;