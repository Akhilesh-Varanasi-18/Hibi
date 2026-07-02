const express = require('express');
const { applyRoutes } = require('../utils/routerUtils');
const { addStatusType, updateStatusType, deleteStatusType, getStatusTypes } = require('../controllers/statusTypeController');

const statusTypeRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-status-type',
        handlers: addStatusType,
        description: 'Add a new status type.',
        group: 'Status Types'
    },
    {
        method: 'PUT',
        path: '/update-status-type',
        handlers: updateStatusType,
        description: 'Update an existing status type.',
        group: 'Status Types'
    },
    {
        method: 'DELETE',
        path: '/delete-status-type/:statusTypeId',
        handlers: deleteStatusType,
        description: 'Delete a status type.',
        group: 'Status Types'
    },
    {
        method: 'GET',
        path: '/get-status-types',
        handlers: getStatusTypes,
        description: 'Get all status types.',
        group: 'Status Types'
    }
];

const router = applyRoutes(statusTypeRouteDefinitions);

module.exports = {
    router: router,
    definitions: statusTypeRouteDefinitions
};