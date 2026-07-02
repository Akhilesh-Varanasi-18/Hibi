const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../../utils/timeFunction');

const governmentIdTypesSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizations',
        required: true
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
        ref: 'Employees',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    }
});

module.exports = mongoose.model('GovernmentIdTypes', governmentIdTypesSchema);