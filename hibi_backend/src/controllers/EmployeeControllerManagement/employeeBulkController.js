// controllers/employeeBulkController.js
const { uploadToS3 } = require('../../utils/s3Upload');
const { processExcelFile } = require('../../utils/excelProcessor');
const employeeSchema = require('../../models/EmployeeSchemaManagement/employeeSchema');
const { generatePassword, sendmail } = require('../../utils/mailSender');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const XLSX = require('xlsx');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const logger = require('../../utils/logger');

const Organization = require('../../models/organizationSchema');
const Privilege = require('../../models/EmployeeSchemaManagement/privilegeSchema');
const StatusTypes = require('../../models/statusSchema');
const Departments = require('../../models/EmployeeSchemaManagement/departmentSchema');
const Designations = require('../../models/EmployeeSchemaManagement/designationSchema');
const Roles = require('../../models/EmployeeSchemaManagement/rolesSchema');
const Teams = require('../../models/teamSchema');
const Shifts = require('../../models/EmployeeSchemaManagement/shiftSchema');

const uploadEmployeeExcel = async (req, res) => {
    try {
        if (!req.file) {
            console.error("[employeeBulkController] No file uploaded. Make sure the frontend uses field name 'excelFile'. Received req.file:", req.file);
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please ensure the file field name is 'excelFile' in your form-data.",
                debug: {
                    receivedFields: Object.keys(req.body),
                    receivedFiles: req.files || null
                }
            });
        }
        console.log("debug: File uploaded");
        // return res.status(500).json({ success: false, message: "Bulk upload temporarily disabled for maintenance. Please try again later." });


        // First, process and validate Excel
        console.log('[bulk] Step 1: Calling processExcelFile...');
        const { processed, errors, totalRows } = await processExcelFile(req.file.buffer, req.user.orgId);
        console.log(`[bulk] Step 1 done. processed=${processed.length} errors=${errors.length} totalRows=${totalRows}`);

        // If there are errors, map _id fields to names for security
        if (errors.length > 0) {
            const sanitizedErrors = errors.map(err => {
                const { orgId, privilegeId, roleId, ...rest } = err;
                return rest;
            });
            console.log("debug: Sanitized errors:", sanitizedErrors);
            return res.json({
                success: false,
                message: 'Excel file contains errors',
                totalRows,
                validRows: processed.length,
                errorRows: errors.length,
                errors: sanitizedErrors,
                preview: processed.slice(0, 5)
            });
        }

        if (!processed || processed.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid employee data found in Excel. Nothing inserted.',
                totalRows,
                validRows: 0,
                errorRows: 0,
                errors: [],
                preview: []
            });
        }

        // Check for duplicates in DB
        console.log('[bulk] Step 2: Checking for duplicates...');
        const orgId = req.user.orgId;
        const employeeCodes = processed.map(emp => emp.employeeCode);
        const personalEmails = processed.map(emp => emp.personalEmail);
        const officeMails = processed.map(emp => emp.officeMail);

        const duplicateEmployees = await employeeSchema.find({
            orgId,
            $or: [
                { employeeCode: { $in: employeeCodes } },
                { personalEmail: { $in: personalEmails } },
                { officeMail: { $in: officeMails } }
            ]
        }).select('employeeCode personalEmail officeMail');
        console.log(`[bulk] Step 2 done. duplicates found: ${duplicateEmployees.length}`);

        if (duplicateEmployees.length > 0) {
            const duplicateDetails = duplicateEmployees.map(emp => ({
                employeeCode: emp.employeeCode,
                personalEmail: emp.personalEmail,
                officeMail: emp.officeMail
            }));
            return res.status(400).json({
                success: false,
                message: 'Duplicate employee data found in organization. Please remove these rows and re-upload.',
                duplicates: duplicateDetails,
                preview: processed.slice(0, 5)
            });
        }

        console.log('[bulk] Step 3: Fetching organization...');
        const organization = await Organization.findOne({ _id: orgId });
        console.log('[bulk] Step 3 done. org found:', !!organization);

        // Upload file to S3
        console.log('[bulk] Step 4: Uploading to S3...');
        let fileUrl;
        try {
            const uploadResult = await uploadToS3(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'employee-excel-uploads'
            );
            fileUrl = uploadResult.fileUrl;
            console.log('[bulk] Step 4 done. S3 URL:', fileUrl);
        } catch (uploadError) {
            console.error('[bulk] Step 4 FAILED - S3 upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload Excel file to S3 for confirmation. Data not inserted.',
                error: uploadError.message || uploadError
            });
        }

        // Proceed to DB insert
        console.log('[bulk] Step 5: Proceeding to DB insert for', processed.length, 'employees');
        let inserted = [];
        let failed = [];
        for (const emp of processed) {
            try {
                let pass = await generatePassword();
                emp.password = await bcrypt.hash(pass, saltRounds);
                emp.createdBy = req.user._id;
                emp.updatedBy = req.user._id;
                emp.profileImage = "";
                console.log(`[bulk] Inserting employee: ${emp.employeeCode}...`);
                const result = await employeeSchema.create(emp);
                console.log(`[bulk] Employee ${emp.employeeCode} inserted. Sending email to ${emp.officeMail}...`);
                await sendmail(
                    "Temporary Password",
                    "ONBOARDING",
                    `${emp.firstName} ${emp.lastName}`,
                    emp.officeMail,
                    pass,
                    organization.organizationEmail,
                    organization.organizationAppPassword,
                    emp.employeeCode
                );
                console.log(`[bulk] Email sent for ${emp.employeeCode}`);
                inserted.push(result);
            } catch (err) {
                console.error(`[bulk] Failed for employee ${emp.employeeCode}:`, err.message);
                failed.push({ data: emp, error: err.message || err });
            }
        }
        console.log('[bulk] Step 5 done. Success:', inserted.length, 'Failed:', failed.length);
        logger.info(`${inserted.length} employees uploaded by user ${req.user.firstName} ${req.user.lastName}`);
        res.json({
            success: true,
            message: `Inserted ${inserted.length} employees and saved Excel file for confirmation`,
            insertedCount: inserted.length,
            failedCount: failed.length,
            failed,
            fileUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to process or insert employees', error: error.message });
    }
};


