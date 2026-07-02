const tripSchema = require('../../models/TripSchemaManagement/tripSchema');
const statusTypes = require('../../models/statusSchema');
const employeeSchema = require('../../models/EmployeeSchemaManagement/employeeSchema');
const privilegeSchema = require('../../models/EmployeeSchemaManagement/privilegeSchema');

const { getISTDateAndTime } = require('../../utils/timeFunction');
const mongoose = require("mongoose");
const statusSchema = require('../../models/statusSchema');
const ObjectId = mongoose.Types.ObjectId;
const logger = require('../../utils/logger');

const isDateOverlap = (aFrom, aTo, bFrom, bTo) => {
    if (!aFrom || !aTo || !bFrom || !bTo) return false;
    const Afrom = new Date(aFrom).getTime();
    const Ato = new Date(aTo).getTime();
    const Bfrom = new Date(bFrom).getTime();
    const Bto = new Date(bTo).getTime();
    return (Afrom <= Bto && Bfrom <= Ato);
};

const checkParticipantsAndHeadAvailability = async ({ tripHeadId, tripParticipants, orgId, fromDate, toDate, excludeTripId = null }) => {
    // Combine all employee ids we need to check
    const allEmployeeIds = [...new Set([...(tripParticipants || []), tripHeadId].filter(Boolean))];
    if (allEmployeeIds.length === 0) return { valid: true };

    // Find trips in same org where any of these employees are a participant or trip head
    // Populate statusId to inspect statusType
    const query = {
        orgId,
        $or: [
            { tripParticipants: { $in: allEmployeeIds } },
            { tripHeadId: { $in: allEmployeeIds } }
        ]
    };
    // Exclude a specific trip (useful when updating an existing trip)
    if (excludeTripId) {
        try {
            query._id = { $ne: new ObjectId(excludeTripId) };
        } catch (e) {
            // if excludeTripId is not a valid ObjectId, ignore the exclusion
        }
    }

    const otherTrips = await tripSchema.find(query).populate('statusId');

    // Iterate and check conflicts
    for (const trip of otherTrips) {
        const statusType = trip?.statusId?.statusType?.toString().toLowerCase();
        // Only consider active trips as blocking (per requirement)
        if (statusType !== 'active') continue;

        // For each employee, check their role in existing trip and overlap
        for (const empId of allEmployeeIds) {
            const isHeadInExisting = trip.tripHeadId && trip.tripHeadId.toString() === empId.toString();
            const isParticipantInExisting = Array.isArray(trip.tripParticipants) && trip.tripParticipants.map(String).includes(empId.toString());
            if (!isHeadInExisting && !isParticipantInExisting) continue;

            // If dates overlap -> conflict
            if (isDateOverlap(fromDate, toDate, trip.fromDate, trip.toDate)) {
                // Determine descriptive role conflict
                let roleConflict;
                // Cases:
                // 1) new employee is participant, existing trip head
                // 2) new employee is head, existing trip participant
                // 3) both participant in both (or both head in both) - simpler label
                if (tripParticipants && tripParticipants.map(String).includes(empId.toString()) && isHeadInExisting) {
                    roleConflict = 'participant (new) vs head (existing)';
                } else if (tripHeadId && tripHeadId.toString() === empId.toString() && isParticipantInExisting) {
                    roleConflict = 'head (new) vs participant (existing)';
                } else if (isHeadInExisting && tripHeadId && tripHeadId.toString() === empId.toString()) {
                    roleConflict = 'head in both trips';
                } else {
                    roleConflict = 'participant in both trips';
                }
                let empName = await employeeSchema.findById(empId).select('firstName lastName');

                // Format dates as DD-MM-YYYY
                const formatDate = (date) => {
                    const d = new Date(date);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}-${month}-${year}`;
                };

                return {
                    valid: false,
                    message: `Employee ${empName?.firstName || empId} has an active trip "${trip.tripTitle}" (${formatDate(trip.fromDate)} to ${formatDate(trip.toDate)}) — conflict: ${roleConflict}`
                };
            }
            // If no overlap, it's allowed (two active trips without overlap permitted)
        }
    }

    return { valid: true };
};

// Function to create a trip
const createTrip = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const orgId = req?.user?.orgId;

        // destructure the data from body
        const {
            tripTitle,
            tripHeadId,
            tripParticipants,
            destination,
            reason,
            fromDate,
            toDate,
            statusId,
            advanceAmount,
            tripType
        } = req.body;

        // Validate all the inputs
        if (!tripTitle || !tripHeadId ||
            !Array.isArray(tripParticipants) || tripParticipants.length === 0 ||
            !destination || !reason || !fromDate || !toDate ||
            statusId == null || advanceAmount == null || !tripType) {
            return res.status(400).json({ error: 'All fields are required and must be valid' });
        }

        // Check trip dates
        if (new Date(fromDate) >= new Date(toDate)) {
            return res.status(400).json({ error: 'fromDate must be before toDate' });
        }

        // Prevent trip head being in participants
        if (tripParticipants.map(String).includes(tripHeadId.toString())) {
            return res.status(400).json({ error: 'Trip head cannot be a participant in the same trip' });
        }

        // Check status type for the given statusId
        const statusDoc = await statusTypes.findById(statusId);
        if (!statusDoc) {
            return res.status(400).json({ error: 'Invalid statusId' });
        }

        // Validate tripType is a non-empty string
        if (typeof tripType !== 'string' || !tripType.trim()) {
            return res.status(400).json({ error: 'Invalid tripType' });
        }

        // Check for duplicate trip with all required fields, irrespective of status
        const duplicateTrip = await tripSchema.findOne({
            orgId,
            tripTitle,
            destination,
            reason,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            advanceAmount,
            tripHeadId,
            tripType: tripType.trim(),
            // tripParticipants is an array, so we check for exact match using $all and $size
            tripParticipants: { $all: tripParticipants, $size: tripParticipants.length }
        });
        if (duplicateTrip) {
            return res.status(400).json({ error: 'A trip with these details already exists (regardless of status)' });
        }

        const isActiveStatus = await statusSchema.findOne({ statusType: 'ACTIVE', orgId });

        // check if the tripParticipants and tripHead are valid by comparing with employee schema
        const validParticipants = await employeeSchema.find({ _id: { $in: tripParticipants }, status: isActiveStatus._id });
        const validTripHead = await employeeSchema.findOne({ _id: tripHeadId, status: isActiveStatus._id });

        if (validParticipants.length !== tripParticipants.length) {
            return res.status(400).json({ error: 'One or more trip participants are invalid or inactive' });
        }

        if (!validTripHead) {
            return res.status(400).json({ error: 'Trip head is invalid or inactive' });
        }

        // check if the tripParticipants and tripHead are not in other trip, that tripParticipants may be a tripHead or tripHead may be a participant
        const availabilityCheck = await checkParticipantsAndHeadAvailability({
            tripHeadId,
            tripParticipants,
            orgId,
            fromDate,
            toDate
        });

        if (!availabilityCheck.valid) {
            return res.status(400).json({ error: availabilityCheck.message });
        }

        // Create a new trip
        const newTrip = new tripSchema({
            orgId,
            createdBy: employeeId,
            tripTitle,
            destination,
            reason,
            fromDate,
            toDate,
            statusId,
            advanceAmount,
            tripHeadId,
            tripParticipants,
            tripType: tripType.trim(),
        });

        // Save the trip to the database
        await newTrip.save();

        logger.info(`Trip '${tripTitle}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Trip created successfully' });
    } catch (error) {
        console.error('Error creating trip:', error);
        return res.status(500).json({ message: 'Internal server error' , error: error.message });
    }
};


