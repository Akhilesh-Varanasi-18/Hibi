const organizationSchema = require("../models/organizationSchema");
const employeeSchema = require("../models/EmployeeSchemaManagement/employeeSchema");
const organizationHeadChangeRequestSchema = require("../models/organizationHeadChangeRequestSchema");
const privilegeSchema = require("../models/EmployeeSchemaManagement/privilegeSchema");
const rolesSchema = require("../models/EmployeeSchemaManagement/rolesSchema");
const statusSchema = require("../models/statusSchema");
const teamSchema = require("../models/teamSchema");
const productManagerSchema = require("../models/productManagerSchema");
const departmentSchema = require("../models/EmployeeSchemaManagement/departmentSchema");
const designationSchema = require("../models/EmployeeSchemaManagement/designationSchema");
const shiftSchema = require("../models/EmployeeSchemaManagement/shiftSchema");
const governmentIdTypesSchema = require('../models/EmployeeSchemaManagement/governmentIdTypesSchema');
const leaveTypesSchema = require('../models/LeaveSchemaManagement/leaveTypesSchema');
const permissionTypesSchema = require('../models/PermissionSchemaManagement/permissionTypesSchema');
const employeeBankDetailsSchema = require('../models/EmployeeSchemaManagement/employeeBankDetailsSchema');
const employeeContactsSchema = require('../models/EmployeeSchemaManagement/employeeContactsSchema');
const careerHistorySchema = require('../models/EmployeeSchemaManagement/careerHistorySchema');
const employeePersonalDetailsSchema = require('../models/EmployeeSchemaManagement/employeePersonalDetailsSchema');
const firebaseMessageingTockenSchema = require('../models/firebaseMessageingTockenSchema');
const leaveRequestSchema = require('../models/LeaveSchemaManagement/leaveRequestSchema');
const permissionRequestSchema = require('../models/PermissionSchemaManagement/permissionRequestSchema');

const { encryptThis, decryptThis } = require("../utils/encryption");
const nodemailer = require('nodemailer');

const { getISTDateAndTime } = require("../utils/timeFunction");
const axios = require("axios");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const logger = require('../utils/logger');
const { uploadToS3 } = require('../utils/s3Upload');


const getGSTOrgData = async (req, res) => {
    logger.info(`getGSTOrgData call by ${req.user.employeeCode}`);
    try {
        const { gstNumber } = req.params;
        const data = await axios.get(
            `https://sheet.gstincheck.co.in/check/${process.env.GSTAPIKEY}/${gstNumber}`
        );
        // console.log("GST Data:", data.data);
        res.status(200).json({
            message: "GST Data fetched successfully",
            data: data.data,
        });
        // return res.status(200).json({
        //   message: "GST Data fetched successfully",
        //   data: {
        //     flag: true,
        //     message: "GSTIN  found.",
        //     data: {
        //       nba: ["Service Provision", "Recipient of Goods or Services"],
        //       sts: "Active",
        //       rgdt: "01/07/2017",
        //       errorMsg: null,
        //       lstupdt: "27/Aug/2021",
        //       ctj: "R-5",
        //       frequencyType: "MONTHLY",
        //       ctb: "Private Limited Company",
        //       gstin: "06AACCG0527D1Z8",
        //       stjCd: "HR049",
        //       ctjCd: "ZO0105",
        //       dty: "Regular",
        //       tradeNam: "GOOGLE INDIA PVT LTD",
        //       pradr: {
        //         ntr: "Service Provision, Recipient of Goods or Services",
        //         addr: {
        //           dst: "Gurgaon",
        //           loc: "Silokhera",
        //           city: "",
        //           stcd: "Haryana",
        //           flno: "",
        //           lg: "",
        //           st: "Sector- 15, Part-I",
        //           pncd: "122002",
        //           bno: "Tower-B",
        //           bnm: "Unitech Signature Tower",
        //           lt: "",
        //         },
        //       },
        //       adadr: [],
        //       lgnm: "GOOGLE INDIA PRIVATE LIMTED",
        //       stj: "Gurgaon (East) Ward 4",
        //       cxdt: "",
        //     },
        //   },
        // });
    }
    catch (error) {
        logger.error(`Error in getGSTOrgData: ${error.message}`);
        console.error("Error fetching GST data:", error);
        return res
            .status(500)
            .json({ message: "Failed to fetch GST data", error: error.message });
    }
};

