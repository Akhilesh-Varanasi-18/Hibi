const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../utils/timeFunction');

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        trim: true,
        set: v => v.toUpperCase()
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    teamLeadIds: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    managerIds: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
    }
});

module.exports = mongoose.model('Teams', teamSchema);