// Get all active trips
const getTrips = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;

        // Get user privilege
        const userPrivilege = await privilegeSchema.findOne({
            orgId: orgId,
            _id: req.user.privilegeId
        });

        if (!userPrivilege) {
            return res.status(403).json({ error: 'User privilege not found' });
        }

        // Check if user is SUPERADMIN
        const isSuperAdmin = userPrivilege.name?.toString().toUpperCase() === 'SUPERADMIN';

        // Build match condition based on privilege
        let matchCondition = {
            orgId: new ObjectId(orgId)
        };

        // If not SUPERADMIN, filter trips where user is tripHead or in tripParticipants
        if (!isSuperAdmin) {
            matchCondition.$or = [
                { tripHeadId: new ObjectId(userId) },
                { tripParticipants: new ObjectId(userId) }
            ];
        }

        // aggregating all the required fields
        const activeTrips = await tripSchema.aggregate([
            {
                $match: matchCondition
            },
            {
                $lookup: {
                    from: "statustypes",
                    localField: "statusId",
                    foreignField: "_id",
                    as: "statusInfo"
                }
            },
            {
                $unwind: "$statusInfo"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByInfo"
                }
            },
            {
                $unwind: "$createdByInfo"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "tripHeadId",
                    foreignField: "_id",
                    as: "tripHeadIdInfo"
                }
            },
            {
                $unwind: "$tripHeadIdInfo"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "tripParticipants",
                    foreignField: "_id",
                    as: "tripParticipantsInfo"
                }
            },
            {
                $project: {
                    reason: 1,
                    advanceAmount: 1,
                    tripParticipants: {
                        $map: {
                            input: "$tripParticipantsInfo",
                            in: {
                                _id: "$$this._id",
                                fullName: {
                                    $concat: [
                                        "$$this.firstName",
                                        " ",
                                        "$$this.lastName"
                                    ]
                                },
                                officeMail: "$$this.officeMail",
                                employeeCode: "$$this.employeeCode"
                            }
                        }
                    },
                    fromDate: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$fromDate"
                        }
                    },
                    toDate: {
                        $dateToString: {
                            format: "%d-%m-%Y",
                            date: "$toDate"
                        }
                    },
                    destination: 1,
                    orgId: 1,
                    createdAt: 1,
                    tripType: 1,
                    status: {
                        _id: "$statusId",
                        statusType: "$statusInfo.statusType"
                    },
                    tripTitle: 1,
                    _id: 1,
                    updatedAt: 1,
                    createdByInfo: {
                        _id: "$createdByInfo._id",
                        fullName: {
                            $concat: [
                                "$createdByInfo.firstName",
                                " ",
                                "$createdByInfo.lastName"
                            ]
                        },
                        officeMail: "$createdByInfo.officeMail",
                        employeeCode: "$createdByInfo.employeeCode"
                    },
                    tripHeadInfo: {
                        _id: "$tripHeadIdInfo._id",
                        fullname: {
                            $concat: [
                                "$tripHeadIdInfo.firstName",
                                " ",
                                "$tripHeadIdInfo.lastName"
                            ]
                        },
                        officeMail: "$tripHeadIdInfo.officeMail",
                        employeeCode: "$tripHeadIdInfo.employeeCode"
                    }
                }
            }
        ]);

        return res.status(200).json({ message: "Successfully fetched trips", activeTrips });
    } catch (error) {
        console.error('Error fetching trips:', error);
                return res.status(500).json({ message: 'Internal server error' , error: error.message });

    }
};

