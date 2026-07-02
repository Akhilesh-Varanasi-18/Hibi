const express = require('express');
const router = express.Router();

const {
    addLeaveConsiderationType,
    getAllLeaveConsiderationTypes,
    updateLeaveConsiderationType,
    deleteLeaveConsiderationType
} = require('../../controllers/LeaveContollerManagement/leaveConsidarationController');

// Add Leave Consideration Type
router.post('/add-consideration-type', addLeaveConsiderationType);

// Get All Leave Consideration Types
router.get('/get-consideration-types', getAllLeaveConsiderationTypes);

// Update Leave Consideration Type
router.post('/update-consideration-type', updateLeaveConsiderationType);

// Delete Leave Consideration Type
router.delete('/delete-consideration-type/:considerationTypeId', deleteLeaveConsiderationType);


module.exports = router;

