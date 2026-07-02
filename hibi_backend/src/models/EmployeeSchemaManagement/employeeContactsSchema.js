const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require("../../utils/timeFunction");


const employeeContactsSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    relationShip: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    phone: {
        type: Number,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    address: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        trim: true,
    },
    postalCode: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",  
    }
});

module.exports = mongoose.model('EmployeeContacts', employeeContactsSchema);