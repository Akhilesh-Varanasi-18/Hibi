const express = require('express');
const loginController = require('../controllers/loginController');
const { applyRoutes } = require('../utils/routerUtils');

const loginRouteDefinitions = [
    {
        method: 'POST',
        path: '/verify-email',
        handlers: loginController.verifyEmail,
        description: 'Step 1: Verify email and return organization details.',
        group: 'Authentication'
    },
    {
        method: 'POST',
        path: '/login-user',
        handlers: loginController.loginUser,
        description: 'Step 2: Login for web application users (e.g., Admins, HR).',
        group: 'Authentication'
    },
    {
        method: 'POST',
        path: '/application-login',
        handlers: loginController.applicationLogin,
        description: 'Login for mobile application users (e.g., Employees).',
        group: 'Authentication'
    },
    {
        method: 'POST',
        path: '/logout-user',
        handlers: loginController.logoutUser,
        description: 'Logout user and clear session.',
        group: 'Authentication'
    },
    {
        method: 'POST',
        path: '/verify-otp',
        handlers: loginController.verifyOtp,
        description: 'Verify OTP for user login.',
        group: 'Authentication'
    },
    {
        method: 'POST',
        path: '/application-verify-otp',
        handlers: loginController.applicationVerifyOtp,
        description: 'Verify OTP for mobile application users (e.g., Employees).',
        group: 'Authentication'
    },
    {
        method: 'GET',
        path: '/refresh-token',
        handlers: loginController.refreshToken,
        description: 'Refresh JWT token.',
        group: 'Authentication'
    },
];

const router = applyRoutes(loginRouteDefinitions);

module.exports = {
    router: router,
    definitions: loginRouteDefinitions
};