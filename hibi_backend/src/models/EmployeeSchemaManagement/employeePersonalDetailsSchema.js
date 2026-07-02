const express = require('express');
const mongoose = require('mongoose');
const { getISTDateAndTime } = require('../../utils/timeFunction');

// Creating new schema for employee personal details
const employeePersonalDetailsSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    bloodGroup: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    maritalStatus: {
        type: String,
        enum: ['SINGLE', 'MARRIED', 'PREFER NOT TO SAY'],
        required: true
    },
    secondaryPhone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true,
        required: true
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    state: {
        type: String,
        trim: true,
        required: true
    },
    postalCode: {
        type: String,
        trim: true,
        required: true
    },
    country: {
        type: String,
        trim: true,
        required: true
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
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    }
});

module.exports = mongoose.model('EmployeePersonalDetails', employeePersonalDetailsSchema);