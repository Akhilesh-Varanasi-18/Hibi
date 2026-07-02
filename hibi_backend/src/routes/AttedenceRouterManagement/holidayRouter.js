const {addHolidays, uploadHolidays, updateHoliday, getHolidays, getHolidayTemplate, deleteHoliday} = require('../../controllers/AttendenceControler/holidaysController');
const express = require('express');
const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


// Add Holidays
router.post('/add-holidays', addHolidays);

// Upload Holidays
router.post('/upload-holidays', upload.single('file'), uploadHolidays);

// Update Holiday
router.post('/update-holiday', updateHoliday);

// Get Holidays
router.post('/get-holidays', getHolidays);

// Get Holiday Template
router.get('/get-holiday-template', getHolidayTemplate);

// Delete Holiday
router.delete('/delete-holiday/:holidayId', deleteHoliday);

module.exports = router;