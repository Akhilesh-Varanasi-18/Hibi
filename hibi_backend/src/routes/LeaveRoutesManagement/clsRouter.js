const express = require("express");
const router = express.Router();

const {getEmployeeClsAndOds, getAllCLBalance, getAllODBalance, assignOdsToEmployees, getOdAndClSummary, getClAndOdDateOfAnyEmployee, addClsOrOdsToEmployees, removeClsOrOdsFromEmployees } = require("../../controllers/LeaveContollerManagement/clController");

// get employee CL and ODs
router.get("/employee-cls-ods", getEmployeeClsAndOds);

// get all employees CL balance
router.get("/all-employees-cl-balance", getAllCLBalance);

//get all employees OD balance
router.get("/all-employees-od-balance", getAllODBalance);

// Assign ods to employees
router.post("/assign-employee-ods", assignOdsToEmployees);

// Get OD and CL summary
router.post("/od-and-cl-summary", getOdAndClSummary);

// Get CL and OD dates of any employee
router.post("/cl-and-od-data-of-any-employee", getClAndOdDateOfAnyEmployee);

// Add CLs or ODs to employees
router.post("/add-cls-or-ods-to-employees", addClsOrOdsToEmployees);

// Remove CLs or ODs from employees
router.post("/remove-cls-or-ods-from-employees", removeClsOrOdsFromEmployees);


module.exports = router;
