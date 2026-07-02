const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../utils/timeFunction");

const productManagerSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'Organization',
        // required: true
    },
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime()
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime()
    }

})


module.exports = mongoose.model("ProductManager", productManagerSchema);