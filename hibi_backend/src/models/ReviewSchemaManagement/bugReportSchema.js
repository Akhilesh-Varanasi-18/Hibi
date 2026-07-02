const mongoose = require('mongoose');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const { Schema } = mongoose;

const bugReportSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachments: [{
        type: String, // URL or S3 key
        required: true
    }],
    status: {
        type: String,
        enum: ["PENDING", "IN PROCESS", "RESOLVED"],
        default: "PENDING"
    },
    remarks: {
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
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    }
}, {
    validateBeforeSave: true
});

// Custom validator for minimum one attachment
bugReportSchema.path('attachments').validate(function(value) {
    return Array.isArray(value) && value.length > 0;
}, 'At least one attachment is required.');

module.exports = mongoose.model('BugReport', bugReportSchema);