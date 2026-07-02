const careerHistorySchema = require('../../models/EmployeeSchemaManagement/careerHistorySchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const logger = require('../../utils/logger');

// Function to create a new career history entry
const createCareerHistory = async (req, res) => {
    try {
        const { startDate, endDate, organizationName, role, description } = req.body;

        // Basic validation
        if (!startDate || !endDate || !organizationName || !role) {
            return res.status(400).json({ message: "Start date, end date, organization name, and role are required" });
        }

        const orgId = req.user.orgId;
        const employeeId = req.user._id;

        // Should not allow future start dates
        if (new Date(startDate) > getISTDateAndTime()) {
            return res.status(400).json({ message: "Start date cannot be in the future" });
        }

        // End date should be after start date
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ message: "End date cannot be before start date" });
        }

        // should not allow overlapping career history entries
        const overlappingEntry = await careerHistorySchema.findOne({
            employeeId,
            $or: [
                { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
                { endDate: null, startDate: { $lte: new Date(endDate) } } // current employment case
            ]
        });

        if (overlappingEntry) {
            return res.status(400).json({ message: "Career history entries cannot overlap" });
        }

        // should not allow duplicate entries for the same organization and role
        const duplicateEntry = await careerHistorySchema.findOne({
            employeeId,
            organizationName,
            role,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        if (duplicateEntry) {
            return res.status(400).json({ message: "Duplicate career history entry for the same organization and role" });
        }

        // Create and save the new career history entry
        const newCareerHistory = new careerHistorySchema({
            orgId,
            employeeId,
            startDate,
            endDate,
            organizationName,
            role,
            description,
            createdBy: req.user._id
        });

        await newCareerHistory.save();
        logger.info(`Career history for organization '${organizationName}' created by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(201).json({ message: "Career history created successfully" });
    } catch (error) {
        console.error("Error creating career history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Function to get all career history entries for the logged-in employee
const getCareerHistories = async (req, res) => {
    try {
        const employeeId = req.user._id;

        const careerHistories = await careerHistorySchema.aggregate(
            [
                {
                    $match: {
                        orgId: req.user.orgId,
                        employeeId: employeeId
                    }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "_id",
                        as: "employeeInfo"
                    }
                },
                { $unwind: "$employeeInfo" },
                {
                    $project: {
                        orgId: 1,
                        employeeId: 1,
                        startDate: 1,
                        endDate: 1,
                        organizationName: 1,
                        role: 1,
                        description: 1,
                        employeeInfo: {
                            name: {
                                $concat: [
                                    "$employeeInfo.firstName",
                                    " ",
                                    "$employeeInfo.lastName"
                                ]
                            },
                            employeeId: "$employeeInfo._id",
                            employeeCode: "$employeeInfo.employeeCode",
                            officeMail: "$employeeInfo.officeMail"
                        },
                        createdAt: 1
                    }
                },
                {
                    $sort: {
                        startDate: 1,
                        endDate: 1
                    }
                }
            ]);

        res.status(200).json({ message: "Career histories fetched successfully", data: careerHistories });
    } catch (error) {
        console.error("Error fetching career histories:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Function to delete a career history entry
const deleteCareerHistory = async (req, res) => {
    try {
        const { careerHistoryId } = req.params;
        const employeeId = req.user._id;

        if (!careerHistoryId) {
            return res.status(400).json({ message: "Career history ID is required" });
        }

        const careerHistory = await careerHistorySchema.findOne({ _id: careerHistoryId, employeeId });

        if (!careerHistory) {
            return res.status(404).json({ message: "Career history not found" });
        }

        await careerHistorySchema.deleteOne({ _id: careerHistoryId });
        logger.info(`Career history for organization '${careerHistory.organizationName}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Career history deleted successfully" });
    } catch (error) {
        console.error("Error deleting career history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Function to update a career history entry
const updateCareerHistory = async (req, res) => {
    try {
        const { careerHistoryId } = req.params;
        const { startDate, endDate, organizationName, role, description } = req.body;
        const employeeId = req.user._id;

        if (!careerHistoryId) {
            return res.status(400).json({ message: "Career history ID is required" });
        }

        const careerHistory = await careerHistorySchema.findOne({ _id: careerHistoryId, employeeId });

        if (!careerHistory) {
            return res.status(404).json({ message: "Career history not found" });
        }

        // Basic validation
        if (!startDate || !endDate || !organizationName || !role) {
            return res.status(400).json({ message: "Start date, end date, organization name, and role are required" });
        }

        // Should not allow future start dates
        if (new Date(startDate) > getISTDateAndTime()) {
            return res.status(400).json({ message: "Start date cannot be in the future" });
        }

        // End date should be after start date
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ message: "End date cannot be before start date" });
        }

        // should not allow overlapping career history entries
        const overlappingEntry = await careerHistorySchema.findOne({
            employeeId,
            _id: { $ne: careerHistoryId },
            $or: [
                { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
                { endDate: null, startDate: { $lte: new Date(endDate) } } // current employment case
            ]
        });

        if (overlappingEntry) {
            return res.status(400).json({ message: "Career history entries cannot overlap" });
        }

        // should not allow duplicate entries for the same organization and role
        const duplicateEntry = await careerHistorySchema.findOne({
            employeeId,
            _id: { $ne: careerHistoryId },
            organizationName,
            role,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        if (duplicateEntry) {
            return res.status(400).json({ message: "Duplicate career history entry for the same organization and role" });
        }

        // Update the career history entry
        careerHistory.startDate = startDate;
        careerHistory.endDate = endDate;
        careerHistory.organizationName = organizationName;
        careerHistory.role = role;
        careerHistory.description = description;
        careerHistory.updatedAt = getISTDateAndTime();
        careerHistory.updatedBy = req.user._id;

        await careerHistory.save();
        logger.info(`Career history for organization '${organizationName}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Career history updated successfully" });
    } catch (error) {
        console.error("Error updating career history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createCareerHistory,    // Function to create a new career history entry

    getCareerHistories,     // Function to get all career history entries for the logged-in employee

    deleteCareerHistory,    // Function to delete a career history entry

    updateCareerHistory     // Function to update a career history entry
};