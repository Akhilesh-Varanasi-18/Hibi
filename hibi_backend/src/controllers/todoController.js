const express = require('express');
const todoSchema = require('../models/todoSchema');
const { getISTDateAndTime } = require('../utils/timeFunction');
const statusSchema = require('../models/statusSchema');
const employeeSchema = require('../models/EmployeeSchemaManagement/employeeSchema');
const logger = require('../utils/logger');
const privilegeSchema = require('../models/EmployeeSchemaManagement/privilegeSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const validateEmploees = async (employeeIds, orgId, activeStatus) => {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        throw new Error("Employee IDs must be a non-empty array");
    }
    const uniqueEmployeeIds = [...new Set(employeeIds.map(id => id.toString()))];
    const employees = await employeeSchema.find({ _id: { $in: uniqueEmployeeIds }, status: activeStatus._id, orgId }, { _id: 1 });
    if (employees.length !== uniqueEmployeeIds.length) {
        throw new Error("One or more employee IDs are invalid or inactive");
    }
};

// Function to create a new to-do item
const createToDoItem = async (req, res) => {
    try {
        const { moduleName, taskNames, employeeIds, startDate, endDate, priority } = req.body;
        const orgId = req.user.orgId; // Assuming req.user contains the authenticated user's info
        const userId = req.user._id;

        if (!moduleName || typeof moduleName !== 'string') {
            return res.status(400).json({ message: "Invalid module name" });
        }
        if (!Array.isArray(taskNames) || taskNames.length === 0 || !taskNames.every(t => typeof t === 'string' && t.trim() !== '')) {
            return res.status(400).json({ message: "Task names must be a non-empty array of strings" });
        }

        // Check for duplicate task names
        const trimmedTaskNames = taskNames.map(t => t.trim().toUpperCase());
        const uniqueTaskNames = [...new Set(trimmedTaskNames)];
        if (trimmedTaskNames.length !== uniqueTaskNames.length) {
            return res.status(400).json({ message: "Duplicate task names are not allowed" });
        }

        // Check for duplicate employee IDs
        const uniqueEmployeeIds = [...new Set(employeeIds.map(id => id.toString()))];
        if (employeeIds.length !== uniqueEmployeeIds.length) {
            return res.status(400).json({ message: "Duplicate employee IDs are not allowed" });
        }

        const activeStatus = await statusSchema.findOne({ statusType: 'ACTIVE', orgId }, { _id: 1 });

        await validateEmploees(employeeIds, orgId, activeStatus);

        // Create a new to-do item
        const newToDo = new todoSchema({
            moduleName,
            orgId,
            createdBy: userId,
            updatedBy: userId,
            todoList: taskNames.map(taskName => ({
                taskName,
                createdBy: userId
            })),
            employeesAssigned: employeeIds.map(employeeId => ({
                employeeId
            })),
            statusId: activeStatus ? activeStatus._id : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            priority: ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'LOW'
        });

        await newToDo.save();
        logger.info(`Todo created in module '${moduleName}' by ${req.user.firstName} ${req.user.lastName}`);
        return res.status(201).json({ message: "To-do item created successfully" });
    } catch (error) {
        console.error("Error creating to-do item:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to get all to-do items for the organization
const getToDoItems = async (req, res) => {
    try {
        const orgId = req.user.orgId; // Assuming req.user contains the authenticated user's info
        const userId = req.user._id;
        const isActiveStatus = await statusSchema.findOne({ statusType: 'ACTIVE', orgId }, { _id: 1 });

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
        console.log("isSuperAdmin:", isSuperAdmin);

        // Build match condition based on privilege
        let matchCondition = {
            orgId: new ObjectId(orgId),
            statusId: isActiveStatus ? isActiveStatus._id : null
        };

        // If not SUPERADMIN, show only todos where the user is assigned
        if (!isSuperAdmin) {
            // employeesAssigned is an array of objects: { employeeId: ObjectId }
            // Match any item where employeesAssigned.employeeId == current user
            matchCondition["employeesAssigned.employeeId"] = new ObjectId(userId);
            // Alternatively, we could use $elemMatch:
            // matchCondition.employeesAssigned = { $elemMatch: { employeeId: new ObjectId(userId) } };
        }

        // const matchCondition = isSuperAdmin ? { orgId: orgId, statusId: isActiveStatus ? isActiveStatus._id : null } : { orgId: orgId, statusId: isActiveStatus ? isActiveStatus._id : null, "employeesAssigned.employeeId": userId };

        const toDoItems = await todoSchema.aggregate([
            {
                $match: matchCondition
            },
            {
                $lookup: {
                    from: "employees",
                    let: { creatorId: "$createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$creatorId"] }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                officeMail: 1,
                                employeeCode: 1,
                                profileImage: 1
                            }
                        }
                    ],
                    as: "createdByInfo"
                }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { employeesAssigned: "$employeesAssigned" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$employeesAssigned.employeeId"]
                                }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                officeMail: 1,
                                employeeCode: 1,
                                profileImage: 1
                            }
                        }
                    ],
                    as: "employeesAssignedInfo"
                }
            },
            {
                $unwind: {
                    path: "$todoList",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { createdBy: "$todoList.createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$createdBy"] }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                officeMail: 1,
                                employeeCode: 1,
                                profileImage: 1
                            }
                        }
                    ],
                    as: "todoList.taskCreatedByInfo"
                }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { updatedBy: "$todoList.updatedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$updatedBy"] }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                officeMail: 1,
                                employeeCode: 1,
                                profileImage: 1
                            }
                        }
                    ],
                    as: "todoList.taskUpdatedByInfo"
                }
            },
            {
                $lookup: {
                    from: "employees",
                    let: { completedBy: "$todoList.completedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$completedBy"] }
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                officeMail: 1,
                                employeeCode: 1,
                                profileImage: 1
                            }
                        }
                    ],
                    as: "todoList.taskCompletedByInfo"
                }
            },
            {
                $addFields: {
                    "todoList.taskCreatedByInfo": { $arrayElemAt: ["$todoList.taskCreatedByInfo", 0] },
                    "todoList.taskUpdatedByInfo": { $arrayElemAt: ["$todoList.taskUpdatedByInfo", 0] },
                    "todoList.taskCompletedByInfo": { $arrayElemAt: ["$todoList.taskCompletedByInfo", 0] }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    todoList: { $push: "$todoList" },
                    moduleName: { $first: "$moduleName" },
                    priority: { $first: "$priority" },
                    startDate: { $first: "$startDate" },
                    endDate: { $first: "$endDate" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    orgId: { $first: "$orgId" },
                    statusId: { $first: "$statusId" },
                    createdBy: { $first: "$createdBy" },
                    updatedBy: { $first: "$updatedBy" },
                    createdByInfo: { $first: "$createdByInfo" },
                    employeesAssigned: { $first: "$employeesAssigned" },
                    employeesAssignedInfo: { $first: "$employeesAssignedInfo" }
                }
            },
            {
                $addFields: {
                    createdByInfo: { $arrayElemAt: ["$createdByInfo", 0] }
                }
            }
        ]);

        logger.info(`${req.user.firstName} ${req.user.lastName} fetched all the todo items`);
        return res.status(200).json({ message: "To-do items fetched successfully", toDoItems });
    } catch (error) {
        console.error("Error fetching to-do items:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to update a to-do item - the tasks or assigned employees, but not isCompleted
const updateToDoItem = async (req, res) => {
    try {
        const { toDoId, moduleName, taskUpdates, newTaskNames, employeeIds, startDate, endDate, priority, statusId } = req.body;
        const userId = req.user._id;

        if (!toDoId) {
            return res.status(400).json({ message: "To-do ID is required" });
        }

        const toDoItem = await todoSchema.findById(toDoId);
        if (!toDoItem) {
            return res.status(404).json({ message: "To-do item not found" });
        }

        // Update module name if provided
        if (moduleName && typeof moduleName === 'string' && moduleName.trim() !== '') {
            toDoItem.moduleName = moduleName.trim();
        }

        // Fix any existing tasks with null updatedBy (for legacy data)
        toDoItem.todoList.forEach(task => {
            if (!task.updatedBy) {
                task.updatedBy = task.createdBy || userId;
            }
        });

        // Update existing task names if provided
        if (Array.isArray(taskUpdates)) {
            for (const update of taskUpdates) {
                const task = toDoItem.todoList.id(update.taskId);
                if (task && typeof update.taskName === 'string' && update.taskName.trim() !== '') {
                    // Check if the new task name already exists in other tasks
                    const normalizedNewName = update.taskName.trim().toUpperCase();
                    const duplicateExists = toDoItem.todoList.some(
                        t => t._id.toString() !== update.taskId &&
                            t.taskName.trim().toUpperCase() === normalizedNewName
                    );
                    if (duplicateExists) {
                        return res.status(400).json({
                            message: `Task name "${update.taskName}" already exists in this to-do item`
                        });
                    }
                    task.taskName = update.taskName.trim();
                    task.updatedAt = getISTDateAndTime();
                    task.updatedBy = userId;
                }
            }
        }

        // Add new tasks if provided
        if (Array.isArray(newTaskNames) && newTaskNames.length > 0) {
            const validNewTasks = newTaskNames.filter(t => typeof t === 'string' && t.trim() !== '');
            if (validNewTasks.length > 0) {
                // Check for duplicates within new tasks
                const normalizedNewNames = validNewTasks.map(t => t.trim().toUpperCase());
                const uniqueNewNames = [...new Set(normalizedNewNames)];
                if (normalizedNewNames.length !== uniqueNewNames.length) {
                    return res.status(400).json({ message: "Duplicate task names in new tasks are not allowed" });
                }

                // Check if any new task name already exists in existing tasks
                const existingTaskNames = toDoItem.todoList.map(t => t.taskName.trim().toUpperCase());
                const duplicateInExisting = normalizedNewNames.find(newName => existingTaskNames.includes(newName));
                if (duplicateInExisting) {
                    const originalName = validNewTasks[normalizedNewNames.indexOf(duplicateInExisting)];
                    return res.status(400).json({
                        message: `Task name "${originalName}" already exists in this to-do item`
                    });
                }

                const newTasks = validNewTasks.map(taskName => ({
                    taskName: taskName.trim(),
                    isCompleted: false,
                    completedAt: null,
                    completedBy: null,
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: getISTDateAndTime(),
                    updatedAt: getISTDateAndTime()
                }));
                toDoItem.todoList.push(...newTasks);
            }
        }

        // Update assigned employees if provided
        if (Array.isArray(employeeIds)) {
            toDoItem.employeesAssigned = employeeIds.map(employeeId => ({ employeeId }));
        }

        // Update startDate, endDate, and priority if provided
        if (startDate) {
            toDoItem.startDate = new Date(startDate);
        }
        if (endDate) {
            toDoItem.endDate = new Date(endDate);
        }
        if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
            toDoItem.priority = priority;
        }

        if (statusId) {
            toDoItem.statusId = statusId;
        }
        toDoItem.updatedAt = getISTDateAndTime();
        toDoItem.updatedBy = userId;

        await toDoItem.save();
        logger.info(`Todo in module '${toDoItem.moduleName}' was updated by ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "To-do item updated successfully" });
    } catch (error) {
        console.error("Error updating to-do item:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to mark a task as completed
const markTaskAsCompleted = async (req, res) => {
    try {
        const { toDoId, taskId, toggle } = req.body;
        const userId = req.user._id;
        const orgId = req.user.orgId;

        if (!toDoId || !taskId || toggle === undefined) {
            return res.status(400).json({ message: "To-do ID, Task ID, and toggle status are required" });
        }

        const toDoItem = await todoSchema.findById(toDoId);
        if (!toDoItem) {
            return res.status(404).json({ message: "To-do item not found" });
        }

        const task = toDoItem.todoList.id(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found in the to-do item" });
        }

        const userPrivilege = await privilegeSchema.findOne({
            orgId: orgId,
            _id: req.user.privilegeId
        });

        if (!userPrivilege) {
            return res.status(403).json({ error: 'User privilege not found' });
        }

        // Check if user is SUPERADMIN
        const isSuperAdmin = userPrivilege.name?.toString().toUpperCase() === 'SUPERADMIN';

        if (!isSuperAdmin) {
            const isAssigned = toDoItem.employeesAssigned.some(e => e.employeeId.toString() === userId.toString());
            if (!isAssigned) {
                return res.status(403).json({ message: "You are not authorized to update this task" });
            }
        }

        task.isCompleted = toggle;
        if (toggle) {
            task.completedAt = getISTDateAndTime();
            task.completedBy = userId;
        } else {
            task.completedAt = null;
            task.completedBy = null;
        }
        task.updatedAt = getISTDateAndTime();
        task.updatedBy = userId;

        toDoItem.updatedAt = getISTDateAndTime();
        toDoItem.updatedBy = userId;

        await toDoItem.save();
        logger.info(`Task '${task.taskName}' in todo '${toDoItem.moduleName}' was marked as ${toggle ? 'completed' : 'incomplete'} by ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: `Task marked as ${toggle ? 'completed' : 'incomplete'} successfully` });
    } catch (error) {
        console.error("Error marking task as completed:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to delete a specific task from a to-do item
const deleteTask = async (req, res) => {
    try {
        const { toDoId, taskId } = req.body;
        const userId = req.user._id;

        if (!toDoId || !taskId) {
            return res.status(400).json({ message: "To-do ID and Task ID are required" });
        }

        const toDoItem = await todoSchema.findById(toDoId);
        if (!toDoItem) {
            return res.status(404).json({ message: "To-do item not found" });
        }

        const task = toDoItem.todoList.id(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found in the to-do item" });
        }

        // Check if this is the last task
        if (toDoItem.todoList.length === 1) {
            return res.status(400).json({ message: "Cannot delete the last task. Delete the entire to-do item instead." });
        }

        // Remove the task from the array
        task.deleteOne();

        toDoItem.updatedAt = getISTDateAndTime();
        toDoItem.updatedBy = userId;

        await toDoItem.save();
        logger.info(`Task '${task.taskName}' in todo '${toDoItem.moduleName}' was deleted by ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Function to delete a to-do item
const deleteToDoItem = async (req, res) => {
    try {
        const { toDoId } = req.params;

        if (!toDoId) {
            return res.status(400).json({ message: "To-do ID is required" });
        }

        const toDoItem = await todoSchema.findById(toDoId);
        if (!toDoItem) {
            return res.status(404).json({ message: "To-do item not found" });
        }

        await todoSchema.deleteOne({ _id: toDoId });
        logger.info(`Todo '${toDoItem.moduleName}' was deleted by ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "To-do item deleted successfully" });
    } catch (error) {
        console.error("Error deleting to-do item:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// Funtion to get task statistics
const getTaskStatistics = async (req, res) => {
    try {
        const orgId = req.user.orgId;

        const { limit, fromDate, toDate } = req.body;

        const fromDateStart = new Date(fromDate);
        fromDateStart.setUTCHours(0, 0, 0, 0);

        const toDateEnd = new Date(toDate);
        toDateEnd.setUTCHours(23, 59, 59, 999);

        const data = await todoSchema.aggregate(
            [
                {
                    $match: {
                        orgId: orgId,
                        startDate: { $gte: fromDateStart },
                        endDate: { $lte: toDateEnd },
                        "todoList.isCompleted": true
                    }
                },
                {
                    $unwind: "$todoList"
                },
                {
                    $match: {
                        "todoList.isCompleted": true
                    }
                },
                {
                    $group: {
                        _id: "$todoList.completedBy",
                        completedTasksCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { completedTasksCount: -1 }
                },
                {
                    $limit: limit || 10
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "_id",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                {
                    $unwind: "$employee"
                },
                {
                    $project: {
                        completedTasksCount: 1,
                        employeeId: "$employee._id",
                        employeeCode: "$employee.employeeCode",
                        name: {
                            $concat: ["$employee.firstName", " ", "$employee.lastName"]
                        },
                        profileImage: "$employee.profileImage"
                    }
                }
            ]
        );

        return res.status(200).json({ message: "Task statistics fetched successfully", data });

    } catch (error) {
        console.error("Error fetching task statistics:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};


module.exports = {
    createToDoItem,     // Function to create a new to-do item
    getToDoItems,       // Function to get all to-do items
    updateToDoItem,     // Function to update an existing to-do item
    markTaskAsCompleted, // Function to mark a task as completed
    deleteTask,         // Function to delete a specific task from a to-do item
    deleteToDoItem,      // Function to delete a to-do item
    getTaskStatistics   // Function to get task statistics
};