// Function to add a new organization
const addOrganization = async (req, res) => {
    logger.info(`addOrganization call by ${req.user.employeeCode}`);
    try {
        const { name, gstNumber, regDate, address, status, organizationEmail, organizationAppPassword } = req.body;

        // Validate required fields
        if (!name || !address || !status || !organizationEmail || !organizationAppPassword) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        // Check if the organization Name already exists
        if (gstNumber) {
            const existingOrganization = await organizationSchema.find({ gstNumber });
            if (existingOrganization.length > 0) {
                return res.status(400).json({ message: "Organization with this GST Number already exists" });
            }
        }

        const existingName = await organizationSchema.find({ name });
        if (existingName.length > 0) {
            return res.status(400).json({ message: "Organization with this name already exists" });
        }

        const encryptedPassword = encryptThis(organizationAppPassword);
        const organizationData = {
            name,
            regDate,
            address,
            gstNumber: gstNumber ? gstNumber : "",
            status,
            createdBy: req.user._id,
            orgHeadId: null,
            organizationEmail,
            organizationAppPassword: JSON.stringify(encryptedPassword),
            createdAt: getISTDateAndTime(),
            updatedAt: getISTDateAndTime(),
        };

        // verify email by transporter.verify()
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: organizationEmail,
                pass: decryptThis(JSON.parse(organizationData.organizationAppPassword).encryptedData, JSON.parse(organizationData.organizationAppPassword).iv),
            }
        });

        try {
            await transporter.verify();
            console.log("Server is ready to take our messages");
        } catch (error) {
            console.log(error);
            return res.status(400).json({ message: "Email or App Password is incorrect" });
        }

        // Save the organization to the database
        const organization = new organizationSchema(organizationData);
        await organization.save();

        const privilegeExist = await privilegeSchema.findOne({ name: "ULTIMATEADMIN", orgId: organization._id });
        if (!privilegeExist) {
            const newprivilege = new privilegeSchema();
            newprivilege.name = "ULTIMATEADMIN";
            newprivilege.description = "";
            newprivilege.createdBy = req.user._id;
            newprivilege.updatedBy = req.user._id;
            newprivilege.orgId = organization._id;
            await newprivilege.save();
        }
        const roleExist = await rolesSchema.findOne({ name: "ORGANIZATIONHEAD", orgId: organization._id });
        if (!roleExist) {
            const newRole = new rolesSchema({
                name: "ORGANIZATIONHEAD",
                createdBy: req.user._id,
                updatedBy: req.user._id,
                orgId: organization._id,
            });
            await newRole.save();
        }

        logger.info(`Organization with name '${name}' created by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: "Organization added successfully" });
    } catch (error) {
        logger.error(`Error in addOrganization: ${error.message}`);
        console.log("Error adding organization:", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "Failed to add organization", error: error.message });
        }
    }
};

// Function to update an organization
const updateOrganization = async (req, res) => {
    logger.info(`updateOrganization call by ${req.user.employeeCode}`);
    try {
        const { organizationId, name, address, organizationEmail, organizationAppPassword } = req.body;

        // Validate required fields
        if (!organizationId) {
            return res.status(400).json({ message: "OrganizationID is required" });
        }

        // Check if the organization exists
        const organization = await organizationSchema.findById(organizationId);

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        if (organizationEmail && organizationAppPassword) {
            const encryptedPassword = encryptThis(organizationAppPassword);
            organization.organizationEmail = organizationEmail;
            organization.organizationAppPassword = JSON.stringify(encryptedPassword);

            // verify email by transporter.verify()
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: organizationEmail,
                    pass: decryptThis(JSON.parse(organization.organizationAppPassword).encryptedData, JSON.parse(organization.organizationAppPassword).iv),
                }
            });

            try {
                await transporter.verify();
                console.log("Server is ready to take our messages");
            } catch (error) {
                console.log(error);
                return res.status(400).json({ message: "Email or App Password is incorrect" });
            }
        }

        // Find and update the organization
        const UpdatedOrganization = await organizationSchema.findByIdAndUpdate(
            organizationId,
            {
                name: name || organization.name,
                address: address || organization.address,
                organizationEmail: organization.organizationEmail,
                organizationAppPassword: organization.organizationAppPassword,
                updatedAt: getISTDateAndTime(),
            },
            { new: true }
        );

        logger.info(`Organization with name '${UpdatedOrganization.name}' updated by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({
            message: "Organization updated successfully",
        });
    } catch (error) {
        logger.error(`Error in updateOrganization: ${error.message}`);
        console.error("Error updating organization:", error);
        return res
            .status(500)
            .json({ message: "Failed to update organization", error: error.message });
    }
};

