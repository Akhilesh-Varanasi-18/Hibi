const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const {
  addAttendenceStatusTypes,
  getAttendanceStatusTypes,
  updateAttendenceStatusTypes,
  deleteAttendenceStatusTypes,
} = require('../../controllers/AttendenceControler/attendenceStatusTypesController');

const attendanceStatusTypesRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-attendance-status',
        handlers: addAttendenceStatusTypes,
        description: 'Add a new attendance status type.',
        group: 'Attendance Management'
    },
    {
        method: 'GET',
        path: '/get-attendance-status',
        handlers: getAttendanceStatusTypes,
        description: 'Get all attendance status types.',
        group: 'Attendance Management'
    },
    {
        method: 'PUT',
        path: '/update-attendance-status',
        handlers: updateAttendenceStatusTypes,
        description: 'Update an existing attendance status type.',
        group: 'Attendance Management'
    },
    {
        method: 'DELETE',
        path: '/delete-attendance-status/:id',
        handlers: deleteAttendenceStatusTypes,
        description: 'Delete an attendance status type.',
        group: 'Attendance Management'
    }
];

const router = applyRoutes(attendanceStatusTypesRouteDefinitions);

module.exports = {
    router: router,
    definitions: attendanceStatusTypesRouteDefinitions
};