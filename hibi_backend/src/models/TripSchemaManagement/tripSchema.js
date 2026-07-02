const mongoose = require('mongoose');

const { getISTDateAndTime } = require('../../utils/timeFunction');

const tripSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'Organizations'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    },
    tripTitle: {
        type: String,
    },
    // approvedByHigherAuthority: {
    //     type: Boolean,
    //     default: false
    // },
    // approvedByHigherAuthorityId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Employees'
    // },
    // approvedByAccountant: {
    //     type: Boolean,
    //     default: false
    // },
    // approvedByAccountantId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Employees',
    //     note: 'Approval for initial advance amount'
    // },
    tripHeadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employees'
    },
    tripParticipants: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Employees'
    },
    tripType: {
        type: String,
        required: true
    },
    destination: {
        type: String,
    },
    reason: {
        type: String,
    },
    fromDate: {
        type: Date,
    },
    toDate: {
        type: Date,
    },
    // conversionRate: {
    //     type: Number,
    // },
    statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StatusTypes',
    },
    advanceAmount: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    }
});

module.exports = mongoose.model('Trip', tripSchema);