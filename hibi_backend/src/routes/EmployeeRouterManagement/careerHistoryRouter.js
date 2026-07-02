const express = require("express");
const router = express.Router();
const careerHistoryController = require('../../controllers/EmployeeControllerManagement/careerHistoryController');

router.post('/create', careerHistoryController.createCareerHistory);

router.get('/get', careerHistoryController.getCareerHistories);

router.put('/update/:careerHistoryId', careerHistoryController.updateCareerHistory);

router.delete('/delete/:careerHistoryId', careerHistoryController.deleteCareerHistory);

module.exports = router;