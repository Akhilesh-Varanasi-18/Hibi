const express = require('express');
const { applyRoutes } = require('../../utils/routerUtils');
const tripTypeController = require('../../controllers/TripController/tripTypeController');

const tripTypeRouteDefinitions = [
    {
        method: 'POST',
        path: '/create',
        handlers: tripTypeController.addTripType,
        description: 'Create a new trip type.',
        group: 'Trip Types'
    },
    {
        method: 'GET',
        path: '/get-all',
        handlers: tripTypeController.getTripTypes,
        description: 'Get all trip types.',
        group: 'Trip Types'
    },
    {
        method: 'PUT',
        path: '/update',
        handlers: tripTypeController.updateTripType,
        description: 'Update a trip type.',
        group: 'Trip Types'
    },
    {
        method: 'DELETE',
        path: '/delete/:tripId',
        handlers: tripTypeController.deleteTripType,
        description: 'Delete a trip type.',
        group: 'Trip Types'
    }
];

const router = applyRoutes(tripTypeRouteDefinitions);

module.exports = {
    router: router,
    definitions: tripTypeRouteDefinitions
};