const departmentSchema = require('../../models/EmployeeSchemaManagement/departmentSchema.js');
const { getISTDateAndTime } = require('../../utils/timeFunction.js');
const logger = require('../../utils/logger');

// Function to create a new department
const createDepartment = async (req, res) => {
    try {
        const { name, managerId } = req.body;
        const employeeId = req?.user?._id;
        const orgId = req?.user?.orgId;
        // Validate required fields
        if (!name || !managerId || !employeeId) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        const existingDepartment = await departmentSchema.findOne({ name: name.toUpperCase().trim(), orgId });
        if (existingDepartment) {
            return res.status(409).json({ message: 'Department already exists with this name in this organization' });
        }
        const newDepartment = new departmentSchema();
        newDepartment.name = name.toUpperCase();
        newDepartment.managerId = managerId;
        newDepartment.createdBy = employeeId;
        newDepartment.updatedBy = employeeId;
        newDepartment.orgId = orgId;
        await newDepartment.save();
        logger.info(`Department '${name}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Department created successfully' });
    } catch (error) {
        console.error('Error while Creating Department : ', error);
        return res.status(500).json(error);
    }
}

// Function to get all departments
const getAllDepartments = async (req, res) => {
    try {
        const orgId = req?.user?.orgId || req.body.orgId;
        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        // const departments = await departmentSchema.find({ orgId }, { name: 1, managerId: 1 });
        // Populate manager details from employeeSchema
        const populatedDepartments = await departmentSchema.find({ orgId }, { name: 1, managerId: 1 })
            .populate({
            path: 'managerId',
            select: 'firstName lastName officeMail'
            });
        const result = populatedDepartments.map(dept => ({
            _id: dept._id,
            name: dept.name,
            manager: dept.managerId ? {
            _id: dept.managerId._id,
            firstName: dept.managerId.firstName,
            lastName: dept.managerId.lastName,
            officeMail: dept.managerId.officeMail
            } : null
        }));
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error while fetching Departments : ', error);
        return res.status(500).json(error);
    }
}

// Function to update a department
const updateDepartment = async (req, res) => {
    try {
        const { id, name, managerId } = req.body;
        const employeeId = req?.user?._id;
        // Validate required fields
        const department = await departmentSchema.findById(id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        department.name = name.toUpperCase();
        department.managerId = managerId;
        department.updatedBy = employeeId;
        department.updatedAt = getISTDateAndTime();
        
        // Save the updated department
        await department.save();
        logger.info(`Department '${department.name}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Department updated successfully' });
    } catch (error) {
        console.error('Error while updating Department : ', error);
        return res.status(500).json(error);
    }
}

// Function to delete a department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await departmentSchema.findById(id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await departmentSchema.deleteOne({ _id: id });
        logger.info(`Department '${department.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error while deleting Department : ', error);
        return res.status(500).json(error);
    }
}

module.exports = {
    createDepartment,
    getAllDepartments,
    updateDepartment,
    deleteDepartment
};