const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../utils/timeFunction');

const announcementSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizations",
        required: true
    },
    announcements: [
        {
            title: {
                type: String,
                required: true,
                default: ""
            },
            imageUrl: {
                type: String,
                required: true
            }
        }
    ],
    description: {
        type: String,
        default: "",
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => getISTDateAndTime()
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Announcement', announcementSchema);