// Function to delete an organization
const deleteOrganization = async (req, res) => {
    logger.info(`deleteOrganization call by ${req.user.employeeCode}`);
    try {
        const { organizationId } = req.params;

        // Validate required fields
        if (!organizationId) {
            return res.status(400).json({ message: "OrganizationID is required" });
        }

        // Check if the organization exists
        const organization = await organizationSchema.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Find all employees in the organization
        const employees = await employeeSchema.find({ orgId: organizationId });

        // Collect all employee IDs
        const employeeIds = employees.map(emp => emp._id);

        // Delete all related records with orgId or employeeId in their schema
        await Promise.all([
            // Organization related
            employeeSchema.deleteMany({ orgId: organizationId }),
            privilegeSchema.deleteMany({ orgId: organizationId }),
            rolesSchema.deleteMany({ orgId: organizationId }),
            statusSchema.deleteMany({ orgId: organizationId }),
            organizationHeadChangeRequestSchema.deleteMany({ orgId: organizationId }),
            teamSchema.deleteMany({ orgId: organizationId }),
            productManagerSchema.deleteMany({ orgId: organizationId }),
            departmentSchema.deleteMany({ orgId: organizationId }),
            designationSchema.deleteMany({ orgId: organizationId }),
            shiftSchema.deleteMany({ orgId: organizationId }),
            governmentIdTypesSchema.deleteMany({ orgId: organizationId }),
            leaveTypesSchema.deleteMany({ orgId: organizationId }),
            permissionTypesSchema.deleteMany({ orgId: organizationId }),
            // tripTypeSchema.deleteMany({ orgId: organizationId }),
            // tripSchema.deleteMany({ orgId: organizationId }),

            // Employee related
            employeeBankDetailsSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            employeeContactsSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            careerHistorySchema.deleteMany({ employeeId: { $in: employeeIds } }),
            employeePersonalDetailsSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            firebaseMessageingTockenSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            // dailyWorkReportSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            // temporaryAssignmentSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            leaveRequestSchema.deleteMany({ employeeId: { $in: employeeIds } }),
            permissionRequestSchema.deleteMany({ employeeId: { $in: employeeIds } }),
        ]);

        const deletedOrganization = await organizationSchema.findByIdAndDelete(organizationId);

        if (!deletedOrganization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        logger.info(`Organization with name '${deletedOrganization.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Organization and all related records deleted successfully" });
    } catch (error) {
        logger.error(`Error in deleteOrganization: ${error.message}`);
        return res
            .status(500)
            .json({ message: "Failed to delete organization", error: error.message });
    }
};

// Function to get all organization Data
const getOrganizationData = async (req, res) => {
    logger.info(`getOrganizationData call by ${req.user.employeeCode}`);
    try {
        const organizationId = req?.user?.orgId;
        const organizationData = await organizationSchema.aggregate([
            {
                $match: {
                    _id: new ObjectId(organizationId)
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "orgHeadId",
                    foreignField: "_id",
                    as: "OrgHead"
                }
            },
            {
                $unwind: "$OrgHead"
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "orgCeoId",
                    foreignField: "_id",
                    as: "OrgCeo"
                }
            },
            {
                $unwind: {
                    path: "$OrgCeo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: 1,
                    address: 1,
                    gstNumber: 1,
                    orgLogo: 1,
                    orgStamp: 1,
                    orgBanner: 1,
                    colorPalette: 1,
                    status: 1,
                    regDate: 1,
                    organizationEmail: 1,
                    HeadName: {
                        $concat: ["$OrgHead.firstName", " ", "$OrgHead.lastName"]
                    },
                    CeoNameFirstName: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.firstName"
                        }
                    },
                    CeoNameLastName: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.lastName"
                        }
                    },
                    CeoId: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo._id"
                        }
                    },
                    headOfficeMail: "$OrgHead.officeMail",
                    ceoOfficeMail: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.officeMail"
                        }
                    },
                    headpersonalEmail: "$OrgHead.personalEmail",
                    ceoPersonalEmail: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.personalEmail"
                        }
                    },
                    headphone: "$OrgHead.phone",
                    ceoPhone: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.phone"
                        }
                    },
                    headEmployeeCode: "$OrgHead.employeeCode",
                    ceoEmployeeCode: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.employeeCode"
                        }
                    },
                    headProfileImage: "$OrgHead.profileImage",
                    ceoProfileImage: {
                        $cond: {
                            if: { $eq: ["$OrgCeo", null] },
                            then: "",
                            else: "$OrgCeo.profileImage"
                        }
                    }
                }
            }
        ]);
        if (!organizationData) {
            return res.status(404).json({ message: "No organization data found" });
        }
        res.status(200).json({
            message: "Organization data retrieved successfully",
            data: organizationData,
        });
    } catch (error) {
        logger.error(`Error in getOrganizationData: ${error.message}`);
        console.error("Error retrieving organization data:", error);
        return res
            .status(500)
            .json({ message: "Failed to retrieve organization data" });
    }
};

// Function to add an organization head
const addOrganizationHead = async (req, res) => {
    logger.info(`addOrganizationHead call by ${req.user.employeeCode}`);
    try {
        const { organizationId, headId } = req.body;
        if (!organizationId || !headId) {
            return res
                .status(400)
                .json({ message: "Organization ID and Head ID are required" });
        }
        const organization = await organizationSchema.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }
        const head = await employeeSchema.findById(headId);
        if (!head) {
            return res.status(404).json({ message: "Head not found" });
        }
        organization.orgHeadId = headId;
        await organization.save();
        return res
            .status(200)
            .json({ message: "Organization head added successfully" });
    } catch (error) {
        logger.error(`Error in addOrganizationHead: ${error.message}`);
        console.error("Error adding organization head:", error);
        return res.status(500).json({
            message: "Failed to add organization head",
            error: error.message,
        });
    }
};

// function to get the organization and head Data
const getOrganizationAndHeadData = async (req, res) => {
    logger.info(`getOrganizationAndHeadData call by ${req.user.employeeCode}`);
    try {
        const organizationId = req?.user?.orgId;

        if (!organizationId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const organization = await organizationSchema.findById(organizationId, {
            __v: 0,
            createdBy: 0,
            updatedBy: 0,
            createdAt: 0,
            updatedAt: 0,
            // keep asset fields and color palette
            orgLogo: 1,
            orgStamp: 1,
            orgBanner: 1,
            colorPalette: 1,
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        const organizationHead = await employeeSchema.findOne(
            { orgId: organizationId },
            {
                _id: 1,
                orgId: 1,
                firstName: 1,
                personalEmail: 1,
                phone: 1,
                employeeCode: 1,
                profileImage: 1,
            }
        );

        if (!organizationHead) {
            return res.status(404).json({ message: "Organization Head not found" });
        }

        return res.status(200).json({ organization, organizationHead });
    } catch (error) {
        logger.error(`Error in getOrganizationAndHeadData: ${error.message}`);
        console.error("Error while fetching Organization and Head by ID: ", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};

// Function to add an organization head change request
const addOrganizationHeadChangeRequest = async (req, res) => {
    logger.info(`addOrganizationHeadChangeRequest call by ${req.user.employeeCode}`);
    try {
        const { organizationId, newHeadId, oldHeadId, reason } = req.body;

        const actionedBy = req.user._id;

        // Validate required fields
        if (!organizationId || !newHeadId || !oldHeadId || !reason) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const penddingStatus = await statusSchema.findOne(
            { orgId: organizationId, statusType: "PENDING" },
            { _id: 1 }
        );

        // Create a new head change request
        const headChangeRequest = new organizationHeadChangeRequestSchema({
            organizationId,
            newHeadId,
            oldHeadId,
            statusId: penddingStatus._id,
            requestReason: reason,
            requestedBy: actionedBy,
            actionedBy,
        });

        await headChangeRequest.save();
        return res.status(201).json({
            message: "Organization head change request created successfully",
        });
    } catch (error) {
        logger.error(`Error in addOrganizationHeadChangeRequest: ${error.message}`);
        console.error("Error creating organization head change request:", error);
        return res
            .status(500)
            .json({
                message: "Failed to create head change request",
                error: error.message,
            });
    }
};

// Function to process an organization head change request
const processOrganizationHeadChangeRequest = async (req, res) => {
    logger.info(`processOrganizationHeadChangeRequest call by ${req.user.employeeCode}`);
    try {
        const { requestId, statusId } = req.body;

        const actionedBy = req.user._id;

        // Validate required fields
        if (!requestId || !statusId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const request = await organizationHeadChangeRequestSchema.findById(
            requestId
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.requestApprovals.push({
            employeeId: actionedBy,
            status: statusId,
            createdAt: getISTDateAndTime(),
        });

        await request.save();
        return res.status(200).json({
            message: "Organization head change request processed successfully",
        });
    } catch (error) {
        logger.error(`Error in processOrganizationHeadChangeRequest: ${error.message}`);
        console.error("Error processing organization head change request:", error);
        return res
            .status(500)
            .json({
                message: "Failed to process head change request",
                error: error.message,
            });
    }
};

// function to finalize the organization head
const finalizeOrganizationHeadChangeRequest = async (req, res) => {
    logger.info(`finalizeOrganizationHeadChangeRequest call by ${req.user.employeeCode}`);
    try {
        const { requestId, reason, statusId } = req.body;
        const actionedBy = req.user._id;

        // Validate required fields
        if (!requestId || !reason || !statusId) {
            return res
                .status(400)
                .json({ message: "Request Id, Reason and Status are required" });
        }

        const request = await organizationHeadChangeRequestSchema.findById(
            requestId
        );
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Update the request with action reason and status
        request.actionReason = reason;
        request.statusId = statusId;
        request.actionedBy = actionedBy;

        const statusTyes = {
            ACCEPT: "ACCEPT",
            REJECT: "REJECT",
        };

        const status = await statusSchema.findOne(
            {
                orgId: request.organizationId,
                _id: statusId,
                statusType: { $in: [statusTyes.ACCEPT, statusTyes.REJECT] },
            },
            { _id: 1, statusType: 1 }
        );

        if (!status) {
            return res.status(400).json({ message: "Invalid status ID" });
        }

        if (status.statusType === statusTyes.ACCEPT) {
            const changedOrganizationHead =
                await organizationSchema.findByIdAndUpdate(
                    request.organizationId,
                    { orgHeadId: request.newHeadId, updatedAt: getISTDateAndTime() },
                    { new: true }
                );

            if (!changedOrganizationHead) {
                return res.status(404).json({ message: "Organization not found" });
            }

            await request.save();

            res.status(200).json({
                message: "Organization head changed successfully",
            });
        } else if (status.statusType === statusTyes.REJECT) {
            res.status(200).json({
                message: "Organization head change request rejected",
            });
        }
    } catch (error) {
        logger.error(`Error in finalizeOrganizationHeadChangeRequest: ${error.message}`);
        console.error(error);
        return res
            .status(500)
            .json({
                message: "Failed to finalize organization head",
                error: error.message,
            });
    }
};


// const addOrganizationCEO = async(orgId, ceoId) => {
//   // Logic to add a CEO to the organization
//   try{
//     await organizationSchema.findByIdAndUpdate(
//       orgId,
//       { orgCeoId: ceoId },
//       { new: true }
//     );
//     console.log("Added Successfully");
//   } catch (error) {
//     console.error("Error adding CEO to organization:", error);
//   }
// }


// setTimeout(async () => {
//   await addOrganizationCEO("68a5eea64c4a3070733ceeac","68a5fe43ef1a3bd3934c005b" )
// }, 10000);


// setTimeout(async () => {
//   console.log("adding mail and password to existing orgs");
//   try {
//     await organizationSchema.updateMany({}, { $set: { organizationEmail: "", organizationAppPassword: "" } });
//     console.log("Finished updating organizations");
//   } catch (error) {
//     console.error("Error updating organizations:", error);
//   }
// }, 10000);


// setTimeout(async () => {
//     console.log("adding colorPalette to existing orgs");
//     try {
//         await organizationSchema.updateMany({}, { $set: { colorPalette: {} } });
//         console.log("Finished updating organizations");
//     }
//     catch (error) {
//         console.error("Error updating organizations:", error);
//     }
// }, 10000);

// Function to update an organization regarding logo, stamp, banner etc.
const updateOrganizationAssets = async (req, res) => {
    logger.info(`updateOrganizationAssets call by ${req.user?.employeeCode || 'unknown'}`);
    try {
        const organizationId = req.body.organizationId || req.user?.orgId;
        console.log(req.body.colorPalette);
        console.log(req.files);

        if (!organizationId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const organization = await organizationSchema.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Named fields approach: multer.fields will populate req.files as an object
        // e.g. req.files = { orgLogo: [file], orgStamp: [file], orgBanner: [file] }
        const filesObj = req.files || {};

        // colorPalette: may be sent as object or JSON string
        let colorPalette = null;
        if (req.body.colorPalette) {
            const raw = req.body.colorPalette;
            if (typeof raw === 'object') {
                colorPalette = raw;
            } else if (typeof raw === 'string') {
                // Try several parsing strategies to be resilient to client mistakes
                let parsed = null;
                try {
                    parsed = JSON.parse(raw);
                } catch (e1) {
                    // try replacing single quotes with double quotes
                    try {
                        parsed = JSON.parse(raw.replace(/'/g, '"'));
                    } catch (e2) {
                        // try querystring style (a=1&b=2)
                        try {
                            const qs = require('querystring');
                            const obj = qs.parse(raw);
                            parsed = Object.keys(obj).length ? obj : null;
                        } catch (e3) {
                            parsed = null;
                        }
                    }
                }

                if (parsed && typeof parsed === 'object') {
                    colorPalette = parsed;
                } else {
                    logger.warn('Could not parse colorPalette, ignoring it');
                }
            }
        }

        // helper to upload a single named file and set the organization field
        const uploadNamed = async (fieldName, orgFieldName) => {
            try {
                const file = filesObj[fieldName] && Array.isArray(filesObj[fieldName]) ? filesObj[fieldName][0] : null;
                if (!file) return;

                const folder = `organization_assets/${organizationId}`;
                const result = await uploadToS3(file.buffer, file.originalname || `${fieldName}_${Date.now()}`, file.mimetype, folder);
                if (result && result.fileUrl) {
                    organization[orgFieldName] = result.fileUrl;
                }
            } catch (err) {
                logger.error(`Failed to upload ${fieldName}: ${err.message}`);
            }
        };

        // upload each named asset if provided
        await Promise.all([
            uploadNamed('orgLogo', 'orgLogo'),
            uploadNamed('orgStamp', 'orgStamp'),
            uploadNamed('orgBanner', 'orgBanner')
        ]);

        if (colorPalette && typeof colorPalette === 'object') {
            // store palette on organization (schema updated to include colorPalette)
            organization.colorPalette = colorPalette;
        }

        organization.updatedAt = getISTDateAndTime();
        await organization.save();

        return res.status(200).json({ message: 'Organization assets updated successfully' });
    } catch (error) {
        logger.error(`Error in updateOrganizationAssets: ${error.message}`);
        console.error("Error updating organization assets:", error);
        return res
            .status(500)
            .json({ message: "Failed to update organization assets", error: error.message });
    }
};


module.exports = {
    addOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationData,
    addOrganizationHead,
    getOrganizationAndHeadData,
    getGSTOrgData,
    addOrganizationHeadChangeRequest,
    processOrganizationHeadChangeRequest,
    finalizeOrganizationHeadChangeRequest,
    updateOrganizationAssets
};