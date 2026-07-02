const statusTypeSchema = require('../models/statusSchema');
const { productDefinedStatus } = require('../config/productDefined');
const { getISTDateAndTime } = require('../utils/timeFunction');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const addStatusType = async (req, res) => {
    try {
        const { statusType } = req.body;
        const employeeId = req?.user?._id;

        // Validate input
        if (!statusType || typeof statusType !== 'string' || statusType.trim() === '') {
            return res.status(400).json({ error: 'Invalid status type', data: 'Status type is required and must be a non-empty string' });
        }

        if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                error: 'Invalid employee ID',
                data: 'Employee ID is required and must be a valid ObjectId',
            });
        }

        // Check if the status type already exists
        const existingStatusType = await statusTypeSchema.findOne({ statusType: statusType.toUpperCase().trim(), orgId: req?.user?.orgId });
        if (existingStatusType) {
            return res.status(400).json({ error: 'Status type already exists', data: 'This status type already exists' });
        }

        // Create new status type
        const newStatusType = new statusTypeSchema({
            statusType: statusType.toUpperCase().trim(),
            createdBy: employeeId,
            updatedBy: employeeId,
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime(),
            orgId: req?.user?.orgId,
        });
        await newStatusType.save();

        logger.info(`Status type '${statusType}' added by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(201).json({ message: 'Status type added successfully' });
    }
    catch (error) {
        console.error('Error while adding status type:', error);
        res.status(500).json({
            error: 'Internal server error',
            data: 'Error while adding status type',
        });
    }
}


const updateStatusType = async (req, res) => {
    try {
        const { statusType, statusTypeId } = req.body;
        const employeeId = req?.user?._id;

        // Validate input
        if (!statusType || typeof statusType !== 'string' || statusType.trim() === '')
            return res.status(400).json({ error: 'Invalid status type', data: 'Status type is required and must be a non-empty string' });

        if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId))
            return res.status(400).json({ error: 'Invalid employee ID', data: 'Employee ID is required and must be a valid ObjectId' });

        if (!statusTypeId || !mongoose.Types.ObjectId.isValid(statusTypeId))
            return res.status(400).json({ error: 'Invalid status type ID', data: 'Status type ID is required and must be a valid ObjectId' });

        const statusTypeRecord = await statusTypeSchema.findById(statusTypeId);
        if (!statusTypeRecord) {
            return res.status(404).json({ message: 'Status type not found' });
        }
        if(productDefinedStatus.includes(statusTypeRecord.statusType)){
            return res.status(403).json({ message: 'This is a product defined status type and cannot be updated.' });
        }

        // Update existing status type
        const updatedStatusType = await statusTypeSchema.findByIdAndUpdate(
            statusTypeId,
            {
                statusType: statusType.toUpperCase().trim(),
                updatedBy: employeeId,
                updatedAt: getISTDateAndTime(),
            },
            { new: true }
        );

        if (!updatedStatusType) {
            return res.status(404).json({ error: 'Status type not found', data: 'No status type found with the provided ID' });
        }

        logger.info(`Status type '${statusTypeRecord.statusType}' updated to '${updatedStatusType.statusType}' by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: 'Status type updated successfully' });
    } catch (error) {
        console.error('Error while updating status type:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            data: 'Error while updating status type',
        });
    }
}


const deleteStatusType = async (req, res) => {
    try {
        const { statusTypeId } = req.params;

        // Validate input
        if (!statusTypeId || !mongoose.Types.ObjectId.isValid(statusTypeId))
            return res.status(400).json({ error: 'Invalid status type ID', data: 'Status type ID is required and must be a valid ObjectId' });

        const statusType = await statusTypeSchema.findById(statusTypeId);
        if (!statusType) {
            return res.status(404).json({ message: 'Status type not found' });
        }
        if(productDefinedStatus.includes(statusType.statusType)){
            return res.status(403).json({ message: 'This is a product defined status type and cannot be deleted.' });
        }
        // Delete status type
        const deletedStatusType = await statusTypeSchema.findByIdAndDelete(statusTypeId);

        if (!deletedStatusType)
            return res.status(404).json({ error: 'Status type not found', data: 'No status type found with the provided ID' });

        logger.info(`Status type '${deletedStatusType.statusType}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: 'Status type deleted successfully' });
    } catch (error) {
        console.error('Error while deleting status type:', error);
        res.status(500).json({
            error: 'Internal server error',
            data: 'Error while deleting status type',
        });
    }
};



const getStatusTypes = async (req, res) => {
    try {
        const statusTypes = await statusTypeSchema.find({ orgId: req?.user?.orgId }, { statusType: 1 }).sort({ createdAt: -1 });

        if (statusTypes.length === 0) {
            return res.status(404).json({ error: 'No status types found', data: 'No status types available' });
        }

        res.status(200).json({ message: 'Status types retrieved successfully', data: statusTypes });
    } catch (error) {
        console.error('Error while retrieving status types:', error);
        res.status(500).json({ error: 'Internal server error', data: 'Error while retrieving status types' });
    }
}



module.exports = {
    addStatusType,
    updateStatusType,
    deleteStatusType,
    getStatusTypes,
};