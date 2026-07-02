const express = require("express");
const { applyRoutes } = require('../utils/routerUtils');
const {
  addOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationData,
  addOrganizationHead,
  getOrganizationAndHeadData,
  getGSTOrgData,
  addOrganizationHeadChangeRequest,
  processOrganizationHeadChangeRequest,
  finalizeOrganizationHeadChangeRequest,
  updateOrganizationAssets
} = require("../controllers/organizationController");

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 5 // Allow up to 5 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only jpg, jpeg, png, svg, and webp files are allowed'), false);
        }
    }
});

const organizationRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-organization',
        handlers: addOrganization,
        description: 'Add a new organization.',
        group: 'Organization'
    },
    {
        method: 'PUT',
        path: '/update-organization',
        handlers: updateOrganization,
        description: 'Update an existing organization.',
        group: 'Organization'
    },
    {
        method: 'DELETE',
        path: '/delete-organization/:organizationId',
        handlers: deleteOrganization,
        description: 'Delete an organization.',
        group: 'Organization'
    },
    {
        method: 'POST',
        path: '/add-organization-head',
        handlers: addOrganizationHead,
        description: 'Add a head to an organization.',
        group: 'Organization'
    },
    {
        method: 'GET',
        path: '/get-organization-and-head-data',
        handlers: getOrganizationAndHeadData,
        description: 'Get organization and head data.',
        group: 'Organization'
    },
    {
        method: 'GET',
        path: '/get-gst-data/:gstNumber',
        handlers: getGSTOrgData,
        description: 'Get organization data by GST number.',
        group: 'Organization'
    },
    {
        method: 'POST',
        path: '/add-head-change-request',
        handlers: addOrganizationHeadChangeRequest,
        description: 'Add an organization head change request.',
        group: 'Organization'
    },
    {
        method: 'POST',
        path: '/process-head-change-request',
        handlers: processOrganizationHeadChangeRequest,
        description: 'Process an organization head change request.',
        group: 'Organization'
    },
    {
        method: 'POST',
        path: '/finalize-head-change-request',
        handlers: finalizeOrganizationHeadChangeRequest,
        description: 'Finalize an organization head change request.',
        group: 'Organization'
    },
    {
        method: 'GET',
        path: '/get-organization-data',
        handlers: getOrganizationData,
        description: 'Get all organization data.',
        group: 'Organization'
    },
    {
        method: 'PUT',
        path: '/update-organization-assets',
        handlers: [
            upload.fields([
                { name: 'orgLogo', maxCount: 1 },
                { name: 'orgStamp', maxCount: 1 },
                { name: 'orgBanner', maxCount: 1 }
            ]),
            updateOrganizationAssets
        ],
        description: 'Update organization assets.',
        group: 'Organization'
    }
];

const router = applyRoutes(organizationRouteDefinitions);

module.exports = {
    router: router,
    definitions: organizationRouteDefinitions
};
