const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../../utils/timeFunction');

const employeeBankDetailsSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizations',
        required: true
    },
    bankName: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    },
    accountHolderName: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    },
    accountNumber: {
        type: String,
        trim: true,
        required: true
    },
    ifscCode: {
        type: String,
        trim: true,
        required: true
    },
    bankPassBookUrl: {
        type: String,
    },
    status: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
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

module.exports = mongoose.model('EmployeeBankDetails', employeeBankDetailsSchema);