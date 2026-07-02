const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const {
  getEmployeeAttendance,
  getAllEmployeeAttendence,
  getEmployeesStatusCount,
  getAttendedEmployeeCount,
  getTopAttendanceEmployees,
  attendencePunchProcessor,
  backfillFRSAttendanceController,
  getAttendanceDataFromDevice,
  addAttendanceToEmployees
} = require('../../controllers/AttendenceControler/attendencePunchesController');

const attendanceRouteDefinitions = [
    {
        method: 'POST',
        path: '/get-employee-attendance',
        handlers: getEmployeeAttendance,
        description: 'Get attendance data for a specific employee.',
        group: 'Attendance Management'
    },
        {
            method: 'POST',
            path: '/get-all-employee-attendance',
            handlers: getAllEmployeeAttendence,
            description: 'Get attendance data for all employees.',
            group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/get-employees-status',
        handlers: getEmployeesStatusCount,
        description: 'Get the count of employees by status.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/get-attended-employee-count',
        handlers: getAttendedEmployeeCount,
        description: 'Get the count of employees who attended on a specific date.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/get-top-attendance-employees',
        handlers: getTopAttendanceEmployees,
        description: 'Get the top employees by attendance.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/process-attendance-punches',
        handlers: attendencePunchProcessor,
        description: 'Process attendance punches for employees.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/backfill-frs-attendance',
        handlers: backfillFRSAttendanceController,
        description: 'Backfill FRS attendance punches and daily attendance for a date range.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/get-attendance-data-from-device',
        handlers: getAttendanceDataFromDevice,
        description: 'Get attendance data from the device.',
        group: 'Attendance Management'
    },
    {
        method: 'POST',
        path: '/add-attendance-to-employees',
        handlers: addAttendanceToEmployees,
        description: 'add attendance records to employees.',
        group: 'Attendance Management'
    },
  
];

const router = applyRoutes(attendanceRouteDefinitions);

module.exports = {
    router: router,
    definitions: attendanceRouteDefinitions
};
