const express = require('express');
const { applyRoutes } = require('../utils/routerUtils');
const dailyWorkReportController = require('../controllers/AttendenceControler/dailyWorkreportController');

const workReportRouteDefinitions = [
    {
        method: 'POST',
        path: '/work-report',
        handlers: dailyWorkReportController.addWorkReport,
        description: 'Add a daily work report.',
        group: 'Work Reports'
    }
];

const router = applyRoutes(workReportRouteDefinitions);

module.exports = {
    router: router,
    definitions: workReportRouteDefinitions
};