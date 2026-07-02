const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const rolesController = require('../../controllers/EmployeeControllerManagement/rolesController');

const rolesRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-role',
        handlers: rolesController.addNewRole,
        description: 'Add a new role.',
        group: 'Privileges & Roles'
    },
    {
        method: 'POST',
        path: '/get-all-roles',
        handlers: rolesController.getAllRoles,
        description: 'Get all roles.',
        group: 'Privileges & Roles'
    },
    {
        method: 'PUT',
        path: '/update-role',
        handlers: rolesController.updateRoles,
        description: 'Update an existing role.',
        group: 'Privileges & Roles'
    },
    {
        method: 'DELETE',
        path: '/delete-role/:roleId',
        handlers: rolesController.deleteRole,
        description: 'Delete a role.',
        group: 'Privileges & Roles'
    }
];

const router = applyRoutes(rolesRouteDefinitions);

module.exports = {
    router: router,
    definitions: rolesRouteDefinitions
};