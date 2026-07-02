const express = require('express');
const announcementController = require('../controllers/announcementController');

const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 5 // Allow up to 5 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only jpg, jpeg, png, svg, and webp files are allowed'), false);
        }
    }
});


// Route to create a new announcement (multiple files)
router.post('/create-announcement', upload.array('images', 5), announcementController.createAnnouncement);

// Route to get all announcements
router.get('/get-announcements', announcementController.getAnnouncements);

// Route to delete an announcement by ID
router.delete('/delete-announcement/:id', announcementController.deleteAnnouncement);

module.exports = router;