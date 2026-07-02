const express = require('express');
const { applyRoutes } = require('../utils/routerUtils');
const { addProductManager, updateProductManager, getAllOrganizationAndHeadData } = require('../controllers/projectManagerController');

const productManagerRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-product-manager',
        handlers: addProductManager,
        description: 'Add a new product manager.',
        group: 'Product Manager'
    },
    {
        method: 'PUT',
        path: '/update-product-manager',
        handlers: updateProductManager,
        description: 'Update an existing product manager.',
        group: 'Product Manager'
    },
    {
        method: 'GET',
        path: '/get-all-organizations-and-heads-data',
        handlers: getAllOrganizationAndHeadData,
        description: 'Get all organization and head data.',
        group: 'Product Manager'
    }
];

const router = applyRoutes(productManagerRouteDefinitions);

module.exports = {
    router: router,
    definitions: productManagerRouteDefinitions
};