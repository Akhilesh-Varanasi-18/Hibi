const router = require("express").Router();
const {uploadPaySlipsData, getPaySlipData, getPaySlipTemplate } = require("../controllers/paySlipController");
const multer = require("multer");
const upload = multer();

const uploadMiddleware = upload.single("file");

router.post("/upload-payslips", uploadMiddleware, uploadPaySlipsData);
router.post("/get-payslips", getPaySlipData);
router.get("/get-payslip-template", getPaySlipTemplate);

module.exports = router;
