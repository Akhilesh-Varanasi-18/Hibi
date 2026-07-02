// Helper to convert Excel serial date to JS date string (yyyy-mm-dd)
function excelDateToISO(serial) {
    // Excel's epoch starts at 1900-01-01, but JS Date epoch is 1970-01-01
    // Excel incorrectly treats 1900 as a leap year, so dates >= 60 are offset by 1
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Math.floor(serial);
    const ms = days * 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + ms);
    // Return as yyyy-mm-dd string
    return date.toISOString().slice(0, 10);
}
// utils/excelProcessor.js
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Import referenced models
const Organization = require('../models/organizationSchema');
const Privilege = require('../models/EmployeeSchemaManagement/privilegeSchema');
const StatusTypes = require('../models/statusSchema');
const Departments = require('../models/EmployeeSchemaManagement/departmentSchema');
const Designations = require('../models/EmployeeSchemaManagement/designationSchema');
const Roles = require('../models/EmployeeSchemaManagement/rolesSchema');

const Teams = require('../models/teamSchema');
const Shifts = require('../models/EmployeeSchemaManagement/shiftSchema');
const Employees = require('../models/EmployeeSchemaManagement/employeeSchema');


const REQUIRED_FIELDS = [
    'privilege', 'employeeCode', 'firstName', 'lastName',
    'personalEmail', 'officeMail', 'phone',
    'dateOfBirth', 'gender', 'dateOfJoining', 'role',
    'salaryPerMonth', 'shift'
];

const VALID_GENDERS = ['MALE', 'FEMALE', 'PREFER NOT TO SAY'];




// Helper to batch fetch all referenced docs for the org and map to IDs case-insensitively
// NOTE: Fetches all docs for the org (not using regex in $in to avoid MongoDB index scan issues)
async function getNameIdMap(model, nameField, names, orgId) {
    if (!names || names.size === 0) return {};

    const namesArray = Array.from(names).map(n => n.toString().toLowerCase());

    // Fetch all docs for this org and match case-insensitively in JS
    const docs = await model.find({ orgId }).select('_id ' + nameField).lean();
    const map = {};

    const originalNames = Array.from(names);
    docs.forEach(doc => {
        const docNameLower = (doc[nameField] || '').toLowerCase();
        // Check if this doc's name matches any name from the Excel
        const matchedOriginal = originalNames.find(n => n.toString().toLowerCase() === docNameLower);
        if (matchedOriginal) {
            map[matchedOriginal] = doc._id;
        }
    });
    return map;
}


