const express = require("express");
const { applyRoutes } = require('../utils/routerUtils');
const { addOrUpdateFirebaseToken, deleteFirebaseToken, sendCustomNotifications } = require("../controllers/FirebaseNotifications/firebaseMessageingTockenController");

const firebaseNotificationRouteDefinitions = [
    {
        method: 'POST',
        path: '/add-fcm-token',
        handlers: addOrUpdateFirebaseToken,
        description: 'Add or update a Firebase Cloud Messaging (FCM) token for push notifications.',
        group: 'Notifications'
    },
    {
        method: 'DELETE',
        path: '/delete-fcm-token',
        handlers: deleteFirebaseToken,
        description: 'Delete a Firebase Cloud Messaging (FCM) token for push notifications.',
        group: 'Notifications'
    },
    {
        method : 'POST',
        path : '/send-custom-notifications',
        handlers : sendCustomNotifications,
        description: 'Send custom notifications to multiple users.',
        group: 'Notifications'
    }
];

const router = applyRoutes(firebaseNotificationRouteDefinitions);

module.exports = {
    router: router,
    definitions: firebaseNotificationRouteDefinitions
};