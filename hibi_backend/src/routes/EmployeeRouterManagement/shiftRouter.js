const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const shiftController = require('../../controllers/EmployeeControllerManagement/shiftController');

const shiftRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-new-shift',
        handlers: shiftController.addNewShift,
        description: 'Add a new shift.',
        group: 'Shift Management'
    },
    {
        method: 'GET',
        path: '/get-all-shifts',
        handlers: shiftController.getAllShifts,
        description: 'Get all shifts.',
        group: 'Shift Management'
    },
    {
        method: 'PUT',
        path: '/update-shift',
        handlers: shiftController.updateShift,
        description: 'Update an existing shift.',
        group: 'Shift Management'
    },
    {
        method: 'DELETE',
        path: '/delete-shift/:shiftId',
        handlers: shiftController.deleteShift,
        description: 'Delete a shift.',
        group: 'Shift Management'
    }
];

const router = applyRoutes(shiftRouteDefinitions);

module.exports = {
    router: router,
    definitions: shiftRouteDefinitions
};
