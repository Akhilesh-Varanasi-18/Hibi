const e = require('cors');
const governmentIdTypesSchema = require('../../models/EmployeeSchemaManagement/governmentIdTypesSchema');
const logger = require('../../utils/logger');

// Function to add new government Id type
const addGovernmentIdType = async (req, res) => {
    try {
        const { name } = req.body;
        const employeeId = req?.user?._id;
        const newName = name.toUpperCase().trim();

        // Validate the fields
        if (!newName || !employeeId) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if the name is already added in the DB
        const existingIdType = await governmentIdTypesSchema.findOne({ name: newName });
        if (existingIdType) {
            return res.status(400).json({ error: 'Government ID type already exists' });
        }

        // Create a new government ID type
        const newGovernmentIdType = new governmentIdTypesSchema({
            name: newName,
            createdBy: employeeId,
            updatedBy: employeeId,
            orgId: req?.user?.orgId
        });

        // Save the new government ID type
        await newGovernmentIdType.save();

        logger.info(`Government ID type '${newName}' added by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Government ID type added successfully' });
    } catch (error) {
        console.error('Error adding government ID type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// Function to update the government Id type
const updateGovernmentIdType = async (req, res) => {
    try {
        const { typeId, name } = req.body;
        const employeeId = req?.user?._id;

        const newName = name.toUpperCase().trim();

        // Validate the fields
        if (!newName || !employeeId) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if the government ID type exists
        const existingIdType = await governmentIdTypesSchema.findById(typeId);
        if (!existingIdType) {
            return res.status(404).json({ error: 'Government ID type not found' });
        }

        // Update the government ID type
        existingIdType.name = name.toUpperCase();
        existingIdType.updatedBy = employeeId;

        // Save the updated government ID type
        await existingIdType.save();

        logger.info(`Government ID type '${existingIdType.name}' updated to '${name}' by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Government ID type updated successfully' });
    } catch (error) {
        console.error('Error updating government ID type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// Function to get all the government Id types
const getAllGovernmentIdTypes = async (req, res) => {
    try {
        const governmentIdTypes = await governmentIdTypesSchema.find({orgId: req?.user?.orgId}, {_id: 1, name: 1});
        return res.status(200).json(governmentIdTypes);
    } catch (error) {
        console.error('Error fetching government ID types:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// Function to delete the government Id type
const deleteGovernmentIdType = async (req, res) => {
    try {
        const { typeId } = req.params;

        // Check if the government ID type exists
        const existingIdType = await governmentIdTypesSchema.findById(typeId);
        if (!existingIdType) {
            return res.status(404).json({ error: 'Government ID type not found' });
        }

        // Delete the government ID type
        await existingIdType.deleteOne();

        logger.info(`Government ID type '${existingIdType.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Government ID type deleted successfully' });
    } catch (error) {
        console.error('Error deleting government ID type:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    addGovernmentIdType,    // Add a new government ID type

    updateGovernmentIdType, // Update an existing government ID type

    getAllGovernmentIdTypes,  // Get all government ID types

    deleteGovernmentIdType    // Delete a government ID type
};