// Function to update a trip
const updateTrip = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const { tripId } = req.body;

        const {
            tripTitle,
            tripHeadId,
            tripParticipants,
            destination,
            reason,
            fromDate,
            toDate,
        } = req.body;

        // Validate tripId
        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        // Find the trip to update
        const trip = await tripSchema.findOne({ _id: tripId, orgId });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // check if the trip is in ACTIVE status and prevent the updates if the trip fromDate is less than current date
        const isActiveStatus = await statusTypes.findOne({ statusType: 'PROCESSING', orgId });
        if (trip.statusId.toString() === isActiveStatus._id.toString()) {
            const currentDate = getISTDateAndTime().setHours(0, 0, 0, 0);
            const tripFromDate = new Date(trip.fromDate).setHours(0, 0, 0, 0);
            if (tripFromDate < currentDate) {
                return res.status(400).json({ error: 'Cannot update an active trip that has already started' });
            }
        }

        // Update the trip fields
        const updatableFields = [
            'tripTitle',
            'tripType',
            'advanceAmount',
            'tripHeadId',
            'tripParticipants',
            'destination',
            'reason',
            'fromDate',
            'toDate',
        ];

        // Validate dates if they are being updated
        if (fromDate && toDate) {
            if (new Date(fromDate) >= new Date(toDate)) {
                return res.status(400).json({ error: 'fromDate must be before toDate' });
            }
        } else if (fromDate) {
            if (new Date(fromDate) >= new Date(trip.toDate)) {
                return res.status(400).json({ error: 'fromDate must be before toDate' });
            }
        } else if (toDate) {
            if (new Date(trip.fromDate) >= new Date(toDate)) {
                return res.status(400).json({ error: 'fromDate must be before toDate' });
            }
        }

        // Validate all the employees were active or not
        const isActiveEmpStatus = await statusTypes.findOne({ statusType: 'ACTIVE', orgId });

        // check if the tripParticipants and tripHead are valid by comparing with employee schema
        const validParticipants = await employeeSchema.find({ _id: { $in: tripParticipants }, status: isActiveEmpStatus._id });
        const validTripHead = await employeeSchema.findOne({ _id: tripHeadId, status: isActiveEmpStatus._id });

        if (validParticipants.length !== tripParticipants.length) {
            return res.status(400).json({ error: 'One or more trip participants are invalid or inactive' });
        }

        // Prevent trip head being in participants
        const newTripHeadId = tripHeadId;
        const newTripParticipants = tripParticipants;
        if (Array.isArray(newTripParticipants) && newTripParticipants.map(String).includes(newTripHeadId.toString())) {
            return res.status(400).json({ error: 'Trip head cannot be a participant in the same trip' });
        }

        // If tripHeadId or tripParticipants or fromDate/toDate are being updated, re-check availability
        if (tripHeadId || tripParticipants || fromDate || toDate) {
            const availabilityCheck = await checkParticipantsAndHeadAvailability({
                tripHeadId: newTripHeadId,
                tripParticipants: newTripParticipants,
                orgId,
                fromDate: fromDate || trip.fromDate,
                toDate: toDate || trip.toDate,
                excludeTripId: tripId // exclude current trip from conflict checks
            });

            if (!availabilityCheck.valid) {
                return res.status(400).json({ error: availabilityCheck.message });
            }
        }

        // Update the trip fields
        const updates = {};
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // Validate tripType if updated
        if (updates.tripType !== undefined) {
            if (typeof updates.tripType !== 'string' || !updates.tripType.trim()) {
                return res.status(400).json({ error: 'Invalid tripType' });
            }
            updates.tripType = updates.tripType.trim();
        }

        // Validate advanceAmount if updated
        if (updates.advanceAmount !== undefined && (isNaN(updates.advanceAmount) || updates.advanceAmount < 0)) {
            return res.status(400).json({ error: 'advanceAmount must be a non-negative number' });
        }

        // Prevent tripParticipants being empty
        if (updates.tripParticipants && Array.isArray(updates.tripParticipants) && updates.tripParticipants.length === 0) {
            return res.status(400).json({ error: 'Trip must have at least one participant' });
        }

        // Prevent status change to ACTIVE if trip already started
        // if (req.body.statusId) {
        //     const statusDoc = await statusTypes.findById(req.body.statusId);
        //     if (statusDoc && statusDoc.statusType === 'PROCESSING') {
        //         const currentDate = getISTDateAndTime().setHours(0, 0, 0, 0);
        //         const tripFromDate = new Date(trip.fromDate).setHours(0, 0, 0, 0);
        //         if (tripFromDate < currentDate) {
        //             return res.status(400).json({ error: 'Cannot set status to PROCESSING for a trip that has already started' });
        //         }
        //     }
        // }

        // Check for duplicate trip if key fields are updated
        const keyFields = [
            'tripTitle', 'destination', 'reason', 'fromDate', 'toDate', 'advanceAmount', 'tripHeadId', 'tripType', 'tripParticipants'
        ];
        const isKeyFieldUpdated = keyFields.some(field => updates[field] !== undefined);
        if (isKeyFieldUpdated) {
            const duplicateTrip = await tripSchema.findOne({
                orgId,
                tripTitle: updates.tripTitle || trip.tripTitle,
                destination: updates.destination || trip.destination,
                reason: updates.reason || trip.reason,
                fromDate: updates.fromDate ? new Date(updates.fromDate) : trip.fromDate,
                toDate: updates.toDate ? new Date(updates.toDate) : trip.toDate,
                advanceAmount: updates.advanceAmount !== undefined ? updates.advanceAmount : trip.advanceAmount,
                tripHeadId: updates.tripHeadId || trip.tripHeadId,
                tripType: updates.tripType || trip.tripType,
                tripParticipants: updates.tripParticipants ? { $all: updates.tripParticipants, $size: updates.tripParticipants.length } : { $all: trip.tripParticipants, $size: trip.tripParticipants.length },
                _id: { $ne: tripId }
            });
            if (duplicateTrip) {
                return res.status(400).json({ error: 'A trip with these details already exists (regardless of status)' });
            }
        }

        const updatedTrip = await tripSchema.findOneAndUpdate(
            { _id: tripId, orgId },
            { $set: updates, updatedAt: getISTDateAndTime() },
            { new: true }
        );

        if (!updatedTrip) {
            return res.status(404).json({ error: 'Trip not found or could not be updated' });
        }

        logger.info(`Trip '${updatedTrip.tripTitle}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Trip updated successfully' });
    } catch (error) {
        console.error('Error updating trip:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Function to change the status of a trip
const changeTripStatus = async (req, res) => {
    try {
        const { tripId, statusId } = req.body;
        // Validate inputs
        if (!tripId || !statusId) {
            return res.status(400).json({ error: 'tripId and statusId are required' });
        }

        // Find the trip
        const trip = await tripSchema.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Update the status
        trip.statusId = statusId;
        await trip.save();

        logger.info(`Trip '${trip.tripTitle}' status changed by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Trip status updated successfully' });
    } catch (error) {
        console.error('Error while changing status of a Trip: ', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Function to delete a trip
const deleteTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        // Validate input
        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        // Find and delete the trip
        const deletedTrip = await tripSchema.findByIdAndDelete(tripId);
        if (!deletedTrip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        logger.info(`Trip '${deletedTrip.tripTitle}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        console.error('Error deleting trip:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    createTrip,             // Create a new trip

    getTrips,               // Get all active trips

    updateTrip,              // Update a trip

    changeTripStatus,      // Change the status of a trip

    deleteTrip              // Delete a trip
};