const express = require('express');
const multer = require('multer');
const { applyRoutes } = require('../../utils/routerUtils');
const employeeBankDetailsController = require('../../controllers/EmployeeControllerManagement/employeeBankDetailsController');

// Multer setup for file upload (memory storage for direct S3 upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const employeeBankDetailsRouteDefinitions = [
    {
        method: 'POST',
        path: '/create',
        // Use multer middleware for file upload (field: 'bankPassBookFile')
        handlers: [upload.single('bankPassBookFile'), employeeBankDetailsController.addEmployeeBankDetails],
        description: 'Add employee bank details.',
        group: 'Employee Data'
    },
    {
        method: 'GET',
        path: '/get',
        handlers: employeeBankDetailsController.getEmployeeBankDetails,
        description: 'Get employee bank details.',
        group: 'Employee Data'
    },
    {
        method: 'PATCH',
        path: '/approve/:id',
        handlers: employeeBankDetailsController.approveEmployeeBankDetails,
        description: 'Approve employee bank details (Accountant only).',
        group: 'Employee Data'
    },
    {
        method: 'PUT',
        path: '/update',
        handlers: [upload.single('bankPassBookFile'), employeeBankDetailsController.updateEmployeeBankDetails],
        description: 'Update employee bank details.',
        group: 'Employee Data'
    }
];

const router = applyRoutes(employeeBankDetailsRouteDefinitions);

module.exports = {
    router: router,
    definitions: employeeBankDetailsRouteDefinitions
};