const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const { addPermissionType, updatePermissionType, deletePermissionType, getPermissionTypes } = require('../../controllers/PermissionControllerManagement/permissionTypesController');

const permissionTypesRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-permission-type',
        handlers: addPermissionType,
        description: 'Add a new permission type.',
        group: 'Permission Types'
    },
    {
        method: 'PUT',
        path: '/update-permission-type',
        handlers: updatePermissionType,
        description: 'Update an existing permission type.',
        group: 'Permission Types'
    },
    {
        method: 'DELETE',
        path: '/delete-permission-type/:permissionTypeId',
        handlers: deletePermissionType,
        description: 'Delete a permission type.',
        group: 'Permission Types'
    },
    {
        method: 'GET',
        path: '/get-permission-types',
        handlers: getPermissionTypes,
        description: 'Get all permission types.',
        group: 'Permission Types'
    }
];

const router = applyRoutes(permissionTypesRouteDefinitions);

module.exports = {
    router: router,
    definitions: permissionTypesRouteDefinitions
};