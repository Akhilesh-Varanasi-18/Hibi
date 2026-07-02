const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const departmentController = require('../../controllers/EmployeeControllerManagement/departmentController');

const departmentRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-department',
        handlers: departmentController.createDepartment,
        description: 'Create a new department.',
        group: 'Department Management'
    },
    {
        method: 'GET',
        path: '/get-all-departments',
        handlers: departmentController.getAllDepartments,
        description: 'Get all departments.',
        group: 'Department Management'
    },
    {
        method: 'PUT',
        path: '/update-department',
        handlers: departmentController.updateDepartment,
        description: 'Update an existing department.',
        group: 'Department Management'
    },
    {
        method: 'DELETE',
        path: '/delete-department/:id',
        handlers: departmentController.deleteDepartment,
        description: 'Delete a department.',
        group: 'Department Management'
    }
];

const router = applyRoutes(departmentRouteDefinitions);

module.exports = {
    router: router,
    definitions: departmentRouteDefinitions
};