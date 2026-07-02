const express = require('express');
const multer = require('multer');
const employeesController = require('../../controllers/EmployeeControllerManagement/employeesController');
const { downloadEmployeeBulkTemplate, downloadEmployeeReferenceData, uploadEmployeeExcel } = require('../../controllers/EmployeeControllerManagement/employeeBulkController');
const { applyRoutes } = require('../../utils/routerUtils');

// --- Multer Configurations ---

const storage = multer.memoryStorage();

// Excel file upload configuration
const excelUpload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        const allowedExtensions = ['.xls', '.xlsx', '.csv'];
        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel (.xls, .xlsx) and CSV files are allowed'), false);
        }
    }
});

// Image upload configuration
const imageUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/webp', 'image/svg+xml'];
        const allowedExtensions = ['.webp', '.svg'];
        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image type. Only WEBP and SVG files are allowed'), false);
        }
    }
});


// --- Route Definitions ---

const employeeRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-employee',
        handlers: [imageUpload.single('profileImage'), employeesController.createEmployee],
        description: 'Create a new employee, with profile image upload.',
        group: 'Employee Management'
    },
    {
        method: 'POST',
        path: '/get-organization-head',
        handlers: employeesController.getOrganizationHead,
        description: 'Get the primary head of the organization.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-team-leads',
        handlers: employeesController.getAllTeamLeads,
        description: 'Get all employees designated as Team Leads.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-managers',
        handlers: employeesController.getAllManagers,
        description: 'Get all employees designated as Managers.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-employee-data',
        handlers: employeesController.getEmployeeData,
        description: 'Get profile data for the currently logged-in employee.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-general-employees',
        handlers: employeesController.getGeneralEmployees,
        description: 'Get all employees without a special designation (e.g., not leads or managers).',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-all-employees-with-privilege-and-role',
        handlers: employeesController.getAllEmployeesWithPrivilegeAndRole,
        description: 'Get a list of all employees including their privilege and role information.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-notify-to-Data',
        handlers: employeesController.getNotifyToData,
        description: 'Get the hierarchy of users to be notified for an employee.',
        group: 'Employee Hierarchy'
    },
    {
        method: 'POST',
        path: '/add-temp-privilege',
        handlers: employeesController.addTempPrivilege,
        description: 'Assign a temporary privilege to an employee.',
        group: 'Temporary Privileges'
    },
    {
        method: 'POST',
        path: '/remove-temp-privilege',
        handlers: employeesController.removeTempPrivilege,
        description: 'Remove a temporary privilege from an employee.',
        group: 'Temporary Privileges'
    },
    {
        method: 'GET',
        path: '/get-temp-privilege-employees',
        handlers: employeesController.getTemporaryPrivilegeEmployees,
        description: 'Get all employees who currently have temporary privileges.',
        group: 'Temporary Privileges'
    },
    {
        method: 'POST',
        path: '/bulk-upload-employee-data',
        handlers: [excelUpload.single('excelFile'), uploadEmployeeExcel],
        description: 'Bulk upload new employee data from an Excel/CSV file.',
        group: 'Employee Bulk Operations'
    },
    {
        method: 'PATCH',
        path: '/update-employee',
        handlers: [imageUpload.single('profileImage'), employeesController.updateEmployee],
        description: "Update an existing employee's details, with profile image upload.",
        group: 'Employee Management'
    },
    {
        method: 'GET',
        path: '/download-template',
        handlers: downloadEmployeeBulkTemplate,
        description: 'Download the Excel template for bulk employee upload.',
        group: 'Employee Bulk Operations'
    },
    {
        method: 'GET',
        path: '/download-reference-data',
        handlers: downloadEmployeeReferenceData,
        description: 'Download reference data (e.g., department IDs, role IDs) for the bulk upload template.',
        group: 'Employee Bulk Operations'
    },
    {
        method: 'GET',
        path: '/get-employee-shift',
        handlers: employeesController.getShiftDetails,
        description: 'Get shift details for the currently logged-in employee.',
        group: 'Employee Information'
    },
    {
        method: 'GET',
        path: '/get-all-employees-for-updation',
        handlers: employeesController.getAllEmployeesDateForUpdation,
        description: 'Get a list of all employees formatted for update operations.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-employee-dob',
        handlers: employeesController.getEmployeeDOB,
        description: 'Get employee DOB details.',
        group: 'Employee Information'
    },
    {
        method: 'GET',
        path: '/get-created-employees',
        handlers: employeesController.getCreatedEmployees,
        description: 'Get employees created by a specific employee.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-entire-org-employees',
        handlers: employeesController.getEntireOrgEmployees,
        description: 'Get all employees of an organization.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-employees-by-level',
        handlers: employeesController.getEmployeesByLevel,
        description: 'Get employees filtered by their organizational level.',
        group: 'Employee Retrieval'
    },
    {
        method: 'GET',
        path: '/get-employees-name-and-code',
        handlers: employeesController.getEmployeesNameAndCode,
        description: 'Get names and codes of all employees.',
        group: 'Employee Retrieval'
    },
];

// --- Router Initialization ---

const router = applyRoutes(employeeRouteDefinitions);

// --- Error Handling Middleware for Multer ---
// This must be applied after the routes are defined.
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File size too large. Maximum size allowed is ${error.field === 'excelFile' ? '10MB' : '5MB'}`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Only 1 file allowed at a time'
            });
        }
    }
    if (error.message.includes('Invalid file type') || error.message.includes('Invalid image type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    // Fallback for other upload errors
    if (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'File upload error',
            error: error.message
        });
    }
    next();
});

module.exports = {
    router: router,
    definitions: employeeRouteDefinitions
};
