const shiftSchema = require('../../models/EmployeeSchemaManagement/shiftSchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const logger = require('../../utils/logger');

const addNewShift = async (req, res) => {
    try {
        const { name, startTime, endTime, breakTimeStart, breakTimeEnd, gracePeriodMin } = req.body;
        const employeeId = req?.user?._id;
        const newName = name.trim().toUpperCase();

        if (!name || !startTime || !endTime || gracePeriodMin === null || gracePeriodMin === undefined || !breakTimeStart || !breakTimeEnd || startTime.trim() === '' || endTime.trim() === '' || gracePeriodMin < 0 || breakTimeStart.trim() === '' || breakTimeEnd.trim() === '') {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // const Data = getISTDateAndTime().toISOString().split('T')[0];
        // const starttime = `T${startTime}:00.000Z`;
        // const endtime = `T${endTime}:00.000Z`;
        // const breaktime = `T${breakTime}:00.000Z`;

        const exist = await shiftSchema.findOne({ name: newName, orgId: req?.user?.orgId });
        if (exist) {
            return res.status(400).json({ message: 'Shift with this name already exists' });
        }

        const newShift = new shiftSchema({
            orgId: req?.user?.orgId,
            name: newName,
            startTime,
            endTime,
            breakTimeStart,
            breakTimeEnd,
            gracePeriodMin,
            createdBy: employeeId,
            updatedBy: employeeId,
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime()
        });
        await newShift.save();
        logger.info(`Shift '${newName}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Shift added successfully' });
    } catch (error) {
        console.error('Error adding shift:', error);
        return res.status(500).json({ message: 'Error adding shift', error: error.message });
    }
}

const getAllShifts = async (req, res) => {
    try {
        const shifts = await shiftSchema.find({orgId: req?.user?.orgId}, { __v: 0, createdBy: 0, updatedBy: 0, createdAt: 0, updatedAt: 0 });
        res.status(200).json({ shifts });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ message: 'Error fetching shifts', error: error.message });
    }
}

const updateShift = async (req, res) => {
    try {
        const { shiftId, name, startTime, endTime, breakTimeStart, breakTimeEnd, gracePeriodMin } = req.body;
        const employeeId = req?.user?._id;
        const newName = name.trim().toUpperCase();
        if (!shiftId || !name || !startTime || !endTime || !breakTimeStart || !breakTimeEnd || gracePeriodMin === null || gracePeriodMin === undefined || startTime.trim() === '' || endTime.trim() === '' || gracePeriodMin < 0 || breakTimeStart.trim() === '' || breakTimeEnd.trim() === '') {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const exist = await shiftSchema.findById(shiftId);
        if (!exist) {
            return res.status(400).json({ message: 'Shift not found' });
        }

        // const Data = getISTDateAndTime().toISOString().split('T')[0];
        // const starttime = `T${startTime}:00.000Z`;
        // const endtime = `T${endTime}:00.000Z`;


        const updatedShift = await shiftSchema.findByIdAndUpdate(shiftId, {
            name: newName,
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            updatedBy: employeeId,
            updatedAt: getISTDateAndTime(),
            orgId: req?.user?.orgId,
            breakTimeStart: breakTimeStart.toString(),
            breakTimeEnd: breakTimeEnd.toString(),
            gracePeriodMin: gracePeriodMin
        }, { new: true });

        logger.info(`Shift '${exist.name}' updated to '${newName}' by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: 'Shift updated successfully' });
    } catch (error) {
        console.error('Error updating shift:', error);
        return res.status(500).json({ message: 'Error updating shift', error: error.message });
    }
}

const deleteShift = async (req, res) => {
    try {
        const { shiftId } = req.params;
        if (!shiftId) {
            return res.status(400).json({ message: 'Shift ID is required' });
        }
        const exist = await shiftSchema.findById(shiftId);
        if (!exist) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        await shiftSchema.findByIdAndDelete(shiftId);
        logger.info(`Shift '${exist.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return res.status(500).json({ message: 'Error deleting shift', error: error.message });
    }
}

module.exports = {
    addNewShift,
    getAllShifts,
    updateShift,
    deleteShift
};