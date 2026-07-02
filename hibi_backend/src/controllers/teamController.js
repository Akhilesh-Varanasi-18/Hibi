const teamSchema = require('../models/teamSchema');
const rolesSchema = require('../models/EmployeeSchemaManagement/rolesSchema');
const employeeSchema = require('../models/EmployeeSchemaManagement/employeeSchema');
const Privilege = require('../models/EmployeeSchemaManagement/privilegeSchema');
const { get } = require('mongoose');
const { getISTDateAndTime } = require('../utils/timeFunction');
const mongoose = require("mongoose");
const privilegeSchema = require('../models/EmployeeSchemaManagement/privilegeSchema');
const ObjectId = mongoose.Types.ObjectId;
const statusSchema = require('../models/statusSchema');

const logger = require('../utils/logger');

// Function to create a team
const createTeam = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const { teamName, managerIds, teamLeadIds, employeeIds } = req.body;

        // Validate the fields
        if (!teamName || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        // Ensure at least one manager or one team lead
        if ((!Array.isArray(managerIds) || managerIds.length === 0) && (!Array.isArray(teamLeadIds) || teamLeadIds.length === 0)) {
            return res.status(400).json({ message: 'At least one manager or one team lead is required' });
        }

        // no ids should be repeated in managerIds, teamLeadIds and employeeIds, if there are any duplicates return
        const allIdsSet = new Set([...employeeIds, ...(managerIds || []), ...(teamLeadIds || [])]);
        if (allIdsSet.size !== (employeeIds.length + (managerIds ? managerIds.length : 0) + (teamLeadIds ? teamLeadIds.length : 0))) {
            return res.status(400).json({ message: 'Duplicate IDs found in managerIds, teamLeadIds, or employeeIds' });
        }

        // if team with the same name with the same orgId exists
        const existingTeam = await teamSchema.findOne({ teamName: teamName.toUpperCase().trim(), orgId });
        if (existingTeam) {
            return res.status(400).json({ message: 'Team with the same name already exists' });
        }

        const isActiveStatus = await statusSchema.findOne({ orgId, statusType: 'ACTIVE' });
        if (!isActiveStatus) {
            return res.status(500).json({ message: 'ACTIVE status not found in the organization' });
        }

        const validateAllIds = [...employeeIds, ...(managerIds || []), ...(teamLeadIds || [])];
        const validatingIds = await employeeSchema.find({
            _id: { $in: validateAllIds },
            orgId,
            status: isActiveStatus._id
        });

        if (validatingIds.length !== validateAllIds.length) {
            return res.status(400).json({ message: 'Invalid manager or team lead or employee IDs or You are trying to create a team with INACTIVE employees' });
        }

        const newTeam = new teamSchema({
            orgId,
            teamName,
            managerIds,
            teamLeadIds,
            createdBy: req?.user?._id,
            updatedBy: req?.user?._id
        });

        await newTeam.save();

        const teamId = newTeam._id;

        const allIds = [...employeeIds, ...(teamLeadIds || []), ...(managerIds || [])];

        await employeeSchema.updateMany(
            { _id: { $in: allIds } },
            { $set: { teamId } }
        );

        logger.info(`Team '${teamName}' created by user ${req?.user?.firstName} ${req?.user?.lastName}`);
        return res.status(201).json({ message: 'Team created successfully' });
    } catch (error) {
        logger.error(`Error creating team: ${error.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// // Function get all the teams
// const getAllTeams = async (req, res) => {
//     try {
//         const orgId = req?.user?.orgId;

//         const teams = await teamSchema.find({ orgId }, {
//             __v: 0,
//             createdAt: 0,
//             updatedAt: 0,
//             createdBy: 0,
//             updatedBy: 0
//         });

//         return res.status(200).json(teams);
//     } catch (error) {
//         console.error('Error fetching teams:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// Function to Delete team using team id
const deleteTeam = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;
        const { teamId } = req.params;

        const privilegeName = await employeeSchema.findOne({ orgId, _id: userId }).populate('privilegeId', 'name');

        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is required' });
        }

        // checking if the team is created by the user
        const team = await teamSchema.findOne({ _id: teamId, orgId });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Allow SUPERADMIN to delete any team, otherwise only creator can delete
        if (privilegeName?.privilegeId?.name !== "SUPERADMIN" && team?.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this team' });
        }

        // Remove team reference from employees
        await employeeSchema.updateMany(
            { teamId },
            { $unset: { teamId: null } },
            { $set: { updatedBy: userId, updatedAt: getISTDateAndTime() } }
        );

        // Delete the team
        await teamSchema.deleteOne({ _id: teamId });

        logger.info(`Team '${team.teamName}' deleted by user ${req?.user?.firstName} ${req?.user?.lastName}`);
        return res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting team: ${error.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to Update team using team id
// const updateTeam = async (req, res) => {
//     try {
//         const orgId = req?.user?.orgId;
//         const { teamId, teamName, managerIds, teamLeadIds, employeeIds } = req.body;

//         // Validate the fields
//         if (!teamId || !teamName || !managerIds || !teamLeadIds ||
//             !Array.isArray(employeeIds) || !Array.isArray(managerIds) || !Array.isArray(teamLeadIds) ||
//             managerIds.length === 0 || teamLeadIds.length === 0 || employeeIds.length === 0) {
//             return res.status(400).json({ message: 'Invalid input data' });
//         }

//         const allIds = [...employeeIds, ...managerIds, ...teamLeadIds];

//         // Validating the employees
//         const validEmployeeIds = await employeeSchema.find({
//             _id: { $in: allIds },
//             orgId
//         });

//         if (validEmployeeIds.length !== allIds.length) {
//             return res.status(400).json({ message: 'Invalid employee IDs' });
//         }

//         const storedTeam = await teamSchema.findOne({ _id: teamId, orgId }, { _id: 1 });

//         // removing the teamId from the employee schma
//         await employeeSchema.updateMany(
//             { teamId: storedTeam._id },
//             { $unset: { teamId: null }, updatedBy: req?.user?._id, updatedAt: getISTDateAndTime() }
//         );

//         const updatedTeam = await teamSchema.findOneAndUpdate(
//             { _id: teamId, orgId },
//             { teamName, managerIds, teamLeadIds, updatedBy: req?.user?._id },
//             { new: true }
//         );

//         if (!updatedTeam) {
//             return res.status(404).json({ message: 'Team not found' });
//         }

//         await employeeSchema.updateMany(
//             { _id: { $in: allIds } },
//             { $set: { teamId: updatedTeam._id }, updatedBy: req?.user?._id, updatedAt: getISTDateAndTime() }
//         );

//         return res.status(200).json({ message: 'Team updated successfully' });
//     } catch (error) {
//         console.error('Error updating team:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

const updateTeam = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const { teamId, teamName, managerIds, teamLeadIds, employeeIds } = req.body;

        // Validate the fields
        if (!teamId || !teamName ||
            !Array.isArray(employeeIds) || !Array.isArray(managerIds) || !Array.isArray(teamLeadIds) ||
            employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        // Ensure at least one manager or one team lead
        if ((managerIds.length === 0) && (teamLeadIds.length === 0)) {
            return res.status(400).json({ message: 'At least one manager or one team lead is required' });
        }

        const allIds = [...employeeIds, ...managerIds, ...teamLeadIds];

        // Validating the employees
        const validEmployeeIds = await employeeSchema.find({
            _id: { $in: allIds },
            orgId
        });

        if (validEmployeeIds.length !== allIds.length) {
            return res.status(400).json({ message: 'Invalid employee IDs' });
        }

        const storedTeam = await teamSchema.findOne({ _id: teamId, orgId }, { _id: 1 });

        // removing the teamId from the employee schema
        await employeeSchema.updateMany(
            { teamId: storedTeam._id },
            { $unset: { teamId: null }, updatedBy: req?.user?._id, updatedAt: getISTDateAndTime() }
        );

        const updatedTeam = await teamSchema.findOneAndUpdate(
            { _id: teamId, orgId },
            { teamName, managerIds, teamLeadIds, updatedBy: req?.user?._id },
            { new: true }
        );

        if (!updatedTeam) {
            return res.status(404).json({ message: 'Team not found' });
        }

        await employeeSchema.updateMany(
            { _id: { $in: allIds } },
            { $set: { teamId: updatedTeam._id }, updatedBy: req?.user?._id, updatedAt: getISTDateAndTime() }
        );

        logger.info(`Team '${updatedTeam.teamName}' updated by user ${req?.user?.firstName} ${req?.user?.lastName}`);
        return res.status(200).json({ message: 'Team updated successfully' });
    } catch (error) {
        logger.error(`Error updating team: ${error.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to delete an employee from a team
const deleteEmployeeFromTeam = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;
        const { teamId, employeeId } = req.query;

        if (!teamId || !employeeId) {
            return res.status(400).json({ message: 'Team ID and Employee ID are required' });
        }

        // Check privilege of user
        const user = await employeeSchema.findOne({ _id: userId, orgId }).populate('privilegeId', 'name');
        let team;
        if (user?.privilegeId?.name === "SUPERADMIN") {
            team = await teamSchema.findOne({ _id: teamId, orgId });
        } else {
            team = await teamSchema.findOne({ _id: teamId, orgId, createdBy: userId });
        }

        if (!team) {
            return res.status(404).json({ message: 'Team not found or you are not authorized to delete employee from this team' });
        }

        // Remove employeeId from managerIds and teamLeadIds arrays if present
        let updated = false;
        if (team.managerIds.map(String).includes(String(employeeId))) {
            team.managerIds = team.managerIds.filter(id => String(id) !== String(employeeId));
            updated = true;
        }
        if (team.teamLeadIds.map(String).includes(String(employeeId))) {
            team.teamLeadIds = team.teamLeadIds.filter(id => String(id) !== String(employeeId));
            updated = true;
        }
        if (updated) {
            team.updatedBy = userId;
            team.updatedAt = getISTDateAndTime();
            await team.save();
        }

        // Remove teamId from employee document
        await employeeSchema.updateOne(
            { _id: employeeId, teamId },
            { $unset: { teamId: null }, $set: { updatedBy: userId, updatedAt: getISTDateAndTime() } }
        );

        logger.info(`Employee with id '${employeeId}' removed from team '${team.teamName}' by user ${req?.user?.firstName} ${req?.user?.lastName}`);
        return res.status(200).json({ message: 'Employee removed from team successfully' });
    } catch (error) {
        logger.error(`Error deleting employee from team: ${error.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to get employee teams
const getAllDetails = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;
        const userRoleId = req?.user?.roleId;

        if (!userRoleId) {
            return res.status(400).json({ message: "You are not assigned to any role" });
        }

        // If roleId is present, get the role name
        let roleName = null;
        let privilegeName = null;
        if (userRoleId) {
            // Find the role name from the employeeSchema
            const user = await employeeSchema.findOne({ _id: userId, orgId }).populate('roleId').populate('privilegeId');
            roleName = user?.roleId?.name;
            privilegeName = user?.privilegeId?.name;

            if (roleName === "CEO" || roleName === "HR" || roleName === "COO" || privilegeName === "SUPERADMIN") {
                const teams = await teamSchema.aggregate(
                    [
                        {
                            $match: {
                                orgId: new ObjectId(orgId)
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                let: {
                                    teamId: "$_id",
                                    managerIds: "$managerIds",
                                    teamLeadIds: "$teamLeadIds"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$teamId", "$$teamId"] },
                                                    {
                                                        $not: [
                                                            {
                                                                $in: [
                                                                    "$_id",
                                                                    "$$managerIds"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        $not: [
                                                            {
                                                                $in: [
                                                                    "$_id",
                                                                    "$$teamLeadIds"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "roles",
                                            localField: "roleId",
                                            foreignField: "_id",
                                            as: "roleInfo"
                                        }
                                    },
                                    {
                                        $project: {
                                            firstName: 1,
                                            lastName: 1,
                                            officeMail: 1,
                                            employeeCode: 1,
                                            personalMail: 1,
                                            roleId: 1,
                                            roleInfo: {
                                                $arrayElemAt: ["$roleInfo", 0]
                                            }
                                        }
                                    }
                                ],
                                as: "employeesInfo"
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "managerIds",
                                foreignField: "_id",
                                as: "managerInfo"
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "teamLeadIds",
                                foreignField: "_id",
                                as: "teamLeadInfo"
                            }
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
                            $addFields: {
                                employeesGroup: {
                                    Interns: {
                                        $filter: {
                                            input: "$employeesInfo",
                                            cond: {
                                                $eq: [
                                                    "$$this.roleInfo.name",
                                                    "INTERN"
                                                ]
                                            }
                                        }
                                    },
                                    Employees: {
                                        $filter: {
                                            input: "$employeesInfo",
                                            cond: {
                                                $eq: [
                                                    "$$this.roleInfo.name",
                                                    "EMPLOYEE"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                teamName: 1,
                                managers: {
                                    $map: {
                                        input: "$managerInfo",
                                        as: "manager",
                                        in: {
                                            _id: "$$manager._id",
                                            firstName: "$$manager.firstName",
                                            lastName: "$$manager.lastName",
                                            officeMail: "$$manager.officeMail",
                                            employeeCode:
                                                "$$manager.employeeCode",
                                            personalMail: "$$manager.personalMail"
                                        }
                                    }
                                },
                                teamLeads: {
                                    $map: {
                                        input: "$teamLeadInfo",
                                        as: "teamLead",
                                        in: {
                                            _id: "$$teamLead._id",
                                            firstName: "$$teamLead.firstName",
                                            lastName: "$$teamLead.lastName",
                                            officeMail: "$$teamLead.officeMail",
                                            employeeCode:
                                                "$$teamLead.employeeCode",
                                            personalMail:
                                                "$$teamLead.personalMail"
                                        }
                                    }
                                },
                                employeesGroup: 1,
                                createdBy: {
                                    $let: {
                                        vars: {
                                            created: {
                                                $arrayElemAt: ["$createdByInfo", 0]
                                            }
                                        },
                                        in: {
                                            _id: "$$created._id",
                                            firstName: "$$created.firstName",
                                            lastName: "$$created.lastName",
                                            officeMail: "$$created.officeMail",
                                            employeeCode:
                                                "$$created.employeeCode",
                                            personalMail: "$$created.personalMail"
                                        }
                                    }
                                }
                            }
                        }
                    ]
                )
                logger.info(`User ${req?.user?.firstName} ${req?.user?.lastName} fetched all teams`);
                return res.status(200).json({ teams });
            }

            const allRoles = await rolesSchema.find({ orgId: orgId }, 'name');
            const allPrivileges = await Privilege.find({ orgId: orgId }, 'name');
            const roleNames = allRoles.map(role => role.name).filter(name => !['ORGANIZATIONHEAD', 'CEO', 'HR'].includes(name));
            const privilegeNames = allPrivileges.map(priv => priv.name).filter(name => !['ULTIMATEADMIN', 'SUPERADMIN'].includes(name));

            // If employee, teamlead, or manager, send only their team details
            if (roleNames.includes(roleName) || privilegeNames.includes(privilegeName)) {
                // console.log(user);
                if (!user.teamId) {
                    return res.status(200).json({ message: "No team assigned", team: null });
                }
                const team = await teamSchema.aggregate(
                    [
                        {
                            $match: {
                                orgId: new ObjectId(orgId),
                                _id: new ObjectId(user.teamId)
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                let: {
                                    teamId: "$_id",
                                    managerIds: "$managerIds",
                                    teamLeadIds: "$teamLeadIds"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$teamId", "$$teamId"] },
                                                    {
                                                        $not: [
                                                            {
                                                                $in: [
                                                                    "$_id",
                                                                    "$$managerIds"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        $not: [
                                                            {
                                                                $in: [
                                                                    "$_id",
                                                                    "$$teamLeadIds"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "roles",
                                            localField: "roleId",
                                            foreignField: "_id",
                                            as: "roleInfo"
                                        }
                                    },
                                    {
                                        $project: {
                                            firstName: 1,
                                            lastName: 1,
                                            officeMail: 1,
                                            employeeCode: 1,
                                            personalMail: 1,
                                            roleId: 1,
                                            roleInfo: {
                                                $arrayElemAt: ["$roleInfo", 0]
                                            }
                                        }
                                    }
                                ],
                                as: "employeesInfo"
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "managerIds",
                                foreignField: "_id",
                                as: "managerInfo"
                            }
                        },
                        {
                            $lookup: {
                                from: "employees",
                                localField: "teamLeadIds",
                                foreignField: "_id",
                                as: "teamLeadInfo"
                            }
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
                            $addFields: {
                                employeesGroup: {
                                    Interns: {
                                        $filter: {
                                            input: "$employeesInfo",
                                            cond: {
                                                $eq: [
                                                    "$$this.roleInfo.name",
                                                    "INTERN"
                                                ]
                                            }
                                        }
                                    },
                                    Employees: {
                                        $filter: {
                                            input: "$employeesInfo",
                                            cond: {
                                                $eq: [
                                                    "$$this.roleInfo.name",
                                                    "EMPLOYEE"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                teamName: 1,
                                managers: {
                                    $map: {
                                        input: "$managerInfo",
                                        as: "manager",
                                        in: {
                                            _id: "$$manager._id",
                                            firstName: "$$manager.firstName",
                                            lastName: "$$manager.lastName",
                                            officeMail: "$$manager.officeMail",
                                            employeeCode:
                                                "$$manager.employeeCode",
                                            personalMail: "$$manager.personalMail"
                                        }
                                    }
                                },
                                teamLeads: {
                                    $map: {
                                        input: "$teamLeadInfo",
                                        as: "teamLead",
                                        in: {
                                            _id: "$$teamLead._id",
                                            firstName: "$$teamLead.firstName",
                                            lastName: "$$teamLead.lastName",
                                            officeMail: "$$teamLead.officeMail",
                                            employeeCode:
                                                "$$teamLead.employeeCode",
                                            personalMail:
                                                "$$teamLead.personalMail"
                                        }
                                    }
                                },
                                employeesGroup: 1,
                                createdBy: {
                                    $let: {
                                        vars: {
                                            created: {
                                                $arrayElemAt: ["$createdByInfo", 0]
                                            }
                                        },
                                        in: {
                                            _id: "$$created._id",
                                            firstName: "$$created.firstName",
                                            lastName: "$$created.lastName",
                                            officeMail: "$$created.officeMail",
                                            employeeCode:
                                                "$$created.employeeCode",
                                            personalMail: "$$created.personalMail"
                                        }
                                    }
                                }
                            }
                        }
                    ]
                );

                logger.info(`User ${req?.user?.firstName} ${req?.user?.lastName} fetched all details for their team`);
                return res.status(200).json({ team });
            }
        }
    } catch (error) {
        logger.error(`Error fetching employee teams: ${error.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Functiont to get details of people who are not in any team role wise
const getTeamData = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        const finalData = await employeeSchema.aggregate([
            {
                $match: {
                    teamId: null,
                    orgId: orgId
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleInfo"
                }
            },
            { $unwind: "$roleInfo" },
            {
                $match: {
                    "roleInfo.name": {
                        $nin: ["ORGANIZATIONHEAD"]
                    }
                }
            },
            {
                $group: {
                    _id: "$roleInfo.name",
                    employees: {
                        $push: {
                            firstName: "$firstName",
                            lastName: "$lastName",
                            employeeCode: "$employeeCode",
                            personalEmail: "$personalEmail",
                            phone: "$phone",
                            officeMail: "$officeMail",
                            _id: "$_id"
                        }
                    }
                }
            }
        ]);

        logger.info(`User ${req?.user?.firstName} ${req?.user?.lastName} fetched team data`);
        return res.status(200).json({
            message: "Team data fetched successfully",
            data: finalData
        });
    } catch (error) {
        logger.error(`Error in getTeamData: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Funtion to assign employee as team lead or manager
const changeRoleInTeam = async (req, res) => {
    try {
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;
        const { teamId, employeeId, fromRole, toRole } = req.body;

        if (!orgId || !teamId || !employeeId || !fromRole || !toRole) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Allowed roles (supporting various naming conventions)
        const validRoles = ["manager", "teamlead", "team lead", "member", "employee", "intern"];
        const normalizeRole = (role) => {
            if (!role) return "";
            role = role.toLowerCase();
            if (["manager"].includes(role)) return "manager";
            if (["teamlead", "team lead"].includes(role)) return "teamlead";
            if (["employee"].includes(role)) return "employee";
            if (["intern"].includes(role)) return "intern";
            if (["member"].includes(role)) return "member";
            return role;
        };
        const normFromRole = normalizeRole(fromRole);
        const normToRole = normalizeRole(toRole);
        logger.debug(`[changeRoleInTeam] Request: teamId=${teamId}, employeeId=${employeeId}, fromRole=${fromRole}, toRole=${toRole}`);
        if (!validRoles.includes(fromRole.toLowerCase()) || !validRoles.includes(toRole.toLowerCase())) {
            logger.error(`[changeRoleInTeam] Invalid role(s) specified: fromRole=${fromRole}, toRole=${toRole}`);
            return res.status(400).json({ message: "Invalid role(s) specified" });
        }
        if (normFromRole === normToRole) {
            logger.error(`[changeRoleInTeam] From and To roles are the same: ${normFromRole}`);
            return res.status(400).json({ message: "From and To roles are the same" });
        }

        // Fetch team and employee
        const team = await teamSchema.findOne({ _id: teamId, orgId });
        if (!team) {
            logger.error(`[changeRoleInTeam] Team not found: teamId=${teamId}`);
            return res.status(404).json({ message: "Team not found" });
        }
        const employee = await employeeSchema.findOne({ _id: employeeId, orgId }).populate('roleId');
        if (!employee) {
            logger.error(`[changeRoleInTeam] Employee not found: employeeId=${employeeId}`);
            return res.status(404).json({ message: "Employee not found" });
        }

        // Helper to check if employee is in a role
        const isInRole = (role) => {
            role = normalizeRole(role);
            if (role === "manager") return team.managerIds.map(String).includes(String(employeeId));
            if (role === "teamlead") return team.teamLeadIds.map(String).includes(String(employeeId));
            if (role === "employee") {
                return (
                    String(employee.teamId) === String(teamId) &&
                    employee.roleId && employee.roleId.name === "EMPLOYEE" &&
                    !team.managerIds.map(String).includes(String(employeeId)) &&
                    !team.teamLeadIds.map(String).includes(String(employeeId))
                );
            }
            if (role === "intern") {
                return (
                    String(employee.teamId) === String(teamId) &&
                    employee.roleId && employee.roleId.name === "INTERN" &&
                    !team.managerIds.map(String).includes(String(employeeId)) &&
                    !team.teamLeadIds.map(String).includes(String(employeeId))
                );
            }
            if (role === "member") {
                // Not in managerIds or teamLeadIds, but in team
                return (
                    String(employee.teamId) === String(teamId) &&
                    !team.managerIds.map(String).includes(String(employeeId)) &&
                    !team.teamLeadIds.map(String).includes(String(employeeId))
                );
            }
            return false;
        };

        if (!isInRole(fromRole)) {
            logger.error(`[changeRoleInTeam] Employee is not in the role: ${fromRole}`);
            logger.debug(`[changeRoleInTeam] Employee roleId: ${employee.roleId && employee.roleId.name}, teamId: ${employee.teamId}`);
            return res.status(400).json({ message: `Employee is not in the role: ${fromRole}` });
        }

        // Remove from old role in team
        if (normFromRole === "manager") {
            team.managerIds = team.managerIds.filter(id => String(id) !== String(employeeId));
        } else if (normFromRole === "teamlead") {
            team.teamLeadIds = team.teamLeadIds.filter(id => String(id) !== String(employeeId));
        }
        // No need to remove from member, as it's implicit

        // Add to new role in team
        if (normToRole === "manager") {
            if (!team.managerIds.map(String).includes(String(employeeId))) {
                team.managerIds.push(employeeId);
            }
        } else if (normToRole === "teamlead") {
            if (!team.teamLeadIds.map(String).includes(String(employeeId))) {
                team.teamLeadIds.push(employeeId);
            }
        }
        // If moving to member, just ensure not in managerIds or teamLeadIds

        // Save team
        await team.save();
        logger.debug(`[changeRoleInTeam] Team updated: managerIds=${team.managerIds}, teamLeadIds=${team.teamLeadIds}`);

        // Update employee's roleId and privilegeId in employeeSchema
        // Find the role document for the new role
        let roleQuery = { orgId };
        let privilegeName = null;
        if (normToRole === "manager") {
            roleQuery.name = "MANAGER";
            privilegeName = "ADMIN";
        } else if (normToRole === "teamlead") {
            // Support both 'TEAMLEAD' and 'TEAM LEAD'
            roleQuery.name = { $in: ["TEAMLEAD", "TEAM LEAD"] };
            privilegeName = "ADMIN";
        } else if (normToRole === "employee") {
            roleQuery.name = "EMPLOYEE";
            privilegeName = "GENERAL";
        } else if (normToRole === "intern") {
            roleQuery.name = "INTERN";
            privilegeName = "GENERAL";
        }

        const newRoleDoc = await rolesSchema.findOne(roleQuery);
        if (!newRoleDoc) {
            logger.error(`[changeRoleInTeam] Role not found: ${JSON.stringify(roleQuery)}`);
            let roleNameMsg = normToRole === "teamlead" ? "TEAMLEAD or TEAM LEAD" : roleQuery.name;
            return res.status(400).json({ message: `Role ${roleNameMsg} not found in organization` });
        }

        // Find the privilege document for the new role
        let privilegeQuery = { orgId };
        if (privilegeName) {
            privilegeQuery.name = new RegExp(`^${privilegeName}$`, 'i'); // case-insensitive match
        }
        const newPrivilegeDoc = await Privilege.findOne(privilegeQuery);
        if (!newPrivilegeDoc) {
            logger.error(`[changeRoleInTeam] Privilege not found: ${JSON.stringify(privilegeQuery)}`);
            return res.status(400).json({ message: `Privilege '${privilegeName}' not found in organization` });
        }

        await employeeSchema.updateOne(
            { _id: employeeId },
            {
                $set: {
                    roleId: newRoleDoc._id,
                    privilegeId: newPrivilegeDoc._id,
                    updatedBy: userId,
                    updatedAt: getISTDateAndTime()
                }
            }
        );
        logger.debug(`[changeRoleInTeam] Employee updated: roleId=${newRoleDoc._id}, privilegeId=${newPrivilegeDoc._id}`);

        // Fetch updated employee details for response
        const updatedEmployee = await employeeSchema.findById(employeeId);

        logger.info(`User ${req?.user?.firstName} ${req?.user?.lastName} changed role of employee ${updatedEmployee.firstName} ${updatedEmployee.lastName} from ${fromRole} to ${toRole}`);
        return res.status(200).json({
            message: `Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName} role and privilege have been changed from ${fromRole} to ${toRole} successfully`,
        });
    } catch (error) {
        logger.error(`Error in changeRoleInTeam: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Function to change an employee's team
const changeTeam = async (req, res) => {
    try {
        const { currentTeamId, employeeId, newTeamId } = req.body;
        const orgId = req?.user?.orgId;
        const userId = req?.user?._id;

        // validating fields
        if (!currentTeamId || !employeeId || !newTeamId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (currentTeamId === newTeamId) {
            return res.status(400).json({ message: "Current team and new team cannot be the same" });
        }

        // Fetch current team, new team, and employee
        const [currentTeam, newTeam, employee] = await Promise.all([
            teamSchema.findOne({ _id: currentTeamId, orgId }),
            teamSchema.findOne({ _id: newTeamId, orgId }),
            employeeSchema.findOne({ _id: employeeId, orgId })
        ]);

        if (!currentTeam) {
            return res.status(404).json({ message: "Current team not found" });
        }
        if (!newTeam) {
            return res.status(404).json({ message: "New team not found" });
        }
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        if (String(employee.teamId) !== String(currentTeamId)) {
            return res.status(400).json({ message: "Employee is not in the current team" });
        }


        // Prevent moving the only manager or only team lead out of the team
        const isManager = currentTeam.managerIds.map(String).includes(String(employeeId));
        const isTeamLead = currentTeam.teamLeadIds.map(String).includes(String(employeeId));
        if (isManager && currentTeam.managerIds.length === 1 && currentTeam.teamLeadIds.length === 0) {
            return res.status(400).json({ message: "Cannot move the only manager from the team. Assign another manager or team lead before moving." });
        }
        if (isTeamLead && currentTeam.teamLeadIds.length === 1 && currentTeam.managerIds.length === 0) {
            return res.status(400).json({ message: "Cannot move the only team lead from the team. Assign another team lead or manager before moving." });
        }

        // Remove employee from current team roles if applicable
        const wasManager = currentTeam.managerIds.map(String).includes(String(employeeId));
        const wasTeamLead = currentTeam.teamLeadIds.map(String).includes(String(employeeId));
        currentTeam.managerIds = currentTeam.managerIds.filter(id => String(id) !== String(employeeId));
        currentTeam.teamLeadIds = currentTeam.teamLeadIds.filter(id => String(id) !== String(employeeId));
        await currentTeam.save();

        // Add employee to new team, preserving manager/team lead role if applicable
        if (wasManager && !newTeam.managerIds.map(String).includes(String(employeeId))) {
            newTeam.managerIds.push(employeeId);
        }
        if (wasTeamLead && !newTeam.teamLeadIds.map(String).includes(String(employeeId))) {
            newTeam.teamLeadIds.push(employeeId);
        }
        await newTeam.save();

        // Update employee's teamId
        await employeeSchema.updateOne(
            { _id: employeeId },
            { $set: { teamId: newTeam._id, updatedBy: userId, updatedAt: getISTDateAndTime() } }
        );

        let roleMsg = '';
        if (wasManager) roleMsg += ' as Manager';
        if (wasTeamLead) roleMsg += (roleMsg ? ' and' : '') + ' as Team Lead';
        if (!roleMsg) roleMsg = ' as Member';

        logger.info(`Employee ${employee.firstName} ${employee.lastName} has been moved from team '${currentTeam.teamName}' to team '${newTeam.teamName}' by user ${req?.user?.firstName} ${req?.user?.lastName}`);
        return res.status(200).json({ message: `Employee ${employee.firstName} ${employee.lastName} has been moved to the new team${roleMsg} successfully` });
    } catch (error) {
        logger.error(`Error in changeTeam: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Function to get the teams with teamId and teamName only
const getTeamIdAndName = async (req, res) => {
    try {
        const teams = await teamSchema.find({ orgId: req.user.orgId }, { _id: 1, teamName: 1 });
        logger.info(`User ${req?.user?.firstName} ${req?.user?.lastName} fetched teamId and teamName`);
        return res.status(200).json({ message: "Teams fetched successfully", teams });
    } catch (error) {
        logger.error(`Error in getTeamIdAndName: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// const addTeamIdToEmployee = async(employeeId, teamId) =>{
//     try{
//         await employeeSchema.findByIdAndUpdate(employeeId, { teamId });
//         console.log("Team ID added to employee:", employeeId);

//     }
//     catch (error) {
//         console.error("Error in addTeamIdToEmployee:", error);
//     }   
// }

// const addShiftIdToEmployee = async(employeeId, shiftId) =>{
//     try{
//         await employeeSchema.findByIdAndUpdate(employeeId, { shiftId });
//         console.log("Shift ID added to employee:", employeeId);

//     }
//     catch (error) {
//         console.error("Error in addTeamIdToEmployee:", error);
//     }   
// }

// const getAllEmployeeIds = async () => {
//     try {
//         const employees = await employeeSchema.find({}, { _id: 1 });
//         console.log(employees);
//     } catch (error) {
//         console.error("Error in getAllEmployeeIds:", error);
//     }
// }


// const changeTeamToNull = () =>{
//     const ids = [
//   "68a5f301ef1a3bd3934bfeda",
//   "68a5fe43ef1a3bd3934c005b",
//   "68a6000bef1a3bd3934c010b",
//   "68a6028903625c6ade806797",
//   "68a6039203625c6ade8067c2",
//   "68a603e303625c6ade8067d6",
//   "68a6045503625c6ade8067ef",
//   "68a604ec03625c6ade8067fd",
//   "68a69ee6464251dbdf985488",
//   "68a6e0a702288306e0520500",
//   "68a6e18defc162502085b512",
//   "68a6e1e0efc162502085b565",
//   "68a6e282efc162502085b5b1",
//   "68a6f628d96f074e061efe73",
//   "68adf1573bef9dd60ae51398",
//   "68adf3bf3bef9dd60ae51457",
//   "68adf4933bef9dd60ae514bc"
// ]

// try {
//     ids.forEach(async(id) => {
//         await employeeSchema.findByIdAndUpdate(id, { teamId: null });
//         console.log("Team ID removed from employee:", id);
//     });
// } catch (error) {
//     console.error("Error in changeTeamToNull:", error);
// }
// }




// setTimeout(async() => {
// addTeamIdToEmployee(new ObjectId('68adf4933bef9dd60ae514bc'), new ObjectId('68ab2cc0205003b49c02da23'))
// getAllEmployeeIds()
// changeTeamToNull()
// addShiftIdToEmployee(new ObjectId('68a6045503625c6ade8067ef'), new ObjectId('68ab2cc0205003b49c02da23'))
// }, 1000);



module.exports = {
    createTeam,         // creating a team

    // getAllTeams,        // getting all teams

    deleteTeam,         // deleting a team

    updateTeam,          // updating a team

    deleteEmployeeFromTeam,         // deleting an employee from a team

    getAllDetails,          // getting all details

    getTeamData,            // getting people data who are not in any team, role wise

    changeRoleInTeam,       // changing role in a team

    changeTeam,              // changing team

    getTeamIdAndName        // getting teamId and teamName only
};