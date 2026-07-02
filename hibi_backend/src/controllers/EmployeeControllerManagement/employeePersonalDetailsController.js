const employeePersonalDetailsSchema = require('../../models/EmployeeSchemaManagement/employeePersonalDetailsSchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const logger = require('../../utils/logger');

// Function to add new personal details for an employee
const addNewPersonalDetails = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const {
            bloodGroup,
            maritalStatus,
            address,
            city,
            state,
            postalCode,
            country,
            secondaryPhone
        } = req.body;
        // Validate required fields as per updated schema
        if (!employeeId || !bloodGroup || !maritalStatus || !address || !city || !state || !postalCode || !country) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }
        // check if the personal details already exist
        const existingDetails = await employeePersonalDetailsSchema.findOne({ employeeId });
        if (existingDetails) {
            return res.status(409).json({ message: "Personal details already exist" });
        }

        // Create new personal details
        const newPersonalDetails = new employeePersonalDetailsSchema({
            employeeId,
            bloodGroup: bloodGroup.trim().toUpperCase(),
            maritalStatus: maritalStatus.trim().toUpperCase(),
            secondaryPhone: secondaryPhone ? secondaryPhone.trim() : undefined,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
            createdBy: employeeId,
            updatedBy: employeeId,
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime()
        });
        await newPersonalDetails.save();
        logger.info(`Personal details for employee with ID '${employeeId}' added by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: "Personal details added successfully" });
    } catch (error) {
        console.error('Error while adding employee personal details : ', error);
        return res.status(500).json(error);
    }
}

// Function to get personal details of an employee
const getPersonalDetails = async (req, res) => {
    try {
        let employeeId = req?.user?._id;
        if (req.query.employeeId) {
            employeeId = req.query.employeeId;
        }
        const personalDetails = await employeePersonalDetailsSchema.findOne({ employeeId }, { 
            __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0, updatedBy: 0 
        });
        if (!personalDetails) {
            return res.status(404).json({ message: "Personal details not found" });
        }
        return res.status(200).json(personalDetails);
    } catch (error) {
        console.error('Error while fetching employee personal details : ', error);
        return res.status(500).json(error);
    }
}


// Function to update personal details of an employee
const updatePersonalDetails = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const {
            bloodGroup,
            maritalStatus,
            address,
            city,
            state,
            postalCode,
            country,
            secondaryPhone
        } = req.body;

        // Validate required fields as per updated schema
        if (!employeeId || !bloodGroup || !maritalStatus || !address || !city || !state || !postalCode || !country) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

            const personalDetails = await employeePersonalDetailsSchema.findOneAndUpdate(
                { employeeId },
                {
                    bloodGroup: bloodGroup.trim().toUpperCase(),
                    maritalStatus: maritalStatus.trim().toUpperCase(),
                    secondaryPhone: secondaryPhone && secondaryPhone.length > 0 ? secondaryPhone.trim() : "",
                    address: address.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    postalCode: postalCode.trim(),
                    country: country.trim(),
                    updatedBy: employeeId,
                    updatedAt: getISTDateAndTime()
                },
                { new: true }
            );
            if (!personalDetails) {
                return res.status(404).json({ message: "Personal details not found" });
            }
            logger.info(`Personal details for employee with ID '${employeeId}' updated by user ${req.user.firstName} ${req.user.lastName}`);
            return res.status(200).json({ message: "Personal details updated successfully", personalDetails });
    } catch (error) {
        console.error('Error while updating employee personal details : ', error);
        return res.status(500).json(error);
    }
}



module.exports = {
    addNewPersonalDetails,  // Add new personal details

    getPersonalDetails,     // Get personal details

    updatePersonalDetails   // Update personal details
};