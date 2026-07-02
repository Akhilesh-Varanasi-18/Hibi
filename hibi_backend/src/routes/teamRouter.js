const express = require('express');
const teamController = require('../controllers/teamController');
const { applyRoutes } = require('../utils/routerUtils');

// --- Route Definitions ---

const teamRouteDefinitions = [
    {
        method: 'POST',
        path: '/create-team',
        handlers: teamController.createTeam,
        description: 'Create a new team.',
        group: 'Team Management'
    },
    {
        method: 'DELETE',
        path: '/delete-team/:teamId',
        handlers: teamController.deleteTeam,
        description: 'Delete a team by its ID.',
        group: 'Team Management'
    },
    {
        method: 'PUT',
        path: '/update-team',
        handlers: teamController.updateTeam,
        description: 'Update an existing team\'s details.',
        group: 'Team Management'
    },
    {
        method: 'DELETE',
        path: '/delete-employee-from-team',
        handlers: teamController.deleteEmployeeFromTeam,
        description: 'Remove a specific employee from a team.',
        group: 'Team Management'
    },
    {
        method: 'GET',
        path: '/get-all-details',
        handlers: teamController.getAllDetails,
        description: 'Get all details for teams, with data scoped by user role (e.g., HR vs. Manager).',
        group: 'Team Management'
    },
    {
        method: 'GET',
        path: '/get-non-team-employees',
        handlers: teamController.getTeamData,
        description: 'Get a list of employees who are not currently assigned to any team.',
        group: 'Team Management'
    },
    {
        method: 'PUT',
        path: '/change-role-in-team',
        handlers: teamController.changeRoleInTeam,
        description: 'Change an employee\'s role within a specific team.',
        group: 'Team Management'
    },
    {
        method: 'PUT',
        path: '/change-team',
        handlers: teamController.changeTeam,
        description: 'Change an employee\'s team.',
        group: 'Team Management'
    },
    {
        method: 'GET',
        path: '/get-team-id-and-name',
        handlers: teamController.getTeamIdAndName,
        description: 'Get team IDs and names.',
        group: 'Team Management'
    }
];

// --- Router Initialization ---

const router = applyRoutes(teamRouteDefinitions);

module.exports = {
    router: router,
    definitions: teamRouteDefinitions
};
