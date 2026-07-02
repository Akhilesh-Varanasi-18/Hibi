const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const GovernmentIdTypesController = require('../../controllers/EmployeeControllerManagement/governmentIdTypesController');

const governmentIdTypesRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-type',
        handlers: GovernmentIdTypesController.addGovernmentIdType,
        description: 'Add a new government ID type.',
        group: 'Employee Data'
    },
    {
        method: 'PUT',
        path: '/update-type',
        handlers: GovernmentIdTypesController.updateGovernmentIdType,
        description: 'Update an existing government ID type.',
        group: 'Employee Data'
    },
    {
        method: 'GET',
        path: '/get-all-types',
        handlers: GovernmentIdTypesController.getAllGovernmentIdTypes,
        description: 'Get all government ID types.',
        group: 'Employee Data'
    },
    {
        method: 'DELETE',
        path: '/delete-type/:typeId',
        handlers: GovernmentIdTypesController.deleteGovernmentIdType,
        description: 'Delete a government ID type.',
        group: 'Employee Data'
    }
];

const router = applyRoutes(governmentIdTypesRouteDefinitions);

module.exports = {
    router: router,
    definitions: governmentIdTypesRouteDefinitions
};