const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const { addWFHRequest, processWFHRequest, getActionRequiredWFHS, getEmployeWFHRequests, cancelWFHRequest, getWFHRequestFlow ,getNotifyToNames, getAllWFHRequests } = require('../../controllers/PermissionControllerManagement/workFromHomeRequestController');

const wfhRequestRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-request',
        handlers: addWFHRequest,
        description: 'Add a new wfh request.',
        group: 'wfh Requests'
    },
    {
        method: 'POST',
        path: '/process-request',
        handlers: processWFHRequest,
        description: 'Process a wfh request.',
        group: 'wfh Requests'
    },
    {
        method: 'POST',
        path: '/get-employee-requests',
        handlers: getEmployeWFHRequests,
        description: 'Get wfh requests for an employee.',
        group: 'wfh Requests'
    },
    {
        method: 'POST',
        path: '/get-action-required-requests',
        handlers: getActionRequiredWFHS,
        description: 'Get action required WFH Requests.',
        group: 'wfh Requests'
    },
    {
        method: 'GET',
        path: '/get-request-flow/:wfhRequestId',
        handlers: getWFHRequestFlow,
        description: 'Get the wfh request flow.',
        group: 'wfh Requests'
    },
    {
        method: 'POST',
        path: '/cancel-wfh-request',
        handlers: cancelWFHRequest,
        description: 'Cancel a wfh request.',
        group: 'wfh Requests'
    },
    {
        method: 'get',
        path: '/get-approver-names/:wfhRequestId',
        handlers: getNotifyToNames,
        description: 'Get names of users to notify for a permission request.',
        group: 'Permission Requests'
    },
    {
        method: 'POST',
        path: '/get-all-wfh-requests',
        handlers: getAllWFHRequests,
        description: 'Get all WFH requests.',
        group: 'wfh Requests'
    }
];

const router = applyRoutes(wfhRequestRouteDefinitions);

module.exports = {
    router: router,
    definitions: wfhRequestRouteDefinitions
};