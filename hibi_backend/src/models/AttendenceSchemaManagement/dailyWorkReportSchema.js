const mongoose = require('mongoose');
const { getISTDateAndTime } = require('../../utils/timeFunction');

const workReportSchema = new mongoose.Schema({
    from: {
        type: Date,
        required: true
    },
    to: {
        type: Date,
        required: true
    },
    work: {
        type: String,
        required: true
    }
})

const dailyWorkReportSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees',
        required: true
    },
    workReport: {
        type: [workReportSchema],
        required: true
    },
    date: {
        type: Date, 
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

module.exports = mongoose.model('DailyWorkReport', dailyWorkReportSchema);
