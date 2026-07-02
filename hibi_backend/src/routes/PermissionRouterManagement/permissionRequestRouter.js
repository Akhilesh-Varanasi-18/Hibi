const express = require("express");
const { applyRoutes } = require("../../utils/routerUtils");
const {
  addPermissionRequest,
  processPermissionRequest,
  deletePermissionRequest,
  getEmployeePermissionRequests,
  getActionRequiredPermissions,
  getPermissionRequestFlow,
  cancelPermissionRequest,
  getNotifyToNames,
  getAllPermissionRequests,
} = require("../../controllers/PermissionControllerManagement/permissionRequestController");

const permissionRequestRouteDefinitions = [
  {
    method: "POST",
    path: "/add-request",
    handlers: addPermissionRequest,
    description: "Add a new permission request.",
    group: "Permission Requests",
  },
  {
    method: "POST",
    path: "/process-request",
    handlers: processPermissionRequest,
    description: "Process a permission request.",
    group: "Permission Requests",
  },
  // {
  //     method: 'DELETE',
  //     path: '/delete-request/:permissionRequestId',
  //     handlers: deletePermissionRequest,
  //     description: 'Delete a permission request.',
  //     group: 'Permission Requests'
  // },
  {
    method: "POST",
    path: "/get-employee-requests",
    handlers: getEmployeePermissionRequests,
    description: "Get permission requests for an employee.",
    group: "Permission Requests",
  },
  {
    method: "POST",
    path: "/get-action-required-permissions",
    handlers: getActionRequiredPermissions,
    description: "Get action required permissions.",
    group: "Permission Requests",
  },
  {
    method: "GET",
    path: "/get-permission-request-flow/:permissionRequestId",
    handlers: getPermissionRequestFlow,
    description: "Get the permission request flow.",
    group: "Permission Requests",
  },
  {
    method: "POST",
    path: "/cancel-permission-request",
    handlers: cancelPermissionRequest,
    description: "Cancel a permission request.",
    group: "Permission Requests",
  },
  {
    method: "POST",
    path: "/get-approver-names",
    handlers: getNotifyToNames,
    description: "Get names of users to notify for a permission request.",
    group: "Permission Requests",
  },
  {
    method: "POST",
    path: "/get-all-permission-requests",
    handlers: getAllPermissionRequests,
    description: "Get all permission requests within a date range.",
    group: "Permission Requests",
  },
];

const router = applyRoutes(permissionRequestRouteDefinitions);

module.exports = {
  router: router,
  definitions: permissionRequestRouteDefinitions,
};
