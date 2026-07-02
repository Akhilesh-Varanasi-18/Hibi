const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const designationController = require('../../controllers/EmployeeControllerManagement/designationController');

const designationRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-designation',
        handlers: designationController.addNewDesignation,
        description: 'Add a new designation.',
        group: 'Designation Management'
    },
    {
        method: 'GET',
        path: '/get-all-designations',
        handlers: designationController.getAllDesignations,
        description: 'Get all designations.',
        group: 'Designation Management'
    },
    {
        method: 'PUT',
        path: '/update-designation',
        handlers: designationController.updateDesignation,
        description: 'Update an existing designation.',
        group: 'Designation Management'
    },
    {
        method: 'DELETE',
        path: '/delete-designation/:id',
        handlers: designationController.deleteDesignation,
        description: 'Delete a designation.',
        group: 'Designation Management'
    }
];

const router = applyRoutes(designationRouteDefinitions);

module.exports = {
    router: router,
    definitions: designationRouteDefinitions
};