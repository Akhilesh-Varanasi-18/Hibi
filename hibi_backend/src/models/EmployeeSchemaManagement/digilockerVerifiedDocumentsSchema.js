const express = require('express');
const mongoose = require('mongoose');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const { Schema } = mongoose;

const digilockerVerifiedDocumentsSchema = new Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    name: {
        type: String,
    },
    type: {
        type: String,
    },
    date: {
        type: String
    },
    mime: {
        type: String
    },
    uri: {
        type: String
    },
    doctype: {
        type: String
    },
    description: {
        type: String
    },
    issuerid: {
        type: String
    },
    issuer: {
        type: String
    },
    documentUrl: {
        type: String
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
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
    }
});

module.exports = mongoose.model('DigilockerVerifiedDocuments', digilockerVerifiedDocumentsSchema);