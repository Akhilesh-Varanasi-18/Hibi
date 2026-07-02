const mongoose = require("mongoose");
const { getISTDateAndTime } = require("../../utils/timeFunction");


const attendenceStatusTypesSchema = new mongoose.Schema({
    orgId:{
        type : mongoose.Schema.ObjectId,
        required : true,
    },
    name:{
        type : String,
        required: true,
        uppercase: true,
        trim: true
    },
    shortName:{
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
     createdBy:{
        type : mongoose.Schema.ObjectId,
        required : true,
    },
    updatedBy:{
        type : mongoose.Schema.ObjectId,
    },
    cratedAt:{
        type : Date,
        default: () => getISTDateAndTime()
    },
    updatedAt:{
        type : Date,
    }
})

module.exports = mongoose.model("AttendenceStatusTypes", attendenceStatusTypesSchema);
