const jwt = require('jsonwebtoken');
const employeeSchema = require('../models/EmployeeSchemaManagement/employeeSchema');
const productManagerSchema = require('../models/productManagerSchema');
const privilegeSchema = require('../models/EmployeeSchemaManagement/privilegeSchema');
const roleSchema = require('../models/EmployeeSchemaManagement/rolesSchema');
const { COOKIE_NAME } = require('./setToken');
const { match } = require('path-to-regexp');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const productManagerAccessbilityRoutes = [
    '/api/employee/add-new-employee',
    '/api/organization/add-organization', '/api/organization/update-organization', '/api/organization/delete-organization/:id',
    '/api/organization/add-organization-head', '/api/organization/get-organization-and-head-data', '/api/organization/get-gst-data/:gstNumber',
    '/api/organization/get-organization-data', '/api/employee/bulk-upload-employee-data', '/api/employee/get-employee-data', 
    '/api/product-manager/get-all-organizations-and-heads-data', '/api/roles/get-all-roles', '/api/privilege/get-all-privileges'
];

const protectedRoutes = [
    '/api/department/add-new-department', '/api/department/update-department', '/api/department/delete-department/:id',
    '/api/designation/add-new-designation', '/api/designation/update-designation', '/api/designation/delete-designation/:id',
    '/api/employee-history/create',
    '/api/employee/add-new-employee', '/api/employee/get-organization-head',
    '/api/government-id-types/add-new-type', '/api/government-id-types/update-type', '/api/government-id-types/delete-type/:id',
    '/api/privilege/add-new-privilege', '/api/privilege/update-privilege', '/api/privilege/delete-privilege/:id',
    '/api/roles/add-new-role', '/api/roles/update-role', '/api/roles/delete-role/:roleId',
    '/api/shift/add-new-shift', '/api/shift/update-shift', '/api/shift/delete-shift/:id',
    '/api/leave-types/add-new-type', '/api/leave-types/update-type', '/api/leave-types/delete-type/:id',
    '/api/permission-types/add-permission-type', '/api/permission-types/update-permission-type', '/api/permission-types/delete-permission-type/:id',
    '/api/trip/create-trip', '/api/trip/get-active-trips',
    '/api/trip-type/create', '/api/trip-type/get-all', '/api/trip-type/delete/:id', '/api/trip-type/update',
    '/api/organization/add-head-change-request', '/api/organization/process-head-change-request', '/api/organization/finalize-head-change-request', '/api/organization/get-organization-data',
    '/api/status/add-status-type', '/api/status/update-status-type', '/api/status/delete-status-type/:id',
    '/api/team/create-team', '/api/team/get-teams', '/api/team/update-team', '/api/team/delete-team/:id', '/api/team/delete-employee-from-team',
    '/api/employee/bulk-upload-employee-data', '/api/employee/get-all-employees-for-updation'
];

const teamRoutes = [
    '/api/team/create-team',
    '/api/team/delete-team/:teamId',
    '/api/team/update-team',
    '/api/team/delete-employee-from-team',
    '/api/team/get-all-details',
    '/api/team/get-non-team-employees',
    '/api/team/change-role-in-team'
];

const canAllowUser = async (user, route, userType, orgId) => {
    if (!user || !route) return false;

    // PRODUCTMANAGER exclusive access
    if (userType === 'PRODUCTMANAGER') {
        const isPMRoute = productManagerAccessbilityRoutes.some((path) => {
            const matcher = match(path, { decode: decodeURIComponent });
            return matcher(route) !== false;
        });
        return isPMRoute;
    }

    // Check if the requested route matches any protected route (supports :id and params)
    const isProtected = protectedRoutes.some((path) => {
        const matcher = match(path, { decode: decodeURIComponent });
        return matcher(route) !== false;
    });

    // Check if the requested route matches any team route
    const isTeamRoute = teamRoutes.some((path) => {
        const matcher = match(path, { decode: decodeURIComponent });
        return matcher(route) !== false;
    });

    const userPrivilege = await privilegeSchema.findById(user.privilegeId);
    if (!userPrivilege) return false;

    // For team routes, allow SUPERADMIN, ULTIMATEADMIN, or ADMIN+MANAGER
    if (isTeamRoute) {
        if (
            ['SUPERADMIN', 'ULTIMATEADMIN'].includes(userPrivilege.name) && userPrivilege.orgId.equals(orgId)
        ) {
            return true;
        }
        // Check for ADMIN privilege and MANAGER role
        if (
            userPrivilege.name === 'ADMIN' && userPrivilege.orgId.equals(orgId)
        ) {
            // Fetch user role
            if (user.roleId) {
                const userRole = await roleSchema.findById(user.roleId);
                if (userRole && userRole.name === 'MANAGER') {
                    return true;
                }
            }
        }
        return false;
    }

    // For other protected routes, only SUPERADMIN or ULTIMATEADMIN allowed
    if (isProtected) {
        const allowedPrivileges = ['SUPERADMIN', 'ULTIMATEADMIN'];
        return allowedPrivileges.includes(userPrivilege.name) && userPrivilege.orgId.equals(orgId);
    }

    // Non-protected routes are accessible
    return true;
};

const verifyUser = async (req, res, next) => {
    try {
        const start = new Date();
        const cookie = req.cookies;
        const authHeader = req.headers.authorization;
        let decoded;
        let user;
        let isMobileRequest = false;

        // Check if request is from mobile (has Bearer token in headers)

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Mobile requests only have employee login
                user = await employeeSchema.findById(decoded.id).select('-password');
                isMobileRequest = true;
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        message: 'Token expired',
                        expired: true,
                        code: 'TOKEN_EXPIRED'
                    });
                }
                throw jwtError;
            }
        }
        // Check for browser requests (cookies) using generic cookie name
        if (cookie[COOKIE_NAME]) {
            try {
                decoded = jwt.verify(cookie[COOKIE_NAME], process.env.JWT_SECRET);
                // Use type in token to select schema
                if (decoded.type === 'EMPLOYEE') {
                    user = await employeeSchema.findById(decoded.id).select('-password');
                } else if (decoded.type === 'PRODUCTMANAGER') {
                    user = await productManagerSchema.findById(decoded.id).select('-password');
                } else {
                    // Unknown type
                    return res.status(401).json({ message: 'You are Not Authorized to access this resource' });
                }
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    res.clearCookie(COOKIE_NAME);
                    return res.status(401).json({
                        message: 'Session expired',
                        expired: true,
                        code: 'SESSION_EXPIRED'
                    });
                }
                throw jwtError;
            }
        }

        if (!user) return res.status(401).json({ message: 'You are Not Authorized to access this resource' });

        req.user = user;
        req.userType = decoded.type;
        req.userId = decoded.id;
        req.isMobileRequest = isMobileRequest; // Add flag to identify mobile requests
        req.username = decoded.type === "EMPLOYEE" ? req.user?.firstName + " " + req.user?.lastName : req.user?.userName;

        // if (await canAllowUser(req.user, req.originalUrl, req.userType, req.user.orgId)) {
        //     // console.log('Time taken for verification:', new Date() - start + 'ms');
        //     next();
        // } else {
        //     res.status(403).json({ message: 'Access denied: You do not have sufficient privileges to perform this action.' });
        // }

         next();
    } catch (err) {
        console.error('JWT Verification Error:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyUser;