const express = require('express');
const mongoose = require('mongoose');
const { getISTDateAndTime } = require("../../utils/timeFunction.js");

// const teamsSchema = new mongoose.Schema({
//     teamId: {
//         type:mongoose.Schema.Types.ObjectId
//     },
//     teamLeadId: {
//         type: mongoose.Schema.Types.ObjectId
//     }
// })

const employeeSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    privilegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Privilege',
        required : true
    },
    tempPrivilegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Privilege',
        default : null
    },
    tempPrivilegeStartDate: {
        type: Date,
        // required : ()=>{
        //     return this.tempPrivilegeId !== null;
        // }
    },
    tempPrivilegeEndDate: {
        type: Date,
        // required : ()=>{
        //     return this.tempPrivilegeId !== null;
        // }
    },
    employeeCode: {
        type: String,
        trim: true,
        uppercase: true,
        required : true,
        unique: true
    },
    firstName: {
        type: String,
        trim: true,
        uppercase: true,
        required : true
    },
    lastName: {
        type: String,
        trim: true,
        uppercase: true,
    },
    personalEmail: {
        type: String,
        required: true,
        lowercase: true
    },
    officeMail: {
        type: String,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ""
    },
    accessTokenExpires: {
        type: String,
        default: ""
    },
    microsoftId: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
        default: ""
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    phone: {
        type: Number,
        required: true,
        default: null
    },
    dateOfBirth: {
        type: Date,
        required: true,
        default: null
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'PREFER NOT TO SAY'],
        required: true
    },
    dateOfJoining: {
        type: Date,
        required: true,
    },
    dateOfLeaving: {
        type: Date,
        default: null
    },
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'StatusTypes',
        // required: true
        default: null
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Departments',
        // required: true
        default: null
    },
    designationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Designations',
        // required : true
        default: null
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Roles',
        required : true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Teams',
        // required : true
        default: null
    },
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Shifts',
        // required : true
        default: null
    },
    salaryPerMonth: {
        type: Number,
        // required: true,
        default: null
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    optOutOccasions: {
        type: String,
        default: ""
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    isRequired2FA: {
        type: Boolean,
        default: true
    },
    pfNumber: {
        type: String,
        default: "",
    },
    esicNumber: {
        type: String,
        default: ""
    },
    linkedInProfile: {
        type: String,
        default: ""
    }
});


module.exports = mongoose.model('Employees', employeeSchema);