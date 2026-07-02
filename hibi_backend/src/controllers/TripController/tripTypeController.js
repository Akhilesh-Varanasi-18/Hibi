const tripTypeSchema = require('../../models/TripSchemaManagement/tripTypeSchema');
const tripSchema = require('../../models/TripSchemaManagement/tripSchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const { productDefinedTripTypes } = require('../../config/productDefined');
const logger = require('../../utils/logger');

// Funtion to add trip type
const addTripType = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        let { name } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        name = name.trim().toUpperCase();

        // Check if trip type already exists
        const existingTripType = await tripTypeSchema.findOne({ orgId, name });
        if (existingTripType) {
            return res.status(409).json({ message: 'Trip type already exists' });
        }

        const newTripType = new tripTypeSchema({
            orgId,
            name,
            createdBy: req?.user?._id,
            updatedBy: req?.user?._id
        });

        await newTripType.save();

        logger.info(`Trip type '${name}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Trip type added successfully' });
    } catch (error) {
        console.error('Error adding trip type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to get the trip types in an organization
const getTripTypes = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;

        const tripTypes = await tripTypeSchema.find({ orgId }, {_id: 1, name: 1});

        return res.status(200).json({ message: 'Trip types retrieved successfully', tripTypes });
    } catch (error) {
        console.error('Error retrieving trip types:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to update the trip type
const updateTripType = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const { tripId, name } = req.body;

        // Validate input
        if (!tripId || !name) {
            return res.status(400).json({ message: 'ID and name are required' });
        }

        // Check if the trip with id is present or not
        const existingTripType = await tripTypeSchema.findOne({ _id: tripId, orgId });
        if (!existingTripType) {
            return res.status(404).json({ message: 'Trip type not found' });
        }
        // Prevent updates to product-defined trip types
        if (productDefinedTripTypes.includes(existingTripType.name)) {
            return res.status(403).json({ message: 'Cannot update product-defined trip types' });
        }

        const updatedTripType = await tripTypeSchema.findOneAndUpdate(
            { _id: tripId, orgId },
            { 
                name: name.trim().toUpperCase(),
                updatedBy: req?.user?._id,
                updatedAt: getISTDateAndTime()
            },
            { new: true }
        );

        if (!updatedTripType) {
            return res.status(404).json({ message: 'Trip type not found' });
        }

        logger.info(`Trip type '${existingTripType.name}' updated to '${name}' by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Trip type updated successfully' });
    } catch (error) {
        console.error('Error updating trip type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to delete the trip type
const deleteTripType = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const { tripId } = req.params;

        const associatedTrips = await tripSchema.findOne({ tripTypeId: tripId, orgId });
        if (associatedTrips) {
            return res.status(400).json({ message: 'Cannot delete trip type with associated trips' });
        }

        const deletedTripType = await tripTypeSchema.findOneAndDelete({ _id: tripId, orgId });
        if (!deletedTripType) {
            return res.status(404).json({ message: 'Trip type not found' });
        }

        logger.info(`Trip type '${deletedTripType.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Trip type deleted successfully' });
    } catch (error) {
        console.error('Error deleting trip type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    addTripType,        // create trip type

    getTripTypes,       // get trip types

    updateTripType,     // update trip type

    deleteTripType      // delete trip type
};