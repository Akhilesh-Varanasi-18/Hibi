const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const permissionController = require('../../controllers/PermissionControllerManagement/permissionController');

const permissionRouteDefinitions = [
    {
        method: 'POST',
        path: '/',
        handlers: permissionController.createPermission,
        description: 'Create a new permission.',
        group: 'Permissions & Privileges'
    },
    {
        method: 'GET',
        path: '/',
        handlers: permissionController.getAllPermissions,
        description: 'Get all permissions for the organization.',
        group: 'Permissions & Privileges'
    },
    {
        method: 'PUT',
        path: '/:id',
        handlers: permissionController.updatePermission,
        description: 'Update an existing permission.',
        group: 'Permissions & Privileges'
    },
    {
        method: 'DELETE',
        path: '/:id',
        handlers: permissionController.deletePermission,
        description: 'Delete a permission.',
        group: 'Permissions & Privileges'
    }
];

const router = applyRoutes(permissionRouteDefinitions);

module.exports = {
    router: router,
    definitions: permissionRouteDefinitions
};