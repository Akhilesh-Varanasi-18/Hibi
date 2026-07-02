
const employeeBankDetailsSchema = require('../../models/EmployeeSchemaManagement/employeeBankDetailsSchema');
const employeeSchema = require('../../models/EmployeeSchemaManagement/employeeSchema');
const statusSchema = require('../../models/statusSchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Upload');
const logger = require('../../utils/logger');

// Function to create the employee Bank Details with file upload and S3
const addEmployeeBankDetails = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const orgId = req?.user?.orgId;
        let { bankName, accountHolderName, accountNumber, ifscCode } = req.body;

        // Validate required fields
        if (!employeeId || !orgId || !bankName || !accountHolderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        bankName = bankName.toUpperCase().trim();
        accountHolderName = accountHolderName.toUpperCase().trim();
        accountNumber = accountNumber.trim().toString();
        ifscCode = ifscCode.trim().toString();

        // Check if the employee exists
        const employee = await employeeSchema.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check if employee bank details already exist
        const isExist = await employeeBankDetailsSchema.findOne({ employeeId });
        if (isExist) {
            return res.status(400).json({ message: 'Employee Bank Details already exist, please update them instead.' });
        }

        // Handle file upload to S3

        let bankPassBookUrl = '';
        if (req.file) {
            try {
                const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'bankPassBook');
                bankPassBookUrl = s3Result.fileUrl;
            } catch (err) {
                return res.status(500).json({ message: 'Failed to upload file to S3', error: err.message });
            }
        }

        const status = await statusSchema.findOne({ orgId: orgId, statusType: 'ACCEPTED' });
        console.log({ status });
        if (!status) {
            return res.status(500).json({ message: 'Status type ACCEPTED not found in the system. Please contact admin.' });
        }

        // Create new employee bank details
        const newBankDetails = new employeeBankDetailsSchema({
            employeeId,
            orgId,
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankPassBookUrl,
            // for now , everything will be approved by default, but have to change later to pending and take approval from accountant
            status: status._id,
            createdBy: employeeId,
            updatedBy: employeeId,
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime()
        });

        await newBankDetails.save();
        logger.info(`Bank details for account holder '${accountHolderName}' added by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: 'Employee Bank Details added successfully', status: 'APPROVED' });
    } catch (error) {
        console.error('Error adding Employee Bank Details : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Function to get employee bank details (visible to employee and accountant)
const getEmployeeBankDetails = async (req, res) => {
    try {
        let employeeId = req?.user?._id;
        if (req.query.employeeId) {
            employeeId = req.query.employeeId;
        }
        const userRole = req?.user?.role;
        const orgId = req?.user?.orgId;

        // If accountant, allow query by employeeId param
        let queryEmployeeId = employeeId;
        if (userRole === 'ACCOUNTANT' && req.query.employeeId) {
            queryEmployeeId = req.query.employeeId;
        }

        const bankDetails = await employeeBankDetailsSchema.findOne({ orgId, employeeId: queryEmployeeId }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            createdBy: 0,
            updatedBy: 0
        });
        if (!bankDetails) {
            return res.status(404).json({ message: 'Employee Bank Details not found' });
        }

        // Only allow employee or accountant to view
        if (employeeId !== queryEmployeeId && userRole !== 'ACCOUNTANT') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        return res.status(200).json({ message: "Successfully fetched Employee Bank Details", bankDetails });
    } catch (error) {
        console.error('Error fetching Employee Bank Details : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Function to update employee bank details, for now, self update is allowed
const updateEmployeeBankDetails = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const orgId = req?.user?.orgId;
        let { bankName, accountHolderName, accountNumber, ifscCode } = req.body;

        // Validate required fields
        if (!employeeId || !orgId || !bankName || !accountHolderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Normalize input
        bankName = bankName.toUpperCase().trim();
        accountHolderName = accountHolderName.toUpperCase().trim();
        accountNumber = accountNumber.trim().toString();
        ifscCode = ifscCode.trim().toString();

        // Check if employee exists
        const employee = await employeeSchema.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Find existing bank details
        const bankDetails = await employeeBankDetailsSchema.findOne({ employeeId });
        if (!bankDetails) {
            return res.status(404).json({ message: 'Employee Bank Details not found, please create them first.' });
        }

        // Handle file update if new file provided
        if (req.file) {
            try {
                if (bankDetails.bankPassBookUrl) {
                    await deleteFromS3(bankDetails.bankPassBookUrl);
                }
                const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'bankPassBook');
                bankDetails.bankPassBookUrl = s3Result.fileUrl;
            } catch (err) {
                return res.status(500).json({ message: 'Failed to update file on S3', error: err.message });
            }
        }

        // Update bank details fields
        bankDetails.bankName = bankName;
        bankDetails.accountHolderName = accountHolderName;
        bankDetails.accountNumber = accountNumber;
        bankDetails.ifscCode = ifscCode;
        bankDetails.updatedBy = employeeId;
        bankDetails.updatedAt = getISTDateAndTime();

        await bankDetails.save();
        logger.info(`Bank details for account holder '${accountHolderName}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Employee Bank Details updated successfully' });
    } catch (error) {
        console.error('Error updating Employee Bank Details : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Accountant approval endpoint
const approveEmployeeBankDetails = async (req, res) => {
    try {
        const userRole = req?.user?.role;
        if (userRole !== 'ACCOUNTANT') {
            return res.status(403).json({ message: 'Only accountant can approve bank details.' });
        }
        const { id } = req.params;
        const bankDetails = await employeeBankDetailsSchema.findById(id);
        if (!bankDetails) {
            return res.status(404).json({ message: 'Employee Bank Details not found' });
        }
        bankDetails.status = 'ACTIVE';
        bankDetails.updatedAt = getISTDateAndTime();
        bankDetails.updatedBy = req?.user?._id;
        await bankDetails.save();
        logger.info(`Bank details with ID '${id}' approved by accountant ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: 'Employee Bank Details approved and activated.' });
    } catch (error) {
        console.error('Error approving Employee Bank Details : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    addEmployeeBankDetails,          // Function to add employee bank details
    getEmployeeBankDetails,          // Function to get employee bank details
    approveEmployeeBankDetails,       // Accountant approval
    updateEmployeeBankDetails        // Function to update employee bank details
};