const express = require('express');
const router = express.Router();
const digilockerController = require('../controllers/digilockerController');

// route for generating Digilocker authorization URL
router.get('/generate-auth-url', digilockerController.generateAuthorizationUrl);

// route for handling Digilocker callback and exchanging code for access token
router.get('/get-access-token', digilockerController.getAccessToken);

// route for fetching user documents from Digilocker
router.get('/fetch-documents', digilockerController.getDocuments);

// route for refetching user documents from Digilocker
router.get('/refetch-documents', digilockerController.refetchDocuments);

module.exports = router;
