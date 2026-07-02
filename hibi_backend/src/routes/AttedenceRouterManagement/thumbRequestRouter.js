const express = require("express");
const router = express.Router();
const {
  createThumbRequest,
    getThumbRequests,
    processThumbRequest,
    getActionRequiredThumbs,
    getNotifyToNames,
    getAllThumbRequests,
    cancelThumbRequest
    
} = require("../../controllers/AttendenceControler/thumbRequestController");


// Create a new thumb request
router.post("/add-thumb-request", createThumbRequest);

// Get all thumb requests
router.post("/get-thumb-requests", getThumbRequests);

// Process a thumb request (approve/reject)
router.post("/process-thumb-request", processThumbRequest);

// Get action required thumb requests
router.post("/get-action-required-thumbs", getActionRequiredThumbs);


// Get names of approvers for a thumb request
router.post("/get-approver-names", getNotifyToNames );

// Get all thumb requests
router.post("/get-all-thumb-requests", getAllThumbRequests);

// Cancel a thumb request
router.post("/cancel-thumb-request", cancelThumbRequest);


module.exports = router;
