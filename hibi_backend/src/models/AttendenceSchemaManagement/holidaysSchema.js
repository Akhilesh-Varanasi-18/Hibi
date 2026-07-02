const mongoose = require('mongoose');
const { Schema } = mongoose;
const {getISTDateAndTime} = require('../../utils/timeFunction');

const holidaySchema = new Schema({
    orgId :{
        type: Schema.Types.ObjectId,
        ref : 'Organization',
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true,
        uppercase: true
    },
    shortCode : {
        type: String,
        trim: true,
        required: true,
        uppercase: true,
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return this.fromDate < value;
            },
            message: "toDate must be greater than fromDate"
        }
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    }
});


module.exports = mongoose.model('Holidays', holidaySchema);
