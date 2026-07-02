const mongoose = require('mongoose');
const { getISTDateAndTime } = require('../utils/timeFunction');

const ToDoSchema = new mongoose.Schema({
    moduleName: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
        required: true
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StatusTypes',
        required: false,
        default: null
    },
    startDate: {
        type: Date,
        default: null,
        required: true
    },
    endDate: {
        type: Date,
        default: null,
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM',
        required: true
    },
    todoList: [
        {
            taskName: {
                type: String,
                required: true,
                trim: true
            },
            isCompleted: {
                type: Boolean,
                default: false,
                required: true
            },
            completedAt: {
                type: Date,
                default: null,
            },
            completedBy: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            createdAt: {
                type: Date,
                default: () => getISTDateAndTime(),
            },
            updatedAt: {
                type: Date,
                default: () => getISTDateAndTime(),
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                // required: true,
                default: null
            },
        }
    ],
    employeesAssigned: [
        {
            employeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employees',
                required: true
            }
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    createdAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    },
    updatedAt: {
        type: Date,
        default: () => getISTDateAndTime(),
    },
});

module.exports = mongoose.model('ToDo', ToDoSchema);