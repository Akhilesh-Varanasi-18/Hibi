const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const employeeContactsController = require('../../controllers/EmployeeControllerManagement/employeeContactsController');

const employeeContactsRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-contact',
        handlers: employeeContactsController.addEmployeeContacts,
        description: 'Add a new employee contact.',
        group: 'Employee Data'
    },
    {
        method: 'PUT',
        path: '/update-contact',
        handlers: employeeContactsController.updateEmployeeContacts,
        description: 'Update an existing employee contact.',
        group: 'Employee Data'
    },
    {
        method: 'GET',
        path: '/get-contacts',
        handlers: employeeContactsController.getAllContacts,
        description: 'Get all employee contacts.',
        group: 'Employee Data'
    },
    {
        method: 'DELETE',
        path: '/delete-contact/:contactId',
        handlers: employeeContactsController.deleteEmployeeContact,
        description: 'Delete an employee contact.',
        group: 'Employee Data'
    }
];

const router = applyRoutes(employeeContactsRouteDefinitions);

module.exports = {
    router: router,
    definitions: employeeContactsRouteDefinitions
};