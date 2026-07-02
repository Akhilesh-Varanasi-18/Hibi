const privilegeSchema = require('../../models/EmployeeSchemaManagement/privilegeSchema');
const { productDefinedPrivileges } = require('../../config/productDefined');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const logger = require('../../utils/logger');

const createprivilege = async (req, res) => {
    try {
        const {name, description} = req.body;
        const employeeId = req?.user?._id;
        newName = name.trim().toUpperCase();
        const existingprivilege = await privilegeSchema.findOne({ orgId: req?.user?.orgId, name: newName });
        if (existingprivilege) {
            return res.status(409).json({ message: 'privilege already exists' });
        }
        const newprivilege = new privilegeSchema();
        newprivilege.name = newName;
        newprivilege.description = description.trim();
        newprivilege.createdBy = employeeId;
        newprivilege.updatedBy = employeeId;
        newprivilege.orgId = req?.user?.orgId;
        await newprivilege.save();
        logger.info(`Privilege '${newName}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'privilege created successfully' });
    } catch (error) {
        console.error('Error while Creating privilege : ', error);
        return res.status(500).json(error);
    }
}


const getAllprivileges = async (req, res) => {
    try {
        const orgId = req?.user?.orgId || req.body.orgId;
        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        const privileges = await privilegeSchema.find({ orgId }, { __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0, updatedBy: 0 });
        return res.status(200).json({ message: 'privileges fetched successfully', privileges });
    } catch (error) {
        console.error('Error while fetching privileges : ', error);
        return res.status(500).json(error);
    }
}

const updateprivilege = async (req, res) => {
    try {
        const { id, name, description } = req.body;
        const employeeId = req?.user?._id;
        const privilege = await privilegeSchema.findById(id);
        if(productDefinedPrivileges.includes(privilege.name)){
            return res.status(403).json({ message: 'This is a product defined privilege and cannot be updated.' });
        }
        if (!privilege) {
            return res.status(404).json({ message: 'privilege not found' });
        }
        privilege.name = name.toUpperCase();
        privilege.description = description;
        privilege.updatedBy = employeeId;
        privilege.updatedAt = getISTDateAndTime();
        await privilege.save();
        logger.info(`Privilege '${privilege.name}' updated to '${name}' by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json(privilege);
    } catch (error) {
        console.error('Error while updating privilege : ', error);
        return res.status(500).json(error);
    }
}

const deleteprivilege = async (req, res) => {
    try {
        const { id } = req.params;
        const privilege = await privilegeSchema.findById(id);
        if (!privilege) {
            return res.status(404).json({ message: 'privilege not found' });
        }
        if(productDefinedPrivileges.includes(privilege.name)){
            return res.status(403).json({ message: 'This is a product defined privilege and cannot be deleted.' });
        }
        await privilegeSchema.deleteOne({ _id: id });
        logger.info(`Privilege '${privilege.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'privilege deleted successfully' });
    } catch (error) {
        console.error('Error while deleting privilege : ', error);
        return res.status(500).json(error);
    }
}



module.exports = {
    createprivilege,
    getAllprivileges,
    updateprivilege,
    deleteprivilege
};