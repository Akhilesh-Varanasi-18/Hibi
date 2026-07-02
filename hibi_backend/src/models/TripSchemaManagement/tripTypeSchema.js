const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../../utils/timeFunction');

const tripTypeSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        trim: true,
        uppercase: true,
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
        ref: 'Employees'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    }
});

module.exports = mongoose.model('TripType', tripTypeSchema);