const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const employeePersonalDetailsController = require('../../controllers/EmployeeControllerManagement/employeePersonalDetailsController');

const employeePersonalDetailsRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-details',
        handlers: employeePersonalDetailsController.addNewPersonalDetails,
        description: 'Add personal details for an employee.',
        group: 'Employee Data'
    },
    {
        method: 'GET',
        path: '/get-details',
        handlers: employeePersonalDetailsController.getPersonalDetails,
        description: 'Get personal details of an employee.',
        group: 'Employee Data'
    },
    {
        method: 'PUT',
        path: '/update-details',
        handlers: employeePersonalDetailsController.updatePersonalDetails,
        description: 'Update personal details of an employee.',
        group: 'Employee Data'
    }
];

const router = applyRoutes(employeePersonalDetailsRouteDefinitions);

module.exports = {
    router: router,
    definitions: employeePersonalDetailsRouteDefinitions
};