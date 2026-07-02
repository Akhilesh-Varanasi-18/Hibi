const express = require('express');
const mongoose = require('mongoose');

const { getISTDateAndTime } = require("../../utils/timeFunction.js");

const departmentSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
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

module.exports = mongoose.model('Departments', departmentSchema);