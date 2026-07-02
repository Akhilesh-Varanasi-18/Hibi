const mongoose = require('mongoose');
const { Schema } = mongoose;
const { getISTDateAndTime } = require('../utils/timeFunction');

const statusTypesSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        // ref: 'Organization',
        // required: true
    },
    statusType: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        // ref: 'Employees',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        // ref: 'Employees',
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
    module.exports = mongoose.model('StatusTypes', statusTypesSchema);
