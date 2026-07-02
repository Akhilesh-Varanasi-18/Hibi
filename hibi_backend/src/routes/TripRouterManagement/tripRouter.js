const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const tripController = require('../../controllers/TripController/tripController');

const tripRouteDefinitions = [
    {
        method: 'POST',
        path: '/create-trip',
        handlers: tripController.createTrip,
        description: 'Create a new trip.',
        group: 'Trip Management'
    },
    {
        method: 'GET',
        path: '/get-trips',
        handlers: tripController.getTrips,
        description: 'Get all active trips.',
        group: 'Trip Management'
    },
    {
        method: 'PUT',
        path: '/update-trip',
        handlers: tripController.updateTrip,
        description: 'Update a trip by ID.',
        group: 'Trip Management'
    },
    {
        method: 'PATCH',
        path: '/change-trip-status',
        handlers: tripController.changeTripStatus,
        description: 'Change the status of a trip.',
        group: 'Trip Management'
    },
    {
        method: 'DELETE',
        path: '/delete-trip/:tripId',
        handlers: tripController.deleteTrip,
        description: 'Delete a trip.',
        group: 'Trip Management'
    }
];

const router = applyRoutes(tripRouteDefinitions);

module.exports = {
    router: router,
    definitions: tripRouteDefinitions
};