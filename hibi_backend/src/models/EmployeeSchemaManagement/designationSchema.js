const express = require('express');
const mongoose = require('mongoose');
const { getISTDateAndTime } = require("../../utils/timeFunction.js");

const designationSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizations',
        required: true
    },
    title: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    roles: {
        type: String,
    },
    responsibilities: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    }
});

module.exports = mongoose.model('Designations', designationSchema);