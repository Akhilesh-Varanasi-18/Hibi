const express = require("express");
const router = express.Router();


const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50 MB per file
		files: 5 // Maximum 5 files per request
	},
});

const bugReportController = require('../../controllers/ReviewController/bugReportController');

// Route to create a new bug report (with file upload support)
router.post('/create-bug-report', upload.array('attachments'), bugReportController.createBugReport);

// Route to get all bug reports
router.get('/all-bug-reports', bugReportController.getAllBugReports);

// Route to update a bug report's status and remarks
router.put('/update-bug-report', bugReportController.updateBugReport);

module.exports = router;