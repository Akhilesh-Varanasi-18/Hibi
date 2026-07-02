const express = require('express');
const router = express.Router();
const { allDefinedRoutes } = require('./index.js');

/**
 * @route GET /api/meta-data/routes
 * @description Provides a list of all discoverable API routes in the backend.
 * @access Protected (should be limited to admin users)
 */
router.get('/routes', (req, res) => {
  // Important: We only send the metadata, not the backend handler functions.
  const routeInfo = allDefinedRoutes.map(({ handlers, ...rest }) => rest);
  res.status(200).json({
    success: true,
    message: 'Routes fetched successfully',
    data: routeInfo
  });
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const { allDefinedRoutes } = require('./index.js');
// const groupDefinitions = require('../config/groupDefinitions');

// /**
//  * @route GET /api/meta-data/routes
//  * @description Provides a list of all discoverable API routes in the backend, grouped by category with descriptions.
//  * @access Protected (should be limited to admin users)
//  */
// router.get('/routes', (req, res) => {
//   const groupedRoutes = groupDefinitions.map(groupDef => {
//     const routesInGroup = allDefinedRoutes
//       .filter(route => route.group === groupDef.name)
//       .map(({ handlers, ...rest }) => rest); // Exclude handlers

//     return {
//       name: groupDef.name,
//       description: groupDef.description,
//       routes: routesInGroup
//     };
//   });

//   res.status(200).json({
//     success: true,
//     message: 'Grouped routes fetched successfully',
//     data: groupedRoutes
//   });
// });

// module.exports = router;
