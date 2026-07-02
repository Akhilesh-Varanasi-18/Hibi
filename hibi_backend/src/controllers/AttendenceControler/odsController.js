const statusTypeSchema = require("../../models/statusSchema");
const { getNotifyToData } = require("./thumbRequestController");
const ODSchema = require("../../models/AttendenceSchemaManagement/odRequestSchema");
const {
  sendNotificationtoTokens,
} = require("../FirebaseNotifications/firebaseMessageingTockenController");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const {
  getNotificationToken,
} = require("../LeaveContollerManagement/leaveRequestController");
const mongoose = require("mongoose");
const odSchema = require("../../models/odSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const ObjectId = mongoose.Types.ObjectId;
const logger = require("../../utils/logger");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");

//get OD Data
const getODData = async (odRequestId) => {
  try {
    const odRequest = await ODSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(odRequestId),
        },
      },
      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "Status",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "notifyTo",
          foreignField: "_id",
          as: "notifyTo",
        },
      },
      {
        $project: {
          fromDate: 1,
          toDate: 1,
          totalDays: 1,
          actualWorkingDays: 1,
          reason: 1,
          employee: {
            $concat: [
              { $first: "$employee.firstName" },
              " ",
              { $first: "$employee.lastName" },
            ],
          },
          status: { $first: "$Status.statusType" },
        },
      },
    ]);

    if (!odRequest || odRequest.length === 0) {
      throw new Error("OD request not found");
    }

    // console.log("OD Request Data:", odRequest[0]);
    return odRequest[0];
  } catch (error) {
    console.error("Error getting OD data:", error);
    throw error;
  }
};

// Optimized addOdsToEmployee function

const addOdsToEmployee = async (employeeId, totalDays, odRequestId, orgId) => {
  try {
    console.log("Comming to add ods function");
    if (!employeeId || !totalDays || !odRequestId || !orgId) {
      return { status: false, message: "Missing required parameters" };
    }

    const employee = await employeeSchema.findOne({ _id: employeeId, orgId });
    if (!employee) {
      return { status: false, message: "Employee not found" };
    }

    const activeStatus = await statusTypeSchema.findOne(
      {
        orgId,
        statusType: "ACTIVE",
      },
      { _id: 1 }
    );

    if (!activeStatus) {
      return { status: false, message: "Active status not found" };
    }

    const odDocs = Array.from({ length: totalDays * 2 }, () => ({
      orgId,
      employeeId,
      statusId: activeStatus._id,
      odRequestId,
    }));

    const result = await odSchema.insertMany(odDocs);
    console.log(`Inserted ${result.length / 2} OD  for employee ${employeeId}`);

    return { status: true, message: "OD count updated successfully" };
  } catch (error) {
    console.error("Error updating OD count:", error);
    return { status: false, message: error.message };
  }
};

