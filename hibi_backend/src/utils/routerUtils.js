const express = require('express');

/**
 * Applies an array of route definitions to an Express router.
 * @param {Array<object>} routeDefinitions - An array of route definition objects.
 * @returns {express.Router} - The configured Express router.
 */
function applyRoutes(routeDefinitions) {
  const router = express.Router();
  routeDefinitions.forEach(route => {
    const method = route.method.toLowerCase();
    
    // Ensure handlers is always an array
    const routeHandlers = Array.isArray(route.handlers) ? route.handlers : [route.handlers];
    
    if (router[method]) {
      router[method](route.path, ...routeHandlers);
    } else {
      console.error(`Invalid HTTP method: ${route.method} for path: ${route.path}`);
    }
  });
  return router;
}

module.exports = { applyRoutes };
