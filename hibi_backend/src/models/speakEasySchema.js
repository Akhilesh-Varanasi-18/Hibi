const mongoose = require('mongoose');
const speakeasy = require('speakeasy');

const { getISTDateAndTime } = require('../utils/timeFunction');


const speakEasySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    secret: {
        type: String,
        require: true
    },
    otpauth_url: {
        type: String,
        require: true
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    twoFactorResetToken: {
        type: String,
    },
    twoFactorResetExpires: {
        type: Date,
    }
});

module.exports = mongoose.model('speakEasy', speakEasySchema);