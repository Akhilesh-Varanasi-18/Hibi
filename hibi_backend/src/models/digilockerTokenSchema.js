const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../utils/timeFunction');

const digilockerTokenSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true,
    },
    digilockerid: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    dob: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    eaadhaar: {
        type: String,
        required: true,
        enum: ['Y', 'N'],
    },
    referenceKey: {
        type: String,
    },
    mobile: {
        type: String,
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
    },
    expiresIn: {
        type: Number,
        required: true
    },
    tokenType: {
        type: String,
        required: true
    },
    scope: {
        type: String,
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
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
    }
    ,
    codeVerifier: {
        type: String,
        default: null
    },
    state: {
        type: String,
        default: null
    },
    lastAuthUrlRequestedAt: {
        type: Date,
        default: null
    },
    lastRefetchRequestedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('DigilockerToken', digilockerTokenSchema);