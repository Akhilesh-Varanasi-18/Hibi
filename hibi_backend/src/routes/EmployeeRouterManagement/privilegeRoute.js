const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const privilegeController = require('../../controllers/EmployeeControllerManagement/privilegeController');

const privilegeRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-privilege',
        handlers: privilegeController.createprivilege,
        description: 'Add a new privilege.',
        group: 'Privileges & Roles'
    },
    {
        method: 'POST',
        path: '/get-all-privileges',
        handlers: privilegeController.getAllprivileges,
        description: 'Get all privileges.',
        group: 'Privileges & Roles'
    },
    {
        method: 'PUT',
        path: '/update-privilege',
        handlers: privilegeController.updateprivilege,
        description: 'Update an existing privilege.',
        group: 'Privileges & Roles'
    },
    {
        method: 'DELETE',
        path: '/delete-privilege/:id',
        handlers: privilegeController.deleteprivilege,
        description: 'Delete a privilege.',
        group: 'Privileges & Roles'
    }
];

const router = applyRoutes(privilegeRouteDefinitions);

module.exports = {
    router: router,
    definitions: privilegeRouteDefinitions
};

