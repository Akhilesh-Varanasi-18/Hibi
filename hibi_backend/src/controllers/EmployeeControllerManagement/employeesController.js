const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema.js");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema.js");
const roleSchema = require("../../models/EmployeeSchemaManagement/rolesSchema.js");
const teamSchema = require("../../models/teamSchema.js");
const leaveTypeSchema = require("../../models/LeaveSchemaManagement/leaveTypesSchema.js");
const permissionTypeSchema = require("../../models/PermissionSchemaManagement/permissionTypesSchema.js");
const leaveConsiderationSchema = require("../../models/LeaveSchemaManagement/leaveConsidarationSchema.js");
const designationSchema = require("../../models/EmployeeSchemaManagement/designationSchema.js");
const departmentSchema = require("../../models/EmployeeSchemaManagement/departmentSchema.js");
const tripTypeSchema = require("../../models/TripSchemaManagement/tripTypeSchema.js");
const speakEasySchema = require('../../models/speakEasySchema.js');

const {
    getISTDateAndTime,
    changeGTMtoIST,
} = require("../../utils/timeFunction.js");
const { generatePassword, sendmail } = require("../../utils/mailSender.js");
const statusSchema = require("../../models/statusSchema.js");
const bcrypt = require("bcrypt");
const organizationSchema = require("../../models/organizationSchema.js");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const productManagerSchema = require("../../models/productManagerSchema.js");
const { uploadToS3, deleteFromS3 } = require("../../utils/s3Upload.js");
const shiftSchema = require("../../models/EmployeeSchemaManagement/shiftSchema.js");
const temporaryAssignmentSchema = require("../../models/LeaveSchemaManagement/temporaryAssignmentSchema.js");
const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema.js");
const attendenceStatusSchema = require("../../models/AttendenceSchemaManagement/attendenceStatusTypesSchema.js");
const logger = require('../../utils/logger.js');

const {
    productDefinedPrivileges,
    productDefinedRoles,
    productDefinedStatus,
    productDefinedLeaveTypes,
    productDefinedPermissionTypes,
    productDefinedAttendenceStatus,
    productDefinedLeaveConsiderations,
    productDefinedTripTypes
} = require("../../config/productDefined.js");

