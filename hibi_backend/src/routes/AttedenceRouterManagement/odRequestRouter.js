const {
  createODRequest,
  processODRequest,
  getEmployeeODRequests,
  getActionRequiredODS,
  getODRequestFlow,
  getAllODRequests,
} = require("../../controllers/AttendenceControler/odsController");

const express = require("express");
const router = express.Router();

// Add OD Request
router.post("/add-request", createODRequest);

// Process OD Request (Approve/Reject/Forward)
router.post("/process-request", processODRequest);

// Get OD Requests for an Employee
router.post("/get-requests", getEmployeeODRequests);

// Get OD Requests requiring action by a specific employee
router.post("/action-required-requests", getActionRequiredODS);

// Get OD Request Approval Flow
router.get("/od-request-flow/:odRequestId", getODRequestFlow);

// Get All OD Requests with date filter
router.post("/get-all-od-requests", getAllODRequests);

module.exports = router;
