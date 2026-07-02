const designationSchema = require('../../models/EmployeeSchemaManagement/designationSchema.js');
const logger = require('../../utils/logger');

const addNewDesignation = async (req, res) => {
    try {
        const { title, roles, responsibilities} = req.body;
        const employeeId = req?.user?._id;
        const orgId = req?.user?.orgId;

        const trimmedTitle = title.trim().toUpperCase();
        if (!title || !roles || !responsibilities || !employeeId) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const exist = await designationSchema.find({ title : trimmedTitle, orgId });
        if (exist.length > 0) {
            return res.status(409).json({ message: 'Designation already exists with this name in this organization' });
        }
        const newDesignation = new designationSchema({
            title: trimmedTitle,
            roles,
            responsibilities,
            createdBy: employeeId,
            updatedBy: employeeId,
            orgId
        });
        await newDesignation.save()
        logger.info(`Designation '${trimmedTitle}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({
            message: 'New designation added successfully',
        });
    } catch (error) {
        console.error('Error while adding new designation:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const getAllDesignations = async (req, res) => {
    try {
        const orgId = req?.user?.orgId || req.body.orgId;
        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        const designations = await designationSchema.find({ orgId }, { __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0, updatedBy: 0 });
        return res.status(200).json({
            message: 'All designations fetched successfully',
            designations
        });
    } catch (error) {
        console.error('Error while fetching all designations:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const updateDesignation = async (req, res) => {
    try {
        const { designationId, title, roles, responsibilities } = req.body;
        const employeeId = req?.user?._id;
        if (!designationId || !title || !roles || !responsibilities || !employeeId) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const updatedDesignation = await designationSchema.findByIdAndUpdate(designationId, {
            title,
            roles,
            responsibilities,
            updatedBy: employeeId,
            updatedAt: new Date()
        }, { new: true });
        if (!updatedDesignation) {
            return res.status(404).json({ message: 'Designation not found' });
        }
        logger.info(`Designation '${title}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({
            message: 'Designation updated successfully',
            designation: updatedDesignation
        });
    } catch (error) {
        console.error('Error while updating designation:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const exist = await designationSchema.findById(id);
        if (!exist) {
            return res.status(404).json({ message: 'Designation not found' });
        }
        await designationSchema.findByIdAndDelete(id);
        logger.info(`Designation '${exist.title}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Designation deleted successfully' });
    } catch (error) {
        console.error('Error while Deleting the Designation : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    addNewDesignation,
    getAllDesignations,
    updateDesignation,
    deleteDesignation
};