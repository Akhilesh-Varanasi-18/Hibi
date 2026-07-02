const mongoose = require('mongoose');
const { Schema } = mongoose;
const { getISTDateAndTime } = require('../../utils/timeFunction');

const permissionTypesSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    permissionType: {
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
    module.exports = mongoose.model('PermissionTypes', permissionTypesSchema);
