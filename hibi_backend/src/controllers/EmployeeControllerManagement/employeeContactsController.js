const employeeContactsSchema = require('../../models/EmployeeSchemaManagement/employeeContactsSchema');
const employeeSchema = require('../../models/EmployeeSchemaManagement/employeeSchema');
const logger = require('../../utils/logger');

const { getISTDateAndTime } = require('../../utils/timeFunction');

// Funtion to add existing employee contacts
const addEmployeeContacts = async (req, res) => {
    try {
        // who updates the employee contacts, himself or the admin, if admin, here i need to change the employee id
        const employeeId = req?.user?._id;
        const {
            name,
            relationship,
            contactNumber,
            email,
            address,
            city,
            state,
            country,
            postalCode
        } = req.body;

        // Validate only required fields as per schema
        if (!employeeId || !name || !relationship || !contactNumber) {
            return res.status(400).json({ message: "employeeId, name, relationship, and contactNumber are required" });
        }

        // check if the employee is exist or not
        const employeeExists = await employeeSchema.findOne({ _id: employeeId });
        if (!employeeExists) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // check if the contact already exists for the employee
        const contactExists = await employeeContactsSchema.findOne({ employeeId, name: name.trim().toUpperCase(), phone: contactNumber });
        if (contactExists) {
            return res.status(409).json({ message: "Contact already exists for this employee" });
        }

        // Create a new contact
        const newContact = new employeeContactsSchema({
            employeeId,
            name: name.trim().toUpperCase(),
            relationShip: relationship.trim().toUpperCase(),
            phone: contactNumber,
            email: email ? email.trim().toLowerCase() : undefined,
            address: address ? address.trim() : undefined,
            city: city ? city.trim() : undefined,
            state: state ? state.trim() : undefined,
            country: country ? country.trim() : undefined,
            postalCode: postalCode ? postalCode.trim() : undefined,
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime(),
            createdBy: employeeId,
            updatedBy: employeeId
        });

        // Save the new contact
        await newContact.save();
        logger.info(`Contact '${name}' added by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: "Employee contact added successfully" });

    } catch (error) {
        console.error("Error adding employee contacts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to update existing employee contacts
const updateEmployeeContacts = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const {
            contactId,
            name,
            relationship,
            contactNumber,
            email,
            address,
            city,
            state,
            country,
            postalCode
        } = req.body;

        // Validate only required fields as per schema
        if (!contactId || !employeeId || !name || !relationship || !contactNumber) {
            return res.status(400).json({ message: "contactId, employeeId, name, relationship, and contactNumber are required" });
        }

        // Check if the employee exists
        const employeeExists = await employeeSchema.findOne({ _id: employeeId });
        if (!employeeExists) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Check if the contact exists
        const contactExists = await employeeContactsSchema.findOne({ _id: contactId, employeeId });
        if (!contactExists) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Update the contact
        contactExists.name = name.trim().toUpperCase();
        contactExists.relationShip = relationship.trim().toUpperCase();
        contactExists.phone = contactNumber;
        contactExists.email = email ? email.trim().toLowerCase() : contactExists.email;
        contactExists.address = address ? address.trim() : contactExists.address;
        contactExists.city = city ? city.trim() : contactExists.city;
        contactExists.state = state ? state.trim() : contactExists.state;
        contactExists.country = country ? country.trim() : contactExists.country;
        contactExists.postalCode = postalCode ? postalCode.trim() : contactExists.postalCode;
        contactExists.updatedAt = getISTDateAndTime();
        contactExists.updatedBy = employeeId;

        // Save the updated contact
        await contactExists.save();
        logger.info(`Contact '${name}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "Employee contact updated successfully" });
    } catch (error) {
        console.error("Error updating employee contacts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to get all employee contacts
const getAllContacts = async (req, res) => {
    try {
        let employeeId = req?.user?._id;
        if (req.query.employeeId) {
            employeeId = req.query.employeeId;
        }
        const contacts = await employeeContactsSchema.find({ employeeId }, { __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0, updatedBy: 0 }).lean();
        return res.status(200).json({ contacts });
    } catch (error) {
        console.error("Error fetching employee contacts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to delete an employee contact
const deleteEmployeeContact = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const { contactId } = req.params;

        // Validate the contact ID
        if (!contactId) {
            return res.status(400).json({ message: "Please provide a contact ID" });
        }

        // Check if the employee exists
        const employeeExists = await employeeSchema.findOne({ _id: employeeId });
        if (!employeeExists) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Check if the contact exists
        const contactExists = await employeeContactsSchema.findOne({ _id: contactId, employeeId });
        if (!contactExists) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Delete the contact
        await employeeContactsSchema.deleteOne({ _id: contactId, employeeId });
        logger.info(`Contact '${contactExists.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "Employee contact deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee contacts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    addEmployeeContacts,    // Add new employee contact
    updateEmployeeContacts,  // Update existing employee contact
    getAllContacts,          // Get all employee contacts
    deleteEmployeeContact    // Delete an employee contact
};