const createCEOThings = async (empId, orgId) => {
    try {
        // Prepare all creation promises
        const privilegePromises = productDefinedPrivileges.map(
            async (privilegeName) => {
                const exists = await privilegeSchema.findOne({
                    name: privilegeName,
                    orgId,
                });
                if (!exists) {
                    return privilegeSchema.create({
                        name: privilegeName,
                        description: "",
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        const rolePromises = productDefinedRoles.map(async (roleName) => {
            const exists = await roleSchema.findOne({ name: roleName, orgId });
            if (!exists) {
                return roleSchema.create({
                    name: roleName,
                    description: "",
                    createdBy: empId,
                    updatedBy: empId,
                    orgId,
                });
            }
        });

        const statusPromises = productDefinedStatus.map(async (statusName) => {
            const exists = await statusSchema.findOne({ statusType: statusName, orgId });
            if (!exists) {
                return statusSchema.create({
                    statusType: statusName,
                    createdBy: empId,
                    updatedBy: empId,
                    orgId,
                });
            }
        });

        const leaveTypePromises = productDefinedLeaveTypes.map(
            async (leaveTypeName) => {
                const exists = await leaveTypeSchema.findOne({
                    leaveType: leaveTypeName,
                    orgId,
                });
                if (!exists) {
                    return leaveTypeSchema.create({
                        leaveType: leaveTypeName,
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        const permissionTypePromises = productDefinedPermissionTypes.map(
            async (permissionTypeName) => {
                const exists = await permissionTypeSchema.findOne({
                    permissionType: permissionTypeName,
                    orgId,
                });
                if (!exists) {
                    return permissionTypeSchema.create({
                        permissionType: permissionTypeName,
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        const attendenceStatusPromises = Object.entries(productDefinedAttendenceStatus).map(
            async ([statusName, statusCode]) => {
                const exists = await attendenceStatusSchema.findOne({ statusCode, orgId });
                if (!exists) {
                    return attendenceStatusSchema.create({
                        name: statusName,
                        statusCode,
                        shortName: statusCode,
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        const leaveConsiderationPromises = Object.entries(productDefinedLeaveConsiderations).map(
            async ([considerType, considerTypeCode]) => {
                const exists = await leaveConsiderationSchema.findOne({ considerTypeCode, orgId });
                if (!exists) {
                    return leaveConsiderationSchema.create({
                        considerType,
                        considerTypeCode,
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        const tripTypePromises = productDefinedTripTypes.map(
            async (tripTypeName) => {
                const exists = await tripTypeSchema.findOne({
                    name: tripTypeName,
                    orgId,
                });
                if (!exists) {
                    return tripTypeSchema.create({
                        tripType: tripTypeName,
                        createdBy: empId,
                        updatedBy: empId,
                        orgId,
                    });
                }
            }
        );

        // Run all in parallel
        await Promise.all([
            Promise.all(privilegePromises),
            Promise.all(rolePromises),
            Promise.all(statusPromises),
            Promise.all(leaveTypePromises),
            Promise.all(permissionTypePromises),
            Promise.all(attendenceStatusPromises),
            Promise.all(leaveConsiderationPromises),
            Promise.all(tripTypePromises)
        ]);
    } catch (error) {
        console.error("Error creating CEO privilege or role:", error);
    }
};

const createEmployee = async (req, res) => {
    try {
        // Destructure and validate required fields from req.body
        const {
            privilegeId,
            employeeCode,
            firstName,
            lastName,
            personalEmail,
            dateOfBirth,
            gender,
            dateOfJoining,
            roleId,
            phone,
            // Optional fields
            officeMail,
            profileImage,
            accessTokenExpires,
            microsoftId,
            refreshToken,
            departmentId,
            designationId,
            teamId,
            shiftId,
            salaryPerMonth,
            optOutOccasions,
        } = req.body;

        const orgId = req?.user?.orgId ? req.user.orgId : req.body.orgId;

        // Validate required fields
        if (
            !orgId ||
            !privilegeId ||
            !employeeCode ||
            !firstName ||
            !personalEmail ||
            !dateOfBirth ||
            !gender ||
            !dateOfJoining ||
            !roleId ||
            !phone
            // || !shiftId
        ) {
            return res
                .status(400)
                .json({ message: "All required fields must be provided" });
        }

        const [orgHeadId, orgCeoId] = await Promise.all([
            roleSchema.findOne({ name: "ORGANIZATIONHEAD", orgId }, { _id: 1 }),
            roleSchema.findOne({ name: "CEO", orgId }, { _id: 1 }),
        ]);

        if (!orgHeadId) {
            return res.status(400).json({
                message: "Organization Head role not found, please create it first",
            });
        }

        if (
            orgHeadId?._id.toString() !== roleId &&
            !shiftId &&
            orgCeoId &&
            orgCeoId._id.toString() !== roleId &&
            !shiftId
        ) {
            return res.status(400).json({
                message:
                    "Shift is required for non organization head or non CEO employees",
            });
        }

        // if( orgCeoId && orgCeoId._id.toString() !== roleId && !shiftId){
        //   return res.status(400).json({ message: "Shift is required for non CEO employees" });
        // }

        const employeeCodeExists = await employeeSchema.findOne({ employeeCode });
        if (employeeCodeExists) {
            return res.status(409).json({ message: "Employee code already exists" });
        }

        // Check for duplicate employeeCode or personalEmail
        const isExist = await employeeSchema.find({
            orgId,
            $or: [{ employeeCode }, { officeMail }, { personalEmail }],
        });
        if (isExist.length > 0) {
            return res
                .status(409)
                .json({ message: "Employee with same code or email already exists" });
        }

        const organizationHeadId = await roleSchema.findOne(
            { name: "ORGANIZATIONHEAD", orgId: new ObjectId(orgId) },
            { _id: 1 }
        );

        if (organizationHeadId?._id.toString() === roleId) {
            const organizationHeadExist = await employeeSchema.findOne({
                orgId,
                roleId: organizationHeadId._id,
            });
            if (organizationHeadExist) {
                return res.status(409).json({
                    message: "Organization Head already exists for this organization",
                });
            }
        }

        const ceoRoleId = await roleSchema.findOne(
            { name: "CEO", orgId: new ObjectId(orgId) },
            { _id: 1 }
        );
        if (ceoRoleId?._id.toString() === roleId) {
            const ceoExist = await employeeSchema.findOne({
                orgId,
                roleId: ceoRoleId._id,
            });
            if (ceoExist) {
                return res
                    .status(409)
                    .json({ message: "CEO already exists for this organization" });
            }
        }

        // Prepare new employee data
        const employeeId = req?.user?._id;

        let profileImageUrl = null;
        let s3Key = null;
        if (req.file && req.file.buffer) {
            console.log("[createEmployee] Profile image file received:", {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });
            try {
                const uploadResult = await uploadToS3(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    "profile-images"
                );
                console.log("[createEmployee] S3 upload result:", uploadResult);
                profileImageUrl = uploadResult.fileUrl;
                s3Key = uploadResult.s3Key;
            } catch (err) {
                console.error("[createEmployee] S3 upload error:", err);
                return res.status(500).json({ message: "Profile image upload failed", error: err.message });
            }
        } else {
            console.log("[createEmployee] No profile image file in request.");
        }

        const newEmployee = new employeeSchema({
            orgId,
            privilegeId,
            employeeCode,
            firstName,
            lastName,
            personalEmail,
            officeMail: officeMail ? officeMail : "",
            profileImage: profileImageUrl ? profileImageUrl : "",
            accessTokenExpires,
            microsoftId,
            refreshToken,
            phone,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            dateOfJoining: new Date(dateOfJoining),
            departmentId,
            designationId,
            roleId,
            teamId,
            shiftId,
            salaryPerMonth,
            optOutOccasions,
            createdBy: employeeId,
            updatedBy: employeeId,
            status: await statusSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
        });

        // Generate and hash password
        const password =
            process.env.NODE_ENV !== "staging" ? generatePassword() : "hrms@123";

        // for now giving default password
        // const password = "torii@123";
        newEmployee.password = await bcrypt.hash(password, 12);

        let savedEmployee = null;
        try {
            savedEmployee = await newEmployee.save();
        } catch (dbError) {
            // If image was uploaded, delete it from MinIO
            if (s3Key) {
                await deleteFromS3(s3Key);
            }
            return res
                .status(500)
                .json({ message: "Failed to save employee", error: dbError.message });
        }

        // Only send email after successful save
        if (process.env.NODE_ENV !== "staging") {
            const organization = await organizationSchema.findOne({ _id: orgId });
            const recipientEmail = officeMail || personalEmail;
            if (recipientEmail) {
                sendmail(
                    "Temporary Password",
                    "ONBOARDING",
                    `${firstName} ${lastName}`,
                    recipientEmail,
                    password,
                    organization.organizationEmail,
                    organization.organizationAppPassword,
                    employeeCode
                ).catch(err => console.error("Failed to send onboarding email:", err));
            } else {
                console.warn(`No email address found for employee ${employeeCode}, skipping onboarding email`);
            }
        }

        // If ULTIMATEADMIN, update orgHeadId and create CEO things
        const ultimateAdmin = await privilegeSchema.findOne({
            name: "ULTIMATEADMIN",
            orgId: savedEmployee.orgId,
        });
        if (
            ultimateAdmin &&
            savedEmployee.privilegeId.toString() === ultimateAdmin._id.toString()
        ) {
            const org = await organizationSchema.findById(savedEmployee.orgId);
            org.orgHeadId = savedEmployee._id;
            await org.save();
            await createCEOThings(savedEmployee._id, org._id);
        }

        // If CEO, update organization details
        const ceoRoleToUpdateOrg = await roleSchema.findOne(
            { name: "CEO", orgId: savedEmployee.orgId },
            { _id: 1 }
        );
        if (
            ceoRoleToUpdateOrg &&
            savedEmployee.roleId.toString() === ceoRoleToUpdateOrg._id.toString()
        ) {
            const org = await organizationSchema.findById(savedEmployee.orgId);
            org.orgCeoId = savedEmployee._id;
            await org.save();
        }

        logger.info(`Employee '${firstName} ${lastName}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: "Employee created successfully" });
    } catch (error) {
        console.error("Error creating employee:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Function to get the organization head "ULTIMATEADMIN"
const getOrganizationHead = async (req, res) => {
    try {
        const { orgId } = req.body;

        const data = await organizationSchema.aggregate([
            {
                $match: {
                    _id: new ObjectId(orgId),
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "orgHeadId",
                    foreignField: "_id",
                    as: "OrgHead",
                },
            },
            { $unwind: "$OrgHead" },
            {
                $lookup: {
                    from: "roles",
                    localField: "OrgHead.roleId",
                    foreignField: "_id",
                    as: "RoleInfo",
                },
            },
            { $unwind: "$RoleInfo" },
            {
                $lookup: {
                    from: "privileges",
                    localField: "OrgHead.privilegeId",
                    foreignField: "_id",
                    as: "privilegeInfo",
                },
            },
            { $unwind: "$privilegeInfo" },
            {
                $project: {
                    firstName: "$OrgHead.firstName",
                    lastName: "$OrgHead.lastName",
                    officeMail: "$OrgHead.officeMail",
                    personalEmail: "$OrgHead.personalEmail",
                    phone: "$OrgHead.phone",
                    employeeCode: "$OrgHead.employeeCode",
                    privilegeId: "$OrgHead.privilegeId",
                    privilegeName: "$privilegeInfo.name",
                    roleId: "$OrgHead.roleId",
                    roleName: "$RoleInfo.name",
                },
            },
        ]);

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No organization head found" });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching employee ultimate admin:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// get all team leads
const getAllTeamLeads = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        if (!orgId) {
            return res.status(400).send("Organization ID is required");
        }
        const teamLeadRoleId = await roleSchema.findOne(
            { name: "TEAMLEAD" },
            { _id: 1 }
        );

        const teamLeads = await employeeSchema.aggregate([
            {
                $match: {
                    orgId: new ObjectId(orgId),
                    roleId: new ObjectId(teamLeadRoleId._id),
                },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    employeeCode: 1,
                },
            },
        ]);

        return res
            .status(200)
            .json({ message: "Team leads fetched successfully", teamLeads });
    } catch (error) {
        console.error("Error fetching team leads:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Get all managers
const getAllManagers = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        if (!orgId) {
            return res.status(400).send("Organization ID is required");
        }
        const managerRoleId = await roleSchema.findOne(
            { name: "MANAGER", orgId: new ObjectId(orgId) },
            { _id: 1 }
        );

        const managers = await employeeSchema.aggregate([
            {
                $match: {
                    orgId: new ObjectId(orgId),
                    roleId: new ObjectId(managerRoleId._id),
                },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    employeeCode: 1,
                },
            },
        ]);

        return res
            .status(200)
            .json({ message: "Managers fetched successfully", managers });
    } catch (error) {
        console.error("Error fetching managers:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Function to get the employee data

const getEmployeeData = async (req, res) => {
    try {
        let employeeId = req?.user?._id;
        if (req.query.employeeId) {
            employeeId = req.query.employeeId;
        }

        if (req.userType === "PRODUCTMANAGER") {
            const productManager = await productManagerSchema.findById(employeeId);
            return res.status(200).json({
                message: "Product Manager data fetched successfully",
                productManager: {
                    _id: productManager._id,
                    userName: productManager.userName,
                },
            });
        }

        let employeeData = await employeeSchema
            .findById(employeeId, {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                createdBy: 0,
                updatedBy: 0,
                password: 0,
                lastLoginAt: 0,
                isLoggedIn: 0,
                dateOfLeaving: 0,
            })
            .populate({
                path: "privilegeId",
                select: "name",
                model: privilegeSchema,
            })
            .populate({
                path: "roleId",
                select: "name",
                model: roleSchema,
            })
            .populate({
                path: "orgId",
                select: "name",
                model: organizationSchema,
            })
            .populate({
                path: "status",
                select: "statusType",
                model: statusSchema,
            })
            .populate({
                path: "shiftId",
                select: "name startTime endTime",
                model: shiftSchema,
            })
            .populate({
                path: "teamId",
                select: "teamName teamLeadIds managerIds",
                model: teamSchema,
                populate: [
                    { path: "teamLeadIds", select: "firstName lastName employeeCode officeMail", model: employeeSchema },
                    { path: "managerIds", select: "firstName lastName employeeCode officeMail", model: employeeSchema },
                ]
            })
            .populate({
                path: "departmentId",
                select: "departmentName",
                model: departmentSchema,
            })
            .populate({
                path: "designationId",
                select: "title roles responsibilities",
                model: designationSchema
            }).
            populate({
                path: "orgId",
                select: "colorPalette",
                model: organizationSchema
            })
            .lean();

        if (!employeeData) {
            return res.status(404).send("Employee not found");
        }

        // If isRequired2FA is true, fetch 2FA details from speakeasies
        if (employeeData.isRequired2FA) {
            const twofaInfo = await speakEasySchema.findOne({ userId: employeeData._id }).lean();
            employeeData.twofaInfo = (twofaInfo && twofaInfo?.enabled === true) ? true : false || null;
        }
        else {
            employeeData.twofaInfo = false;
        }
        // Remove isRequired2FA from response if you don't want to send it
        delete employeeData.isRequired2FA;

        return res.status(200).json(employeeData);
    } catch (error) {
        console.error("Error fetching employee data:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Function to get the GENERAL privilege employees
const getGeneralEmployees = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        if (!orgId) {
            return res.status(400).send("Organization ID is required");
        }
        // Find the GENERAL privilege for this org only
        const generalPrivilege = await privilegeSchema.findOne(
            { name: "GENERAL", orgId: new ObjectId(orgId) },
            { _id: 1 }
        );
        if (!generalPrivilege) {
            return res
                .status(404)
                .json({ message: "GENERAL privilege not found for this organization" });
        }

        // Find employees with this privilege in the same org
        const generalEmployees = await employeeSchema.aggregate([
            {
                $match: {
                    orgId: new ObjectId(orgId),
                    privilegeId: new ObjectId(generalPrivilege._id),
                },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    employeeCode: 1,
                },
            },
        ]);

        return res.status(200).json({
            message: "General employees fetched successfully",
            generalEmployees,
        });
    } catch (error) {
        console.error("Error fetching general employees:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Function to get all employees with privilege and role
const getAllEmployeesWithPrivilegeAndRole = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        if (!orgId) {
            return res.status(400).send("Organization ID is required");
        }

        const employees = await employeeSchema.aggregate([
            {
                $match: { orgId: new ObjectId(orgId) },
            },
            {
                $lookup: {
                    from: "privileges",
                    localField: "privilegeId",
                    foreignField: "_id",
                    as: "privilegeInfo",
                },
            },
            {
                $unwind: "$privilegeInfo",
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleInfo",
                },
            },
            {
                $unwind: "$roleInfo",
            },
            {
                $sort: { createdAt: 1 },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    employeeCode: 1,
                    privilegeName: "$privilegeInfo.name",
                    roleName: "$roleInfo.name",
                },
            },
        ]);

        return res
            .status(200)
            .json({ message: "Employees fetched successfully", employees });
    } catch (error) {
        console.error("Error fetching employees with privilege and role:", error);
        return res.status(500).send("Internal Server Error");
    }
};

// Get notification data for an employee
// const getNotifyToData = async (req, res) => {
//   try {
//     const employeeId = req.user._id;
//     const teamLeads = await employeeSchema.aggregate([
//       {
//         $match: {
//           _id: new ObjectId(employeeId),
//         },
//       },
//       {
//         $lookup: {
//           from: "employees",
//           localField: "teams.teamLeadId",
//           foreignField: "_id",
//           as: "teamLeads",
//         },
//       },
//       {
//         $unwind: "$teamLeads",
//       },
//       {
//         $project: {
//           _id: 0,
//           teamLeadName: {
//             $concat: ["$teamLeads.firstName", " ", "$teamLeads.lastName"],
//           },
//           teamLeadCode: "$teamLeads.employeeCode",
//           teamLeadId: "$teamLeads._id",
//         },
//       },
//     ]);

//     return res.status(200).json({
//       message: "Higher authorities fetched successfully",
//       teamLeads,
//     });
//   } catch (error) {
//     console.error("Error fetching higher authorities:", error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

// Function to notify employees based on role
const notifyToEmployee = async (roleId) => {
    try {
        const notifyToEmployee = await employeeSchema.aggregate([
            {
                $match: {
                    roleId: new ObjectId(roleId),
                },
            },
            {
                $project: {
                    _id: 0,
                    notifyToName: { $concat: ["$firstName", " ", "$lastName"] },
                    notifyToCode: "$employeeCode",
                    notifyToId: "$_id",
                },
            },
        ]);
        return {
            success: true,
            data: notifyToEmployee,
        };
    } catch (error) {
        console.error("Error fetching notify data:", error);
        return {
            success: false,
            message: "Internal Server Error",
        };
    }
};

// Check if employee is on leave
const checkForIsInLeave = async (employeeId) => {
    // console.log("Checking leave status for employee:", employeeId);
    // console.log("Current IST Date and Time:", getISTDateAndTime());
    try {
        const leaveData = await leaveRequestSchema.aggregate([
            {
                $match: {
                    employeeId: new ObjectId(employeeId),
                    endDate: {
                        $gte: getISTDateAndTime(),
                    },
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "temporaryAssignmentId",
                    foreignField: "_id",
                    as: "temporaryAssignmentInfo",
                },
            },
            { $unwind: "$temporaryAssignmentInfo" },
            {
                $project: {
                    _id: 1,
                    notifyToId: "$temporaryAssignmentInfo._id",
                    notifyToName: {
                        $concat: [
                            "$temporaryAssignmentInfo.firstName",
                            " ",
                            "$temporaryAssignmentInfo.lastName",
                        ],
                    },
                    notifyToCode: "$temporaryAssignmentInfo.employeeCode",
                },
            },
        ]);
        if (leaveData && leaveData.length > 0) {
            // console.log("Leave data found:", leaveData[0]);
            return {
                success: true,
                data: leaveData[0],
            };
        }
        // console.log("No leave data founsd for employee:", employeeId);
        return {
            success: false,
            message: "No leave found",
        };
    } catch (error) {
        console.error("Error checking leave status:", error);
        return {
            success: false,
            message: "Internal Server Error",
        };
    }
};

// Get notification data for an employee
const getNotifyToData = async (req, res) => {
    try {
        const { _id: employeeId, orgId, teamId, employeeCode, roleId } = req.user;

        // Fetch HR and CEO role IDs in parallel
        const [HRRole, CEORole] = await Promise.all([
            roleSchema.findOne({ name: "HR", orgId }),
            roleSchema.findOne({ name: "CEO", orgId }),
        ]);
        if (!HRRole || !CEORole) {
            return res.status(404).json({ message: "HR or CEO role not found" });
        }

        let isInLeave;

        if (teamId) {
            const teamData = await teamSchema.aggregate([
                {
                    $match: {
                        _id: new ObjectId(teamId),
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "teamLeadId",
                        foreignField: "_id",
                        as: "teamLeadInfo",
                    },
                },
                {
                    $unwind: "$teamLeadInfo",
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "managerId",
                        foreignField: "_id",
                        as: "managerInfo",
                    },
                },
                {
                    $unwind: "$managerInfo",
                },
                {
                    $project: {
                        _id: 0,
                        teamLeadId: "$teamLeadInfo._id",
                        teamLeadName: {
                            $concat: [
                                "$teamLeadInfo.firstName",
                                " ",
                                "$teamLeadInfo.lastName",
                            ],
                        },
                        teamLeadCode: "$teamLeadInfo.employeeCode",
                        managerId: "$managerInfo._id",
                        managerName: {
                            $concat: ["$managerInfo.firstName", " ", "$managerInfo.lastName"],
                        },
                        managerCode: "$managerInfo.employeeCode",
                    },
                },
            ]);

            if (!teamData || !teamData[0]) {
                return res.status(404).json({ message: "Team not found" });
            }

            const team = teamData[0];

            if (employeeCode === team.teamLeadCode) {
                isInLeave = await checkForIsInLeave(team.managerId);
                if (isInLeave.success) {
                    if (
                        isInLeave.data.notifyToId.toString() === req.user._id.toString()
                    ) {
                        return res.status(200).json({
                            message:
                                "Your NotifyTo Person is in Leave, You dont have any one to Notify now please contact your Higher Authority",
                        });
                    }

                    return res.status(200).json({
                        message:
                            "Your Actual NotifyTo Person is in Leave so consider replacing them.",
                        data: [isInLeave.data],
                    });
                }
                return res.status(200).json({
                    message: "Notify data fetched successfully",
                    data: [
                        {
                            notifyToId: team.managerId,
                            notifyToName: team.managerName,
                            notifyToCode: team.managerCode,
                        },
                    ],
                });
            }

            if (employeeCode === team.managerCode) {
                const data = await notifyToEmployee(HRRole._id);
                isInLeave = await checkForIsInLeave(data?.data[0]?.notifyToId);
                if (isInLeave.success) {
                    if (
                        isInLeave.data.notifyToId.toString() === req.user._id.toString()
                    ) {
                        return res.status(200).json({
                            message:
                                "Your NotifyTo Person is in Leave, You dont have any one to Notify now please contact your Higher Authority",
                        });
                    }

                    return res.status(200).json({
                        message:
                            "Your Actual NotifyTo Person is in Leave so consider replacing them.",
                        data: [isInLeave.data],
                    });
                }

                return res.status(data.success ? 200 : 404).json({
                    message: data.success
                        ? "Notify data fetched successfully"
                        : "No data found for the specified role",
                    data: data.data || [],
                });
            }

            isInLeave = await checkForIsInLeave(team.teamLeadId);
            if (isInLeave.success) {
                if (isInLeave.data.notifyToId.toString() === req.user._id.toString()) {
                    return res.status(200).json({
                        message:
                            "Your NotifyTo Person is in Leave, You dont have any one to Notify now please contact your Higher Authority",
                    });
                }
                return res.status(200).json({
                    message:
                        "Your Actual NotifyTo Person is in Leave so consider replacing them.",
                    data: [isInLeave.data],
                });
            }

            return res.status(200).json({
                message: "Notify data fetched successfully",
                data: [
                    {
                        notifyToId: team.teamLeadId,
                        notifyToName: team.teamLeadName,
                        notifyToCode: team.teamLeadCode,
                    },
                ],
            });
        }

        if (new ObjectId(roleId).equals(HRRole._id)) {
            const data = await notifyToEmployee(CEORole._id);
            isInLeave = await checkForIsInLeave(data?.data[0]?.notifyToId);
            if (isInLeave.success) {
                if (isInLeave.data.notifyToId.toString() === req.user._id.toString()) {
                    return res.status(200).json({
                        message:
                            "Your NotifyTo Person is in Leave, You dont have any one to Notify now please contact your Higher Authority",
                    });
                }

                return res.status(200).json({
                    message:
                        "Your Actual NotifyTo Person is in Leave so consider replacing them.",
                    data: [isInLeave.data],
                });
            }

            return res.status(data.success ? 200 : 500).json({
                message: data.success
                    ? "HR specific data fetched successfully"
                    : "Error While Getting the CEO Data for notifyTo",
                data: data.data || [],
                error: data.success ? undefined : data.message,
            });
        }

        const data = await notifyToEmployee(HRRole._id);
        isInLeave = await checkForIsInLeave(data?.data[0]?.notifyToId);
        if (isInLeave.success) {
            if (isInLeave.data.notifyToId.toString() === req.user._id.toString()) {
                return res.status(200).json({
                    message:
                        "Your NotifyTo Person is in Leave, You dont have any one to Notify now please contact your Higher Authority",
                });
            }

            return res.status(200).json({
                message:
                    "Your Actual NotifyTo Person is in Leave so consider replacing them.",
                data: [isInLeave.data],
            });
        }

        return res.status(data.success ? 200 : 500).json({
            message: data.success
                ? "HR specific data fetched successfully"
                : "Error While Getting the HR Data for notifyTo",
            data: data.data || [],
            error: data.success ? undefined : data.message,
        });
    } catch (err) {
        console.error("Error fetching notification data:", err);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: err.message });
    }
};

// Add temporary privilege to an employee
const addTempPrivilege = async (req, res) => {
    try {
        const start = new Date();
        const { tempPrivilegeId, assigningEmployeeId, startDate, endDate } =
            req.body;
        const employeeId = req.user._id;

        // Validate input
        if (!assigningEmployeeId) {
            return res
                .status(400)
                .json({ message: "Assigning Employee ID is required" });
        }
        if (!tempPrivilegeId) {
            return res
                .status(400)
                .json({ message: "Temporary Privilege ID is required" });
        }
        if (!startDate || !endDate) {
            return res
                .status(400)
                .json({ message: "Start date and end date are required" });
        }

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "Invalid date range" });
        }

        // Fetch employee and temporary privilege details
        const [assigningEmployee, tempPrivilege] = await Promise.all([
            employeeSchema.findById(assigningEmployeeId),
            privilegeSchema.findById(tempPrivilegeId),
        ]);

        // Check if employee and temporary privilege exist
        if (!assigningEmployee) {
            return res.status(404).json({ message: "Assigning Employee not found" });
        }
        if (!tempPrivilege) {
            return res.status(404).json({ message: "Temporary Privilege not found" });
        }
        if (assigningEmployee.tempPrivilegeId) {
            return res.status(400).json({
                message: "Temporary Privilege is already assigned to this Employee",
            });
        }

        assigningEmployee.tempPrivilegeId = tempPrivilegeId;
        assigningEmployee.tempPrivilegeStartDate = new Date(startDate);
        assigningEmployee.tempPrivilegeEndDate = new Date(endDate);
        assigningEmployee.updatedBy = employeeId;
        assigningEmployee.updatedAt = new Date();
        await assigningEmployee.save();

        logger.info(`Temporary privilege '${tempPrivilege.name}' assigned to employee '${assigningEmployee.firstName} ${assigningEmployee.lastName}' by user ${req.user.firstName} ${req.user.lastName}`);
        console.log(
            "Time taken for adding temporary privilege:",
            new Date() - start + "ms"
        );

        return res
            .status(200)
            .json({ message: "Temporary privilege added successfully" });
    } catch (error) {
        console.error("Error adding temporary privilege:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Remove temporary privilege from an employee
const removeTempPrivilege = async (req, res) => {
    try {
        const { assigningEmployeeId } = req.body;

        const employeeId = req.user._id;

        // Validate input
        if (!assigningEmployeeId) {
            return res
                .status(400)
                .json({ message: "Assigning Employee ID is required" });
        }

        // Find the employee and remove their tempPrivilegeId
        const assigningEmployee = await employeeSchema.findById(
            assigningEmployeeId
        );
        if (!assigningEmployee) {
            return res.status(404).json({ message: "Assigning Employee not found" });
        }

        if (!assigningEmployee.tempPrivilegeId) {
            return res
                .status(400)
                .json({ message: "No temporary privilege assigned" });
        }

        assigningEmployee.tempPrivilegeId = null;
        assigningEmployee.tempPrivilegeStartDate = null;
        assigningEmployee.tempPrivilegeEndDate = null;
        assigningEmployee.updatedBy = employeeId;
        assigningEmployee.updatedAt = new Date();
        await assigningEmployee.save();

        logger.info(`Temporary privilege removed from employee '${assigningEmployee.firstName} ${assigningEmployee.lastName}' by user ${req.user.firstName} ${req.user.lastName}`);
        return res
            .status(200)
            .json({ message: "Temporary privilege removed successfully" });
    } catch (error) {
        console.error("Error removing temporary privilege:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getTemporaryPrivilegeEmployees = async (req, res) => {
    console.log("Fetching temporary privilege employees...");
    try {
        const tempPrivilegeEmployees = await privilegeSchema.aggregate([
            {
                $match: {
                    tempPrivilegeId: {
                        $ne: null,
                    },
                },
            },
            {
                $lookup: {
                    from: "privileges",
                    localField: "tempPrivilegeId",
                    foreignField: "_id",
                    as: "tempPrivilege",
                },
            },
            {
                $unwind: "$tempPrivilege",
            },
            {
                $project: {
                    employeeCode: 1,
                    firstName: 1,
                    lastName: 1,
                    tempPrivilege: "$tempPrivilege.name",
                    tempPrivilegeStartDate: 1,
                    tempPrivilegeEndDate: 1,
                },
            },
        ]);

        return res.status(200).json({
            message: "Temporary privileges fetched successfully",
            data: tempPrivilegeEmployees,
        });
    } catch (error) {
        console.error("Error fetching temporary privileges:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update employee details
const updateEmployee = async (req, res) => {
    try {
        // --- Privilege-based update logic for employee profile ---
        // Privilege hierarchy: ultimateadmin > superadmin > admin > general
        // ultimateadmin can edit superadmin only (not others)
        // superadmin can edit admin and general
        // admin can edit general
        // general can edit only their own basic details
        // admin and general can edit their own basic details
        // superadmin can edit all their own details
        // Everyone can edit their own profile image, and can edit profile image of subordinates as per above hierarchy

        // Helper to handle profile image upload and delete old image if present
        async function handleProfileImageUpload(employee) {
            if (req.file && req.file.buffer) {
                console.log("[updateEmployee] Profile image file received:", {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                });
                // Delete old image if exists
                if (employee.profileImage) {
                    try {
                        // Extract S3 key from URL (assuming format: .../profile-images/<key>)
                        const urlParts = employee.profileImage.split("/");
                        const keyIndex = urlParts.findIndex(part => part === "profile-images");
                        let s3Key = null;
                        if (keyIndex !== -1 && urlParts.length > keyIndex + 1) {
                            s3Key = urlParts.slice(keyIndex).join("/");
                        }
                        if (s3Key) {
                            console.log("[updateEmployee] Deleting old profile image from S3:", s3Key);
                            await deleteFromS3(s3Key);
                        }
                    } catch (delErr) {
                        console.warn("[updateEmployee] Failed to delete old profile image:", delErr.message);
                    }
                }
                try {
                    console.log("[updateEmployee] Uploading new profile image to S3...");
                    const uploadResult = await uploadToS3(
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        "profile-images"
                    );
                    console.log("[updateEmployee] S3 upload successful:", uploadResult);
                    return uploadResult.fileUrl;
                } catch (err) {
                    console.error("[updateEmployee] S3 upload error:", err);
                    throw err;
                }
            }
            return undefined;
        }

        // Helper to sanitize fields: convert empty string IDs to null
        function sanitizeField(value) {
            if (typeof value === "string" && value.trim() === "") return null;
            return value;
        }

        const updaterId = req.user._id;
        const orgId = req.user.orgId;
        const updater = await employeeSchema.findById(updaterId).populate("privilegeId");
        const updaterPrivilege = updater?.privilegeId?.name;

        // Determine which employee to update
        let employeeId = updaterId;
        if (req.body.employeeId && updaterId.toString() !== req.body.employeeId) {
            employeeId = req.body.employeeId;
        }
        const employee = await employeeSchema.findOne({ _id: employeeId, orgId }).populate("privilegeId");
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const employeePrivilege = employee?.privilegeId?.name;
        const isSelfUpdate = updaterId.toString() === employeeId.toString();

        // --- Privilege hierarchy map for update permissions ---

        // Use capital case privilege names as per productDefinedPrivileges
        const privilegeOrder = ["ULTIMATEADMIN", "SUPERADMIN", "ADMIN", "GENERAL"];
        const canEdit = (updaterPriv, targetPriv) => {
            if (updaterPriv === "ULTIMATEADMIN" && targetPriv === "SUPERADMIN") return true;
            if (updaterPriv === "SUPERADMIN" && ["ADMIN", "GENERAL", "SUPERADMIN"].includes(targetPriv)) return true;
            if (updaterPriv === "ADMIN" && (targetPriv === "GENERAL" || targetPriv === "ADMIN")) return true;
            return false;
        };

        // --- Allowed fields for self-update by GENERAL/ADMIN ---
        const selfAllowedFields = ["firstName", "lastName", "personalEmail", "dateOfBirth", "phone", "pfNumber", "esicNumber", "linkedInProfile"];
        // --- Allowed fields for ADMIN editing GENERAL ---
        const adminEditGeneralFields = [
            "roleId", "privilegeId", "designationId", "departmentId", "shiftId", "officeMail", "firstName", "lastName", "profileImage", "salaryPerMonth", "status", "pfNumber", "esicNumber", "linkedInProfile"
        ];
        // --- Allowed fields for SUPERADMIN editing ADMIN/GENERAL ---
        const superadminEditFields = [
            "roleId", "privilegeId", "designationId", "departmentId", "shiftId", "officeMail", "firstName", "lastName", "profileImage", "salaryPerMonth", "status", "pfNumber", "esicNumber", "linkedInProfile"
        ];
        // --- Allowed fields for ULTIMATEADMIN editing SUPERADMIN ---
        const ultimateadminEditFields = [
            "roleId", "privilegeId", "designationId", "departmentId", "shiftId", "officeMail", "firstName", "lastName", "profileImage", "salaryPerMonth", "status", "pfNumber", "esicNumber", "linkedInProfile"
        ];

        // --- Self-update logic ---
        if (isSelfUpdate) {
            // GENERAL and ADMIN can edit only basic fields; SUPERADMIN and ULTIMATEADMIN can edit all their own fields
            if (updaterPrivilege === "SUPERADMIN") {
                // SUPERADMIN can edit all their own fields
                Object.keys(req.body).forEach((field) => {
                    if (field !== "_id") {
                        employee[field] = sanitizeField(req.body[field]);
                    }
                });
            } else if (["ADMIN", "GENERAL"].includes(updaterPrivilege)) {
                // ADMIN/GENERAL can edit only allowed fields
                let updated = false;
                let forbiddenFields = [];
                Object.keys(req.body).forEach((field) => {
                    if (selfAllowedFields.includes(field)) {
                        employee[field] = sanitizeField(req.body[field]);
                        updated = true;
                    } else {
                        forbiddenFields.push(field);
                    }
                });
                if (forbiddenFields.length > 0) {
                    return res.status(403).json({
                        message: `You are not allowed to update: ${forbiddenFields.join(", ")}`,
                    });
                }
                if (!updated) {
                    return res.status(400).json({ message: "No valid fields to update." });
                }
            } else if (updaterPrivilege === "ULTIMATEADMIN") {
                // ULTIMATEADMIN can edit all their own fields
                Object.keys(req.body).forEach((field) => {
                    if (field !== "_id") {
                        employee[field] = sanitizeField(req.body[field]);
                    }
                });
            }
            // Everyone can update their own profile image
            if (req.file && req.file.buffer) {
                try {
                    const imageUrl = await handleProfileImageUpload(employee);
                    if (imageUrl) employee.profileImage = imageUrl;
                } catch (err) {
                    return res.status(500).json({ message: "Profile image upload failed", error: err.message });
                }
            }
            employee.updatedBy = updaterId;
            employee.updatedAt = getISTDateAndTime();
            await employee.save();
            return res.status(200).json({ message: "Profile updated successfully" });
        }

        // --- Privilege-based update of subordinates ---
        if (canEdit(updaterPrivilege, employeePrivilege)) {
            // ULTIMATEADMIN editing SUPERADMIN, SUPERADMIN editing ADMIN/GENERAL, ADMIN editing GENERAL
            let allowedFields = [];
            if (updaterPrivilege === "ULTIMATEADMIN" && employeePrivilege === "SUPERADMIN") {
                allowedFields = ultimateadminEditFields;
            } else if (updaterPrivilege === "SUPERADMIN" && ["ADMIN", "GENERAL", "SUPERADMIN"].includes(employeePrivilege)) {
                allowedFields = superadminEditFields;
            } else if (updaterPrivilege === "ADMIN" && (employeePrivilege === "GENERAL" || employeePrivilege === "ADMIN")) {
                allowedFields = adminEditGeneralFields;
            }
            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined && field !== "_id") {
                    employee[field] = sanitizeField(req.body[field]);
                }
            });
            // Profile image update for subordinates
            if (req.file && req.file.buffer) {
                try {
                    const imageUrl = await handleProfileImageUpload(employee);
                    if (imageUrl) employee.profileImage = imageUrl;
                } catch (err) {
                    return res.status(500).json({ message: "Profile image upload failed", error: err.message });
                }
            }
            employee.updatedBy = updaterId;
            employee.updatedAt = getISTDateAndTime();
            await employee.save();
            logger.info(`Employee '${employee.firstName} ${employee.lastName}' updated by user ${updater.firstName} ${updater.lastName}`);
            return res.status(200).json({ message: "Employee updated successfully" });
        }

        // --- Not allowed: insufficient privilege or invalid target ---
        return res.status(403).json({ message: "You do not have permission to update this employee." });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getShiftDetails = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const shiftId = req?.user?.shiftId;

        // Find the employee's shift details
        const shiftData = await shiftSchema.find(
            { _id: shiftId },
            { name: 1, startTime: 1, endTime: 1, breakTimeEnd: 1, breakTimeStart: 1, gracePeriodMin: 1 }
        );
        if (!shiftData) {
            return res.status(404).json({ message: "Shift not found" });
        }
        return res
            .status(200)
            .json({ message: "Shift details fetched successfully", data: shiftData });
    } catch (error) {
        console.error("Error fetching shift details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Funciton to get all employees data for updation by higher authority
const getAllEmployeesDateForUpdation = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        const employees = await employeeSchema.aggregate([
            {
                $match: {
                    orgId: new ObjectId(orgId),
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleInfo",
                },
            },
            {
                $unwind: "$roleInfo",
            },
            {
                $match: {
                    "roleInfo.name": {
                        $nin: ["ORGANIZATIONHEAD", "CEO", "HR"],
                    },
                },
            },
            {
                $lookup: {
                    from: "privileges",
                    localField: "privilegeId",
                    foreignField: "_id",
                    as: "privilegeInfo",
                },
            },
            {
                $unwind: "$privilegeInfo",
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentInfo",
                },
            },
            {
                $unwind: {
                    path: "$departmentInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "designations",
                    localField: "designationId",
                    foreignField: "_id",
                    as: "designationInfo",
                },
            },
            {
                $unwind: {
                    path: "$designationInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "shifts",
                    localField: "shiftId",
                    foreignField: "_id",
                    as: "shiftInfo",
                },
            },
            {
                $unwind: "$shiftInfo",
            },
            {
                $project: {
                    _id: 1,
                    lastName: 1,
                    gender: 1,
                    employeeCode: 1,
                    personalEmail: 1,
                    salaryPerMonth: 1,
                    dateOfBirth: 1,
                    firstName: 1,
                    dateOfJoining: 1,
                    lastLoginAt: 1,
                    phone: 1,
                    officeMail: 1,
                    pfNumber: 1,
                    esicNumber: 1,
                    linkedInProfile: 1,
                    "roleInfo._id": 1,
                    "roleInfo.name": 1,
                    "privilegeInfo._id": 1,
                    "privilegeInfo.name": 1,
                    "departmentInfo._id": 1,
                    "departmentInfo.name": 1,
                    "designationInfo._id": 1,
                    "designationInfo.title": 1,
                    "shiftInfo._id": 1,
                    "shiftInfo.name": 1,
                },
            },
        ]);

        return res.status(200).json({
            message: "All employees data fetched successfully",
            data: employees,
        });
    } catch (error) {
        console.error("Error fetching all employees data for updation:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getEmployeeDOB = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const today = getISTDateAndTime();
        const endDate = getISTDateAndTime();
        endDate.setDate(endDate.getUTCDate() + 31);

        const startMonth = today.getMonth() + 1;
        const startDay = today.getUTCDate();
        const endMonth = endDate.getMonth() + 1;
        const endDay = endDate.getUTCDate();

        // console.log(today, startDay)

        const isActiveStatus = await statusSchema.findOne({ statusType: "ACTIVE", orgId }, { _id: 1 });

        // console.log("data is comming for the dates b/w ", startMonth, "/", startDay, " and ", endMonth, "/", endDay);

        const employees = await employeeSchema.aggregate([
            {
                $match: {
                    orgId: new ObjectId(orgId),
                    status: isActiveStatus._id,
                },
            },
            {
                $addFields: {
                    dobMonth: { $month: "$dateOfBirth" },
                    dobDay: { $dayOfMonth: "$dateOfBirth" },
                },
            },
            {
                $match: {
                    $expr: {
                        $or: [
                            // If start and end are in the same month
                            {
                                $and: [
                                    { $eq: [startMonth, endMonth] },
                                    { $gte: ["$dobDay", startDay] },
                                    { $lte: ["$dobDay", endDay] },
                                    { $eq: ["$dobMonth", startMonth] },
                                ],
                            },

                            {
                                $and: [
                                    {
                                        $or: [
                                            { $lt: [startMonth, endMonth] },
                                            { $gt: [startMonth, endMonth] },
                                        ],
                                    },
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    { $eq: ["$dobMonth", startMonth] },
                                                    { $gte: ["$dobDay", startDay] },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { $eq: ["$dobMonth", endMonth] },
                                                    { $lte: ["$dobDay", endDay] },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { $gt: ["$dobMonth", startMonth] },
                                                    { $lt: ["$dobMonth", endMonth] },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $sort: { dobMonth: 1, dobDay: 1 },
            },
            {
                $project: {
                    employeeName: { $concat: ["$firstName", " ", "$lastName"] },
                    employeeCode: 1,
                    profileImage: 1,
                    dateOfBirth: 1,
                    officeMail: 1,
                    dateOfJoining: 1,
                },
            },
        ]);

        return res.status(200).json({
            message: "Upcoming employee birthdays fetched successfully",
            data: employees,
        });
    } catch (error) {
        console.error("Error fetching employee birthdays:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getCreatedEmployees = async (req, res) => {
    try {
        const employeeDate = await employeeSchema.aggregate([
            {
                $match: {
                    createdBy: new ObjectId(req.user._id),
                },
            },
            {
                $lookup: {
                    from: "privileges",
                    localField: "privilegeId",
                    foreignField: "_id",
                    as: "privilegeInfo",
                },
            },
            {
                $unwind: {
                    path: "$privilegeInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleInfo",
                },
            },
            {
                $unwind: {
                    path: "$roleInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "shifts",
                    localField: "shiftId",
                    foreignField: "_id",
                    as: "shiftInfo",
                },
            },
            {
                $unwind: {
                    path: "$shiftInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    privilegeInfo: {
                        name: "$privilegeInfo.name",
                        _id: "$privilegeInfo._id",
                    },
                    roleInfo: {
                        name: "$roleInfo.name",
                        _id: "$roleInfo._id",
                    },
                    shiftInfo: {
                        _id: "$shiftInfo._id",
                        name: "$shiftInfo.name",
                        startTime: "$shiftInfo.startTime",
                        breakTime: "$shiftInfo.breakTime",
                        endTime: "$shiftInfo.endTime",
                        gracePeriodMin: "$shiftInfo.gracePeriodMin",
                    },
                    lastName: 1,
                    gender: 1,
                    employeeCode: 1,
                    personalEmail: 1,
                    salaryPerMonth: 1,
                    dateOfBirth: 1,
                    firstName: 1,
                    dateOfJoining: 1,
                    lastLoginAt: 1,
                    phone: 1,
                    officeMail: 1,
                    profileImage: 1,
                    pfNumber: 1,
                    esicNumber: 1,
                    linkedInProfile: 1,
                },
            },
        ]);
        return res.status(200).json({
            message: "Created employees fetched successfully",
            "no.of employeeDate": employeeDate.length,
            data: employeeDate,
        });
    } catch (error) {
        console.error("Error fetching created employees:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// Get all employees of an organization
const getEntireOrgEmployees = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const employeeData = await employeeSchema
            .find({ orgId }, {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                createdBy: 0,
                updatedBy: 0,
                password: 0,
                lastLoginAt: 0,
                isLoggedIn: 0,
                dateOfLeaving: 0,
                salaryPerMonth: 0,
            })
            .populate({
                path: "privilegeId",
                select: "name",
                model: privilegeSchema,
            })
            .populate({
                path: "roleId",
                select: "name",
                model: roleSchema,
            })
            .populate({
                path: "orgId",
                select: "name",
                model: organizationSchema,
            })
            .populate({
                path: "teamId",
                select: "name",
                model: teamSchema,
            })
            .populate({
                path: "shiftId",
                select: "name startTime endTime breakTime gracePeriodMin",
                model: shiftSchema,
            })
            .populate({
                path: "designationId",
                select: "title roles",
                model: designationSchema,
            })
            .populate({
                path: "departmentId",
                select: "name",
                model: departmentSchema,
            })
            .populate({
                path: "status",
                select: "statusType",
                model: statusSchema,
            })
            .lean();

        return res
            .status(200)
            .json({
                message: "Organization employees fetched successfully",
                employees: employeeData,
            });
    } catch (error) {
        console.error("Error fetching organization employees:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Function to get the details of users under them
const getEmployeesByLevel = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await employeeSchema.findById(userId, { orgId: 1, roleId: 1, teamId: 1 });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch role in parallel with other needed roles for filtering
        const [role, hrRole, orgHeadRole, ceoRole, cooRole, managerRole, superadmin] = await Promise.all([
            roleSchema.findById(user.roleId),
            roleSchema.findOne({ name: "HR", orgId: user.orgId }),
            roleSchema.findOne({ name: "ORGANIZATIONHEAD", orgId: user.orgId }),
            roleSchema.findOne({ name: "CEO", orgId: user.orgId }),
            roleSchema.findOne({ name: "COO", orgId: user.orgId }),
            roleSchema.findOne({ name: "MANAGER", orgId: user.orgId }),
            privilegeSchema.findOne({ name: "SUPERADMIN", orgId: user.orgId }, { _id: 1 }),
        ]);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        const privilegeName = await privilegeSchema.findOne({ orgId: user.orgId, name: "ULTIMATEADMIN" }, { _id: 1 });

        let matchQuery = { orgId: user.orgId, _id: { $ne: userId }, privilegeId: { $ne: privilegeName?._id } };

        if (role.name === "CEO" || role.name === "COO" || role.name === "ORGANIZATIONHEAD" || req.user.privilegeId.toString() === superadmin._id.toString() ) {
            // CEO or ORGANIZATIONHEAD can see all employees except themselves
            // matchQuery as above
        } else if (role.name === "HR") {
            // HR can see all employees except themselves and ORGANIZATIONHEAD/CEO
            matchQuery.roleId = { $nin: [orgHeadRole?._id, ceoRole?._id, cooRole?._id] };
        } else if (role.name === "MANAGER") {
            // MANAGER can see employees in their teams except themselves and HR/ORGANIZATIONHEAD/CEO/MANAGER
            if (user.teamId) {
                matchQuery.teamId = user.teamId;
                matchQuery.roleId = { $nin: [hrRole?._id, orgHeadRole?._id, ceoRole?._id, cooRole?._id, managerRole?._id] };
            } else {
                // If not in a team, see no one
                matchQuery._id = { $eq: null };
            }
        } else if (role.name === "TEAMLEAD") {
            // TEAMLEAD can see employees in their team except themselves and HR/ORGANIZATIONHEAD/CEO/MANAGER
            if (user.teamId) {
                matchQuery.teamId = user.teamId;
                matchQuery.roleId = { $nin: [hrRole?._id, orgHeadRole?._id, ceoRole?._id, managerRole?._id] };
            } else {
                matchQuery._id = { $eq: null };
            }
        } else {
            // Other roles: see their team members with themselves and without HR/ORGANIZATIONHEAD/CEO/MANAGER
            if (user.teamId) {
                matchQuery.teamId = user.teamId;
                matchQuery.roleId = { $nin: [hrRole?._id, orgHeadRole?._id, ceoRole?._id, managerRole?._id] };
            } else {
                // If not in a team, see no one
                matchQuery._id = { $eq: null };
            }
        }

        // Use aggregation for population and field exclusion
        const employeesUnder = await employeeSchema.aggregate([
            { $match: matchQuery },
            { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "roleInfo" } },
            { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "privileges", localField: "privilegeId", foreignField: "_id", as: "privilegeInfo" } },
            { $unwind: { path: "$privilegeInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "departments", localField: "departmentId", foreignField: "_id", as: "departmentInfo" } },
            { $unwind: { path: "$departmentInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "designations", localField: "designationId", foreignField: "_id", as: "designationInfo" } },
            { $unwind: { path: "$designationInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "shifts", localField: "shiftId", foreignField: "_id", as: "shiftInfo" } },
            { $unwind: { path: "$shiftInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "statustypes", localField: "status", foreignField: "_id", as: "statusInfo" } },
            { $unwind: { path: "$statusInfo", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "speakeasies", localField: "_id", foreignField: "userId", as: "twofaInfo" } },
            { $unwind: { path: "$twofaInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    employeeCode: 1,
                    personalEmail: 1,
                    officeMail: 1,
                    phone: 1,
                    dateOfBirth: 1,
                    dateOfJoining: 1,
                    gender: 1,
                    profileImage: 1,
                    linkedInProfile: 1,
                    // isRequired2FA: 1,
                    roleInfo: {
                        _id: 1,
                        name: 1
                    },
                    privilegeInfo: {
                        _id: 1,
                        name: 1
                    },
                    departmentInfo: {
                        _id: 1,
                        name: 1
                    },
                    designationInfo: {
                        _id: 1,
                        title: 1
                    },
                    shiftInfo: {
                        _id: 1,
                        name: 1
                    },
                    statusInfo: {
                        _id: 1,
                        statusType: 1
                    },
                    teamId: 1,
                    salaryPerMonth: 1,
                    twofaEnabled: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$isRequired2FA", true] },
                                    { $ne: ["$twofaInfo", null] },
                                    { $eq: ["$twofaInfo.enabled", true] }
                                ]
                            },
                            true,
                            false
                        ]
                    }
                }
            }
        ]);

        return res.status(200).json({
            message: "Employees under user fetched successfully",
            count: employeesUnder.length,
            data: employeesUnder,
        });
    } catch (error) {
        console.error("Error fetching employees under user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get employees names and codes
const getEmployeesNameAndCode = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }
        const organization = await organizationSchema.findOne({ name: "Technical Hub" }, { _id: 1 });
        const employees = await employeeSchema.find(
            { orgId: organization._id },
            { employeeName: { $concat: ["$firstName", " ", "$lastName"] }, employeeCode: 1 }
        ).lean();
        return res.status(200).json({
            message: "Employees' names and codes fetched successfully",
            data: employees,
        });
    } catch (error) {
        console.error("Error fetching employees' names and codes:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ! This is for status Id
// setTimeout(async () => {
//     console.log("setting status as empty string where not present");
//     // if status is not there in the record, we have to keep it as empty string
//     await employeeSchema.updateMany(
//         { orgId: new ObjectId("68bbfb1106e9159927029312")},
//         { $set: { status: new ObjectId("68cbda6ee06bab8089c47486") } }
//     );
//     console.log("done");
// }, 8000);

// ! This is for linkedin, pf, esic
// setTimeout(async () => {
//     console.log("setting linkedin, pf, esic as empty string where not present");

//     await employeeSchema.updateMany({}, {
//         $set: {
//             linkedInProfile: "",
//             pfNumber: "",
//             esicNumber: ""
//         }
//     });
//     console.log("setting linkedin, pf, esic done");
// }, 8000);

module.exports = {
    createEmployee, // Create a new employee

    getOrganizationHead, // Get the organization head employee

    getAllTeamLeads, // Get all team leads

    getAllManagers, // Get all managers

    getEmployeeData, // Get employee data,

    getGeneralEmployees, // Get the GENERAL privilege employees

    getAllEmployeesWithPrivilegeAndRole, // Get all employees with privilege and role

    getNotifyToData, // Get higher authorities of an employee

    addTempPrivilege, // Add temporary privilege to an employee

    removeTempPrivilege, // Remove temporary privilege from an employee

    getTemporaryPrivilegeEmployees, // Get all employees with temporary privileges

    updateEmployee, // Update employee details

    getShiftDetails, // Get employee shift details,

    getAllEmployeesDateForUpdation, // Get all employees data for updation by higher authority

    getEmployeeDOB, // Get employee DOB details

    getCreatedEmployees, // Get employees created by specific employee

    getEntireOrgEmployees, // Get all employees of an organization

    getEmployeesByLevel, // Get the details of users under them

    getEmployeesNameAndCode, // Get employees names and codes
};