const BULK_EMPLOYEE_FIELDS = [
    'privilege', 'employeeCode', 'firstName', 'lastName', 'personalEmail', 'officeMail', 'phone',
    'dateOfBirth', 'gender', 'dateOfJoining', 'role', 'salaryPerMonth', 'shift',
    'status', 'department', 'designation', 'team'
];

const EXAMPLE_ROW = {
    privilege: 'GENERAL',
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    personalEmail: 'john.doe@example.com',
    officeMail: 'john.doe@company.com',
    phone: '9876543210',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    dateOfJoining: '2022-01-01',
    role: 'EMPLOYEE',
    salaryPerMonth: '50000',
    shift: 'DAY',
    status: 'ACTIVE',
    department: 'IT',
    designation: 'Developer',
    team: 'Alpha'
};

const downloadEmployeeBulkTemplate = async (req, res) => {
    const worksheet = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: BULK_EMPLOYEE_FIELDS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee_bulk_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};

const downloadEmployeeReferenceData = async (req, res) => {
    const orgId = req?.user?.orgId;
    if (!orgId) {
        return res.status(400).json({ success: false, message: 'orgId missing in user context' });
    }

    // Fetch all names for each referenced model, with filters
    const [privileges, statuses, departments, designations, roles, teams, shifts] = await Promise.all([
        Privilege.find({ orgId, name: { $ne: 'ULTIMATEADMIN' } }).select('name'),
        StatusTypes.find({ orgId }).select('name'),
        Departments.find({ orgId }).select('name'),
        Designations.find({ orgId }).select('name'),
        Roles.find({ orgId, name: { $nin: ['ORGANIZATIONHEAD', 'CEO'] } }).select('name'),
        Teams.find({ orgId }).select('name'),
        Shifts.find({ orgId }).select('name')
    ]);

    // Find max length for each column
    const columns = [
        privileges.map(d => d.name),
        statuses.map(d => d.name),
        departments.map(d => d.name),
        designations.map(d => d.name),
        roles.map(d => d.name),
        teams.map(d => d.name),
        shifts.map(d => d.name)
    ];
    const maxRows = Math.max(...columns.map(col => col.length));

    // Prepare rows for single sheet, with empty columns between each
    const sheetRows = [];
    for (let i = 0; i < maxRows; i++) {
        sheetRows.push({
            Privilege: columns[0][i] || '',
            '': '', // empty column
            StatusType: columns[1][i] || '',
            '  ': '', // empty column
            Department: columns[2][i] || '',
            '   ': '', // empty column
            Designation: columns[3][i] || '',
            '    ': '', // empty column
            Role: columns[4][i] || '',
            '     ': '', // empty column
            Team: columns[5][i] || '',
            '      ': '', // empty column
            Shift: columns[6][i] || ''
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetRows, {
        header: [
            'Privilege', '', 'StatusType', '  ', 'Department', '   ', 'Designation', '    ', 'Role', '     ', 'Team', '      ', 'Shift'
        ]
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReferenceData');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee_reference_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};



module.exports = {
    uploadEmployeeExcel,
    downloadEmployeeBulkTemplate,
    downloadEmployeeReferenceData
};