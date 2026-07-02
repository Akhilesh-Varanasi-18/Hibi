const rolesSchema = require('../../models/EmployeeSchemaManagement/rolesSchema');
const { productDefinedRoles } = require('../../config/productDefined');
const logger = require('../../utils/logger');

const addNewRole = async (req, res) => {
    try {
        const { name } = req.body;
        const employeeId = req?.user?._id;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const newName = name.toUpperCase();
        const existingRole = await rolesSchema.findOne({ orgId: req?.user?.orgId, name: newName });
        if (existingRole) {
            return res.status(409).json({ message: 'Role already exists' });
        }
        const newRole = new rolesSchema({
            name: newName,
            createdBy: employeeId,
            updatedBy: employeeId,
            orgId: req?.user?.orgId
        });
        await newRole.save();
        logger.info(`Role '${newName}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Role added successfully' });
    } catch (error) {
        console.error('Error adding new role:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getAllRoles = async (req, res) => {
    try {
        const orgId = req?.user?.orgId || req.body.orgId;
        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        const roles = await rolesSchema.find({ orgId }, { __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0, updatedBy: 0 }).sort({ createdAt: 1 });
        return res.status(200).json({ message: 'Roles fetched successfully', roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const updateRoles = async (req, res) => {
    try {
        const { roleId, name } = req.body;
        const employeeId = req?.user?._id;
        if (!roleId || !name) {
            return res.status(400).json({ message: 'Role ID and Name are required' });
        }
        const existingRole = await rolesSchema.findOne({ _id: roleId });
        if (!existingRole) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if(productDefinedRoles.includes(existingRole.name)){
            return res.status(403).json({ message: 'This is a product defined role and cannot be updated.' });
        }
        const updatedRole = await rolesSchema.findByIdAndUpdate(roleId, { name: name.toUpperCase(), updatedBy: employeeId }, { new: true });
        if (!updatedRole) {
            return res.status(404).json({ message: 'Role not found' });
        }
        logger.info(`Role '${existingRole.name}' updated to '${name}' by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error('Error updating roles:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        if (!roleId) {
            return res.status(400).json({ message: 'Role ID is required' });
        }
        const existingRole = await rolesSchema.findById(roleId);
        if (!existingRole) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if(productDefinedRoles.includes(existingRole.name)){
            return res.status(403).json({ message: 'This is a product defined role and cannot be deleted.' });
        }
        await rolesSchema.findByIdAndDelete(roleId);
        logger.info(`Role '${existingRole.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    addNewRole,
    getAllRoles,
    updateRoles,
    deleteRole
};