const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const { addLeaveType, updateLeaveType, deleteLeaveType, getLeaveTypes } = require('../../controllers/LeaveContollerManagement/leaveTypeController');

const leaveTypesRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-leave-type',
        handlers: addLeaveType,
        description: 'Add a new leave type.',
        group: 'Leave Types'
    },
    {
        method: 'PUT',
        path: '/update-leave-type',
        handlers: updateLeaveType,
        description: 'Update an existing leave type.',
        group: 'Leave Types'
    },
    {
        method: 'DELETE',
        path: '/delete-leave-type/:leaveTypeId',
        handlers: deleteLeaveType,
        description: 'Delete a leave type.',
        group: 'Leave Types'
    },
    {
        method: 'GET',
        path: '/get-leave-types',
        handlers: getLeaveTypes,
        description: 'Get all leave types.',
        group: 'Leave Types'
    }
];

const router = applyRoutes(leaveTypesRouteDefinitions);

module.exports = {
    router: router,
    definitions: leaveTypesRouteDefinitions
};