const processExcelFile = async (fileBuffer, orgId) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Gather all employeeCodes from the Excel file
    const employeeCodes = rawData.map(row => row.employeeCode).filter(Boolean);
    // Query DB for existing employeeCodes in this org
    const existingEmployees = await Employees.find({ employeeCode: { $in: employeeCodes } }).select('employeeCode');
    const existingEmployeeCodes = new Set(existingEmployees.map(e => e.employeeCode));

    // Check for empty Excel file or only column headers
    if (!rawData || rawData.length === 0) {
        return {
            processed: [],
            errors: [{ row: 1, error: 'Excel file is empty or contains only column headers. Please provide employee data before uploading.', data: null }],
            totalRows: 0
        };
    }

    // Detect if all rows are identical to the template/example row
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

    // Helper to compare a row to the example row
    function isExampleRow(row) {
        for (const key in EXAMPLE_ROW) {
            if ((row[key] || '').toString().trim() !== EXAMPLE_ROW[key]) {
                return false;
            }
        }
        return true;
    }

    const allRowsAreExample = rawData.length > 0 && rawData.every(isExampleRow);
    if (allRowsAreExample) {
        return {
            processed: [],
            errors: [{ row: 2, error: 'Uploaded file contains only template/example data. Please fill in real employee data before uploading.', data: rawData[0] }],
            totalRows: rawData.length
        };
    }

    // ...existing code...
    const privilegeNames = new Set();
    const statusNames = new Set();
    const departmentNames = new Set();
    const designationNames = new Set();
    const roleNames = new Set();
    const teamNames = new Set();
    const shiftNames = new Set();

    rawData.forEach(row => {
        if (row['privilege']) privilegeNames.add(row['privilege']);
        if (row['status']) statusNames.add(row['status']);
        if (row['department']) departmentNames.add(row['department']);
        if (row['designation']) designationNames.add(row['designation']);
        if (row['role']) roleNames.add(row['role']);
        if (row['team']) teamNames.add(row['team']);
        if (row['shift']) shiftNames.add(row['shift']);
    });

    // Fetch all reference maps in parallel
    console.log('[excelProcessor] Fetching reference ID maps from DB...');
    const [privilegeMap, statusMap, departmentMap, designationMap, roleMap, teamMap, shiftMap] = await Promise.all([
        getNameIdMap(Privilege, 'name', privilegeNames, orgId),
        getNameIdMap(StatusTypes, 'statusType', statusNames, orgId),
        getNameIdMap(Departments, 'name', departmentNames, orgId),
        getNameIdMap(Designations, 'title', designationNames, orgId),
        getNameIdMap(Roles, 'name', roleNames, orgId),
        getNameIdMap(Teams, 'teamName', teamNames, orgId),
        getNameIdMap(Shifts, 'name', shiftNames, orgId)
    ]);
    console.log('[excelProcessor] Reference maps fetched. Fetching ACTIVE status...');

    // Fetch ACTIVE status separately to use as default for employees with no status specified
    const activeStatusDoc = await StatusTypes.findOne({ orgId }).where('statusType').equals('ACTIVE').lean();
    const activeStatusId = activeStatusDoc ? activeStatusDoc._id : null;
    console.log('[excelProcessor] ACTIVE status ID:', activeStatusId);

    const processed = [];
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowIndex = i + 2;
        let errorMsg = '';

        // Process team logic instead of skipping
        // Support mapping team dynamically

        // Check for duplicate employeeCode in DB
        if (row.employeeCode && existingEmployeeCodes.has(row.employeeCode)) {
            errorMsg += `Employee code already exists: ${row.employeeCode}. `;
        }

        function isValidISODate(str) {
            return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
        }

        // Fix Excel date serials for dateOfBirth and dateOfJoining
        ['dateOfBirth', 'dateOfJoining'].forEach(field => {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                if (typeof row[field] === 'number') {
                    row[field] = excelDateToISO(row[field]);
                } else if (typeof row[field] === 'string' && /^\d+(\.\d+)?$/.test(row[field])) {
                    // Sometimes numbers come as strings
                    row[field] = excelDateToISO(Number(row[field]));
                }

                if (!isValidISODate(row[field])) {
                    errorMsg += `Invalid date format for ${field}: ${row[field]}. `;
                }
            }
        });

        row.privilegeId = row['privilege'] ? privilegeMap[row['privilege']] : null;
        
        if (row['status']) {
            row.status = statusMap[row['status']] || null;
            if (!row.status) errorMsg += `Status not found: ${row['status']}. `;
        } else {
            row.status = activeStatusId;
            if (!row.status) errorMsg += 'Default ACTIVE status not found in organization. ';
        }
        // Only map departmentId if department is present in row
        if (row['department']) {
            row.departmentId = departmentMap[row['department']] || null;
            if (!row.departmentId) errorMsg += `Department not found: ${row['department']}. `;
        }
        // Only map designationId if designation is present in row
        if (row['designation']) {
            row.designationId = designationMap[row['designation']] || null;
            if (!row.designationId) errorMsg += `Designation not found: ${row['designation']}. `;
        }
        row.roleId = row['role'] ? roleMap[row['role']] : null;
        // Only map teamId if team is present in row (should never happen due to skip above)
        if (row['team']) {
            row.teamId = teamMap[row['team']] || null;
            if (!row.teamId) errorMsg += `Team not found: ${row['team']}. `;
        }
        row.shiftId = row['shift'] ? shiftMap[row['shift']] : null;
        row.orgId = orgId ? new mongoose.Types.ObjectId(orgId) : null;

        for (const field of REQUIRED_FIELDS) {
            if (!row[field]) {
                errorMsg += `Missing required field: ${field}. `;
            }
        }

        if (row['gender'] && !VALID_GENDERS.includes(row['gender'])) {
            errorMsg += `Invalid gender: ${row['gender']}. `;
        }
        if (row['personalEmail'] && !/^[^\s@]+@[^-\s@]+\.[^\s@]+$/.test(row['personalEmail'])) {
            errorMsg += `Invalid personal email: ${row['personalEmail']}. `;
        }
        if (row['phone'] && (row['phone'].toString().length < 10 || row['phone'].toString().length > 15)) {
            errorMsg += `Invalid phone number: ${row['phone']}. `;
        }

        if (!row.orgId) errorMsg += 'Organization not found. ';
        if (!row.privilegeId) errorMsg += 'Privilege not found. ';
        if (!row.roleId) errorMsg += 'Role not found. ';

        if (errorMsg) {
            // Remove roleId, privilegeId, orgId from error data
            const { roleId, privilegeId, orgId, ...restRow } = row;
            errors.push({ row: rowIndex, error: errorMsg, data: restRow });
        } else {
            processed.push(row);
        }
    }

    return {
        processed,
        errors,
        totalRows: rawData.length
    };
};

module.exports = {
    processExcelFile
};