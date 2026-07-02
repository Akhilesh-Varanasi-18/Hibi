const express = require('express');
const passwordController = require('../controllers/passwordController');
const { applyRoutes } = require('../utils/routerUtils');
const path = require('path');

const passwordRouteDefinitions = [
    {
        method: 'POST',
        path: '/forget-password',
        handlers: passwordController.forgetPassword,
        description: 'Send OTP to email for forgotten password.',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/verify-otp-forgot-password',
        handlers: passwordController.otpVerificationForgotPassword,
        description: 'Verify OTP and reset password (forgot password flow).',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/change-password',
        handlers: passwordController.changePassword,
        description: 'Change password (requires old password and OTP).',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/verify-otp-change-password',
        handlers: passwordController.changingPasswordUsingOtp,
        description: 'Verify OTP for password change.',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/set-new-password',
        handlers: passwordController.settingNewPasswordUsingOtp,
        description: 'Set new password after OTP verification.',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/request-2fa-reset',
        handlers: passwordController.requestTwoFactorReset,
        description: 'Request a 2FA reset link to be sent to the personal email.',
        group: 'Password Management'
    },
    {
        method: 'GET',
        path: '/confirm-2fa-reset',
        handlers: passwordController.confirmTwoFactorReset,
        description: 'Confirm and disable 2FA using the token from the email link.',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/resend-password',
        handlers: passwordController.resendPassword,
        description: 'Reset password by admin using employee code.',
        group: 'Password Management'
    },
    {
        method: 'POST',
        path: '/toggle-2fa',
        handlers: passwordController.toggleTwoFactorAuth,
        description: 'Enable or disable two-factor authentication (2FA).',
        group: 'Password Management'
    }
];

const router = applyRoutes(passwordRouteDefinitions);

module.exports = {
    router: router,
    definitions: passwordRouteDefinitions
};