// Function to create a new OD request
const createODRequest = async (req, res) => {
  try {
    const { fromDate, toDate, reason, totalDays } = req.body;
    const employeeId = req.userId;
    const orgId = req?.user?.orgId;

    if (!fromDate || !toDate || !reason || !totalDays) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res
        .status(400)
        .json({ message: "From date cannot be greater than To date" });
    }

    const [pendingStatus, rejectedStatus] = await Promise.all([
      statusTypeSchema.findOne({ orgId, statusType: "PENDING" }),
      statusTypeSchema.findOne({ orgId, statusType: "REJECTED" }),
    ]);

    // console.log("Pending Status:", pendingStatus);
    // console.log("Rejected Status:", rejectedStatus);

    if (!pendingStatus || !rejectedStatus) {
      return res.status(500).json({
        message: "Pending or Rejected status not found. Please contact admin",
      });
    }

    const alreadyExists = await ODSchema.findOne({
      orgId,
      employeeId,
      fromDate,
      toDate,
      statusId: { $ne: rejectedStatus._id },
    });

    // console.log("Already Exists Check:", alreadyExists);

    if (alreadyExists) {
      return res.status(400).json({
        message: "OD request already exists for the given date range",
      });
    }

    const requiredData = await getNotifyToData(
      req?.user?.teamId,
      req?.user?.roleId,
      req?.user?.orgId
    );

    if (!requiredData.status) {
      return res.status(500).json({
        message: "Failed to get notifyTo data",
        error: requiredData.message,
      });
    }

    if (
      !requiredData.data ||
      !requiredData.data.notifyTo ||
      requiredData.data.notifyTo.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "No one to notify, Please contact Admin" });
    }

    const newODRequest = new ODSchema({
      orgId,
      employeeId,
      fromDate,
      toDate,
      reason,
      totalDays,
      statusId: pendingStatus._id,
      notifyTo: requiredData.data.notifyTo,
    });

    await newODRequest.save();

    logger.info(`OD request with reason '${reason}' created by user ${req.user.firstName} ${req.user.lastName}`);
    const data = await getODData(newODRequest._id);

    const title = `${data.employee}'s OD Request from ${req.user.firstName}`;
    const body = `${data.employee} OD request has been forwarded to You. Please review it.`;
    const response = await sendNotificationtoTokens(
      requiredData.data.tokens,
      title,
      body,
      data
    );

    if (!response.success) {
      console.warn("Failed to send notification:", response.error);
    } else {
      console.log(
        `Notification sent successfully to ${requiredData.data.notifyTo}`,
        data
      );
      console.log("This is Title", title);
      console.log("This is Body", body);
    }

    return res.status(201).json({ message: "OD request created successfully" });
  } catch (err) {
    console.error("Error creating OD request:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Function to process a OD request (approve/reject/Forward)
const processODRequest = async (req, res) => {
  try {
    const { ODRequestId, statusId, actionReason } = req.body;

    // console.log(req.body)

    const employeeId = req?.user?._id;

    // Validate required fields
    if (!ODRequestId || !statusId) {
      return res.status(400).json({
        message: "OD request ID and status ID are required",
      });
    }

    // Get the Pending status ID
    const PendingstatusId = await statusTypeSchema.findOne(
      { statusType: "PENDING" },
      { _id: 1 }
    );

    const [status, ODRequest, superAdmin] = await Promise.all([
      statusTypeSchema.findById({ _id: statusId }, { statusType: 1 }),
      ODSchema.findById(ODRequestId),
      privilegeSchema.find({ orgId: req?.user?.orgId, name: "SUPERADMIN" }, { _id: 1 }),
    ]);

    const statusTyes = {
      ACCEPTED: "ACCEPTED",
      REJECTED: "REJECTED",
      ESCALATED: "ESCALATED",
    };

    if (
      !status ||
      !status.statusType ||
      !Object.values(statusTyes).includes(status.statusType)
    ) {
      return res.status(400).json({ message: "Invalid status ID" });
    }

    if (!ODRequest) {
      return res.status(404).json({ message: "OD request not found" });
    }

    if (!ODRequest.notifyTo.includes(employeeId) && req.user.privilegeId.toString() !== superAdmin[0]._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to process this request" });
    }

    const actionList = {
      actionedBy: employeeId,
      statusId,
      actionReason: actionReason || "",
      createdAt: getISTDateAndTime(),
    };

    ODRequest.approvalList.push(actionList);

    ODRequest.statusId = statusId;
    ODRequest.actionReason = actionReason;
    ODRequest.actionedBy = employeeId;
    ODRequest.actionedAt = getISTDateAndTime();

    if (
      status.statusType === statusTyes.ACCEPTED ||
      status.statusType === statusTyes.REJECTED
    ) {
      if (status.statusType === statusTyes.ACCEPTED) {
        //! Need to update the od count

        const addOds = await addOdsToEmployee(
          ODRequest.employeeId,
          ODRequest.totalDays,
          ODRequest._id,
          ODRequest.orgId
        );
        if (!addOds.status) {
          return res.status(500).json({
            message: "Error while updating OD count",
            error: addOds.message,
          });
        }
      }
      const [data, tokens] = await Promise.all([
        getODData(ODRequest._id),
        getNotificationToken(ODRequest.employeeId),
      ]);

      const title = `Update On Your OD Request`;
      const body = `Your OD Request has been ${status.statusType}. Please review it.`;
      const response = await sendNotificationtoTokens(tokens, title, body, data);
      if (!response.success) {
        console.warn("Failed to send notification:", response.error);
      } else {
        console.log(`Notification sent successfully`, data);
        console.log("This is Title", title);
        console.log("This is Body", body);
      }
    } else if (status.statusType === statusTyes.ESCALATED) {
      const requiredData = await getNotifyToData(
        req?.user?.teamId,
        req?.user?.roleId,
        req?.user?.orgId
      );

      if (!requiredData.status) {
        return res.status(500).json({
          message: "Error While Notifying ",
          error: requiredData.message,
        });
      }

      // check if i am sending notify to the same employee who raised the request or not
      if (ODRequest.employeeId.toString() in requiredData.data.notifyTo) {
        return res.status(400).json({
          message:
            "You cannot forward the request to the same employee who raised it.",
        });
      }

      //filtering the notifyTo array to remove the employees who have already actioned on the request except the last one
      const approvalIds = ODRequest.approvalList
        .map((item, index) => {
          if (index === ODRequest.approvalList.length - 1) return;
          return String(item.actionedBy);
        })
        .filter(Boolean);

      const filteredNotifyTo = requiredData.data.notifyTo.filter(
        (id) => !approvalIds.includes(String(id))
      );

      if (filteredNotifyTo && filteredNotifyTo.length === 0) {
        return res
          .status(400)
          .json({ message: "No one to notify, Please contact Admin" });
      }

      ODRequest.notifyTo = filteredNotifyTo;

      const data = await getODData(ODRequest._id);
      const title = `${data.employee}'s OD Request Forwarded from ${req.user.firstName} to You`;
      const body = `${data.employee}'s OD request has been forwarded to You. Please review it.`;

      const response = await sendNotificationtoTokens(
        requiredData.data.tokens,
        title,
        body,
        data
      );
      if (!response.success) {
        console.warn("Failed to send notification:", response.error);
        // res.status(500).json({
        //   message: "Failed to send the Notification for this request",
        // });
      } else {
        console.log(
          `Notification sent successfully to ${requiredData.data.notifyTo}`,
          data
        );
        console.log("This is Title", title);
        console.log("This is Body", body);
      }
    } else {
      console.warn(`Unexpected status type: ${status.statusType} ${statusId}`);
      return res.status(400).json({ message: "Invalid status type" });
    }

    await ODRequest.save();
    logger.info(`OD request with ID '${ODRequestId}' processed by user ${req.user.firstName} ${req.user.lastName} with status ${status.statusType}`);
    return res
      .status(200)
      .json({ message: "OD  request processed successfully" });
  } catch (error) {
    console.error("Error while processing OD request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get OD requests of the logged-in employee
const getEmployeeODRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    const employeeId = req?.user?._id;

    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // Validate date range
    if (
      fromDateStart &&
      toDateEnd &&
      new Date(fromDateStart) > new Date(toDateEnd)
    ) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const ODRequests = await ODSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          $or: [
            {
              fromDate: {
                $lte: toDateEnd,
              },
              toDate: {
                $gte: fromDateStart,
              },
            },
            {
              createdAt: {
                $gte: fromDateStart,
                $lte: toDateEnd,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "Status",
          pipeline: [{ $project: { _id: 0, statusType: 1 } }],
        },
      },
      {
        $lookup: {
          from: "employees",
          let: { notifyIds: "$notifyTo" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$notifyIds"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullName: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
          as: "notifyToInfo",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "actionedByInfo",
          pipeline: [
            {
              $project: {
                _id: 0,
                fullName: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          fromDate: 1,
          toDate: 1,
          totalDays: 1,
          reason: 1,
          actionReason: 1,
          Status: { $first: "$Status.statusType" },
          notifyTo: "$notifyToInfo.fullName",
          actionedBy: {
            $first: "$actionedByInfo.fullName",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      message: "Employees OD Requests Data fetched Successfully",
      data: ODRequests,
    });
  } catch (error) {
    console.error("Error fetching employee OD requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get OD requests that require action from the logged-in employee
const getActionRequiredODS = async (req, res) => {
  try {
    const employeeId = req?.user?._id;
    const { fromDate, toDate } = req.body;

    // console.log("fromDate and toDate:", fromDate, toDate);
    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "Both fromDate and toDate are required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log("Parsed fromDate and toDate:", fromDateStart, toDateEnd);

    // Validate date range
    if (
      fromDateStart &&
      toDateEnd &&
      new Date(fromDateStart) > new Date(toDateEnd)
    ) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const pendingRequests = await ODSchema.aggregate([
      {
        $match: {
          notifyTo: new ObjectId(employeeId),
          createdAt: { $gte: fromDateStart, $lte: toDateEnd },
          fromDate: { $lte: toDateEnd },
          toDate: { $gte: fromDateStart },
        },
      },

      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "Status",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $project: {
          fromDate: 1,
          toDate: 1,
          totalDays: 1,
          reason: 1,
          actionReason: 1,
          createdAt: 1,
          updatedAt: 1,
          Status: { $first: "$Status.statusType" },
          employee: {
            $concat: [
              { $first: "$employee.firstName" },
              " ",
              { $first: "$employee.lastName" },
            ],
          },
        },
      },
    ]);

    // console.log("Pending Requests:", pendingRequests);

    return res.status(200).json({
      message: "OD actions fetched Successfully",
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching OD actions:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get OD request flow
const getODRequestFlow = async (req, res) => {
  try {
    const { odRequestId } = req.params;

    // Validate OD request ID
    if (!odRequestId || !mongoose.Types.ObjectId.isValid(odRequestId)) {
      return res.status(400).json({ message: "Invalid OD request ID" });
    }

    // Find the OD request
    const ODRequestFlow = await ODSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(odRequestId),
        },
      },
      {
        $unwind: "$approvalList",
      },
      {
        $lookup: {
          from: "employees",
          localField: "approvalList.actionedBy",
          foreignField: "_id",
          as: "approver",
        },
      },
      {
        $unwind: "$approver",
      },
      {
        $lookup: {
          from: "statustypes",
          localField: "approvalList.statusId",
          foreignField: "_id",
          as: "status",
        },
      },
      {
        $unwind: "$status",
      },
      {
        $project: {
          _id: 0,
          approverName: {
            $concat: ["$approver.firstName", " ", "$approver.lastName"],
          },
          status: "$status.statusType",
          actionReason: "$approvalList.actionReason",
          sendAt: "$approvalList.createdAt",
          actionAt: "$approvalList.updatedAt",
        },
      },
    ]);

    return res.status(200).json({
      message: "OD request flow fetched successfully",
      data: ODRequestFlow,
    });
  } catch (error) {
    console.error("Error fetching OD request flow:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// function  to get All OD requests with date filter
const getAllODRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;


    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // Validate date range
    if (
      fromDateStart &&
      toDateEnd &&
      new Date(fromDateStart) > new Date(toDateEnd)
    ) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const ODRequests = await ODSchema.aggregate([
      {
        $match: {
          $or: [
            {
              fromDate: {
                $lte: toDateEnd,
              },
              toDate: {
                $gte: fromDateStart,
              },
            },
            {
              createdAt: {
                $gte: fromDateStart,
                $lte: toDateEnd,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "Status",
          pipeline: [{ $project: { _id: 0, statusType: 1 } }],
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "requestedByInfo",
        },
      },
      {
        $match: {
          "requestedByInfo.orgId": new ObjectId(req?.user?.orgId),
        },
      },
      {
        $lookup: {
          from: "employees",
          let: { notifyIds: "$notifyTo" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$notifyIds"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullName: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
          as: "notifyToInfo",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "actionedByInfo",
          pipeline: [
            {
              $project: {
                _id: 0,
                fullName: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          fromDate: 1,
          toDate: 1,
          totalDays: 1,
          reason: 1,
          actionReason: 1,
          requestedBy: {
            $concat: [
              { $first: "$requestedByInfo.firstName" },
              " ",
              { $first: "$requestedByInfo.lastName" },
            ],
          },
          Status: { $first: "$Status.statusType" },
          notifyTo: "$notifyToInfo.fullName",
          actionedBy: {
            $first: "$actionedByInfo.fullName",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      message: "Employees OD Requests Data fetched Successfully",
      "No. of Records": ODRequests.length,
      data: ODRequests,
    });
  } catch (error) {
    console.error("Error fetching employee OD requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createODRequest,
  processODRequest,
  getEmployeeODRequests,
  getActionRequiredODS,
  getODRequestFlow,
  getAllODRequests,
};
