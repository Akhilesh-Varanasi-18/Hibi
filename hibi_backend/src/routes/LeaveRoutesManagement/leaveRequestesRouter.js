const express = require("express");
const { applyRoutes } = require('../../utils/routerUtils');
const {
  addLeaveRequest,
  processLeaveRequest,
  deleteLeaveRequest,
  getEmployeeLeaveRequests,
  getActionRequiredLeaves,
  getLeaveRequestFlow,
  dummyNotification,
  getTemporaryAssignmentData,
  cancelLeaveRequest,
    getNotifyToNames,
    getWorkingDays,
    getLeavesData,
    getTopLeavesEmployees,
    getAllLeaveRequests
} = require("../../controllers/LeaveContollerManagement/leaveRequestController");

const leaveRequestsRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-leave-request',
        handlers: addLeaveRequest,
        description: 'Add a new leave request.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/process-leave-request',
        handlers: processLeaveRequest,
        description: 'Process a leave request (approve/reject).',
        group: 'Leave Management'
    },
    // {
    //     method: 'DELETE',
    //     path: '/delete-leave-request/:leaveRequestId',
    //     handlers: deleteLeaveRequest,
    //     description: 'Delete a leave request.',
    //     group: 'Leave Management'
    // },
    {
        method: 'POST',
        path: '/get-employee-leave-requests',
        handlers: getEmployeeLeaveRequests,
        description: 'Get leave requests for an employee.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-action-required-leaves',
        handlers: getActionRequiredLeaves,
        description: 'Get action required leave requests.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-leave-request-flow/:leaveRequestId',
        handlers: getLeaveRequestFlow,
        description: 'Get leave request flow.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/send-dummy-notification',
        handlers: dummyNotification,
        description: 'Send a dummy notification.',
        group: 'Notifications'
    },
    {
        method: 'GET',
        path: '/get-temporary-assignment-data',
        handlers: getTemporaryAssignmentData,
        description: 'Get temporary assignment data.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/cancel-leave-request',
        handlers: cancelLeaveRequest,
        description: 'Cancel a leave request.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-approver-names',
        handlers: getNotifyToNames,
        description: 'Get names of approvers for a leave request.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-working-days',
        handlers: getWorkingDays,
        description: 'Get working days between two dates.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-leaves-data',
        handlers: getLeavesData,
        description: 'Get leaves data.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-top-leaves-employees',
        handlers: getTopLeavesEmployees,
        description: 'Get employees with the highest leaves taken.',
        group: 'Leave Management'
    },
    {
        method: 'POST',
        path: '/get-all-leave-requests',
        handlers: getAllLeaveRequests,
        description: 'Get all leave requests within a date range.',
        group: 'Leave Management'
    }
];

const router = applyRoutes(leaveRequestsRouteDefinitions);

module.exports = {
    router: router,
    definitions: leaveRequestsRouteDefinitions
};
