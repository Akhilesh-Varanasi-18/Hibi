const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const firebaseMessagingTokenSchema = require("../../models/firebaseMessageingTockenSchema");
const statusTypeSchema = require("../../models/statusSchema");
const permissionSchema = require("../../models/PermissionSchemaManagement/permissionRequestSchema");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { getISTDateAndTime } = require("../../utils/timeFunction");
const {
  sendNotificationtoTokens,
} = require("../FirebaseNotifications/firebaseMessageingTockenController");
const {
  getNotifyToData,
} = require("../../controllers/AttendenceControler/thumbRequestController");
const statusSchema = require("../../models/statusSchema");
const { messaging } = require("firebase-admin");
const temporaryAssignmentSchema = require("../../models/LeaveSchemaManagement/temporaryAssignmentSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");

const holidaysSchema = require("../../models/AttendenceSchemaManagement/holidaysSchema");
const CLSchema = require("../../models/clSchema");
const ODSchema = require("../../models/odSchema");
const leaveTypeSchema = require("../../models/LeaveSchemaManagement/leaveTypesSchema");
const leaveConsiderationType = require("../../models/LeaveSchemaManagement/leaveConsidarationSchema");
const dailyAttendenceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const workFromHomeRequestSchema = require("../../models/PermissionSchemaManagement/workFromHomeSchema");
const workFromHomeSchema = require("../../models/PermissionSchemaManagement/workFromHomeSchema");
const logger = require("../../utils/logger");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");

// Function to get the WFH Request Data to send Notification
const getWFHData = async (wfhRequestId) => {
  try {
    const wfhRequest = await workFromHomeRequestSchema.aggregate([
      {
        $match: {
          _id: wfhRequestId,
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
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          wfhReason: 1,
          createdAt: 1,
          updatedAt: 1,
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

    if (!wfhRequest) {
      throw new Error("WFH request not found");
    }

    return wfhRequest[0];
  } catch (error) {
    console.error("Error getting WFH data:", error);
    throw error;
  }
};

// Function to get the Notification Token
const getNotificationToken = async (employeeId) => {
  try {
    const tokens = await firebaseMessagingTokenSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
        },
      },
      {
        $group: {
          _id: null,
          tokens: {
            $push: "$token",
          },
        },
      },
      {
        $project: {
          _id: 0,
          tokens: 1,
        },
      },
    ]);
    return tokens?.[0]?.tokens;
  } catch (error) {
    console.error("Error getting notification token:", error);
    throw error;
  }
};

// Function to change GMT to IST
const changeGTMtoIST = (date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const res = new Date(date.getTime() + istOffset);
  return res;
};

// Function to add a new WFH request
const addWFHRequest = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      isHalfDay,
      halfDayPeriod,
      wfhReason,
      totalDays,
    } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !wfhReason || !totalDays) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const employeeId = req?.user?._id;
    const orgId = req?.user?.orgId;

    if (new Date(startDate) > new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Start date cannot be after end date" });
    }

    const startDateOnly = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth(),
      new Date(startDate).getDate()
    );

    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    if (startDateOnly < monthStart) {
      return res.status(400).json({
        message: `You are not able to select the past date of ${startDate}.`,
      });
    }

    if (isHalfDay && !halfDayPeriod) {
      return res
        .status(400)
        .json({ message: "Half day period is required for half day WFH" });
    }

    const fromDateStrat = new Date(startDate);
    fromDateStrat.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    const [
      acceptedStatusId,
      rejectedStatusId,
      cancelledStatusId,
      PendingstatusId,
    ] = await Promise.all([
      statusTypeSchema.findOne({ orgId, statusType: "ACCEPTED" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "REJECTED" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "CANCELLED" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "PENDING" }, { _id: 1 }),
    ]);

    if (
      !acceptedStatusId ||
      !rejectedStatusId ||
      !cancelledStatusId ||
      !PendingstatusId
    ) {
      return res.status(400).json({
        message: "Accepted/Rejected/Cancelled/Pending Type not found",
      });
    }

    const [
      existingWFHRequests,
      existingLeaveRequest,
      existingPermissionRequests,
      existingAttendenceRecord,
    ] = await Promise.all([
      workFromHomeRequestSchema.find({
        employeeId,
        statusId: {
          $nin: [
            new ObjectId(rejectedStatusId._id),
            new ObjectId(cancelledStatusId._id),
          ],
        },
        startDate: { $lte: toDateEnd },
        endDate: { $gte: fromDateStrat },
      }),
      leaveRequestSchema.find({
        employeeId,
        statusId: {
          $nin: [
            new ObjectId(rejectedStatusId._id),
            new ObjectId(cancelledStatusId._id),
          ],
        },
        startDate: { $lte: toDateEnd },
        endDate: { $gte: fromDateStrat },
      }),
      statusTypeSchema.findOne({ statusType: "PENDING" }, { _id: 1 }),
      permissionSchema.find({
        employeeId,
        statusId: {
          $nin: [
            new ObjectId(rejectedStatusId._id),
            new ObjectId(cancelledStatusId._id),
          ],
        },
        startDate: { $lte: toDateEnd },
        endDate: { $gte: fromDateStrat },
      }),
      dailyAttendenceSchema.find({
        employeeId,
        $or: [
          { logInTime: { $gte: fromDateStrat, $lte: toDateEnd } },
          { logOutTime: { $gte: fromDateStrat, $lte: toDateEnd } },
        ],
      }),
    ]);

    // Check for existing WFH requests
    if (existingWFHRequests.length > 0) {
      return res.status(400).json({
        message: "WFH request already exists for the specified period",
      });
    }

    if (existingLeaveRequest.length > 0) {
      return res.status(400).json({
        message: "Leave request already exists for the specified period",
      });
    }

    if (existingPermissionRequests.length > 0) {
      return res.status(400).json({
        message: "Permission Request already exists for the specified period",
      });
    }

    if (isHalfDay === false && existingAttendenceRecord.length > 0) {
      return res.status(400).json({
        message:
          "You have already marked your attendance for the specified period",
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

    const wfhRequest = new workFromHomeRequestSchema({
      orgId: req?.user?.orgId,
      employeeId,
      notifyTo: requiredData.data.notifyTo,
      startDate: fromDateStrat,
      endDate: toDateEnd,
      wfhReason,
      totalDays,
      isHalfDay,
      statusId: PendingstatusId._id,
    });

    if (halfDayPeriod) {
      wfhRequest.halfDayPeriod = halfDayPeriod;
    }

    await wfhRequest.save();

    logger.info(
      `WFH request with reason '${wfhReason}' created by user ${req.user.firstName} ${req.user.lastName}`
    );
    const data = await getWFHData(wfhRequest._id);

    const title = `${data.employee}'s WFH Request from ${req.user.firstName}`;
    const body = `${data.employee} WFH request has been forwarded to You. Please review it.`;
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
    }

    return res.status(201).json({ message: "WFH request added successfully" });
  } catch (error) {
    console.error("Error adding WFH request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to process a wfh request (approve/reject/Forward)
const processWFHRequest = async (req, res) => {
  try {
    const { wfhRequestId, statusId, actionReason } = req.body;

    const employeeId = req?.user?._id;

    // Validate required fields
    if (!wfhRequestId || !statusId) {
      return res.status(400).json({
        message: "WFH request ID and status ID are required",
      });
    }

    const [status, wfhRequest, superAdmin] = await Promise.all([
      statusTypeSchema.findById({ _id: statusId }, { statusType: 1 }),
      workFromHomeRequestSchema.findById(wfhRequestId),
      privilegeSchema.find(
        { orgId: req?.user?.orgId, name: "SUPERADMIN" },
        { _id: 1 }
      ),
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

    if (!wfhRequest) {
      return res.status(404).json({ message: "WFH request not found" });
    }

    if (
      !wfhRequest.notifyTo.includes(employeeId) &&
      req.user.privilegeId.toString() !== superAdmin[0]._id.toString()
    ) {
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

    wfhRequest.approvalList.push(actionList);

    wfhRequest.statusId = statusId;
    wfhRequest.actionReason = actionReason;
    wfhRequest.actionedBy = employeeId;
    wfhRequest.actionedAt = getISTDateAndTime();

    if (
      status.statusType === statusTyes.ACCEPTED ||
      status.statusType === statusTyes.REJECTED
    ) {
      wfhRequest.notifyTo = [employeeId];

      const [data, tokens] = await Promise.all([
        getWFHData(wfhRequest._id),
        getNotificationToken(wfhRequest.employeeId),
      ]);

      const title = `Update On Your WFH Request`;
      const body = `Your WFH Request has been ${status.statusType}. Please review it.`;
      const response = await sendNotificationtoTokens(
        tokens,
        title,
        body,
        data
      );
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
      if (wfhRequest.employeeId.toString() in requiredData.data.notifyTo) {
        return res.status(400).json({
          message:
            "You cannot forward the request to the same employee who raised it.",
        });
      }

      const approvalIds = wfhRequest.approvalList
        .map((item, index) => {
          if (index === wfhRequest.approvalList.length - 1) return;
          return String(item.actionedBy);
        })
        .filter(Boolean);

      const filteredNotifyTo = requiredData.data.notifyTo.filter(
        (id) => !approvalIds.includes(String(id))
      );

      //checking if after filtering the array is empty or not
      if (filteredNotifyTo && filteredNotifyTo.length === 0) {
        return res
          .status(400)
          .json({ message: "No one to notify, Please contact Admin" });
      }

      wfhRequest.notifyTo = filteredNotifyTo;

      const data = await getWFHData(wfhRequest._id);
      const title = `${data.employee}'s WFH Request Forwarded from ${req.user.firstName} ${req.user.lastName} to You`;
      const body = `${data.employee}'s WFH request has been forwarded to You. Please review it.`;

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
    } else {
      console.warn(`Unexpected status type: ${status.statusType} ${statusId}`);
      return res.status(400).json({ message: "Invalid status type" });
    }

    await wfhRequest.save();
    logger.info(
      `WFH request with ID '${wfhRequestId}' processed by user ${req.user.firstName} ${req.user.lastName} with status ${status.statusType}`
    );
    return res
      .status(200)
      .json({ message: "WFH request processed successfully" });
  } catch (error) {
    console.error("Error while processing WFH request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get WFH requests for an employee within a date range
const getEmployeWFHRequests = async (req, res) => {
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

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

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

    const wfhRequests = await workFromHomeRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          $or: [
            {
              startDate: {
                $lte: toDateEnd,
              },
              endDate: {
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
          pipeline: [
            {
              $project: { _id: 0, statusType: 1 },
            },
          ],
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
          as: "actionByInfo",
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
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          wfhReason: 1,
          isHalfDay: 1,
          actionReason: 1,
          halfDayPeriod: 1,
          createdAt: 1,
          updatedAt: 1,
          Status: { $first: "$Status.statusType" },
          notifyTo: "$notifyToInfo.fullName",
          actionedBy: {
            $first: "$actionByInfo.fullName",
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Employees WFH Requests Data feteched Successfully",
      data: wfhRequests,
    });
  } catch (error) {
    console.error("Error fetching employee WFH requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get WFH requests that require action from the logged-in employee
const getActionRequiredWFHS = async (req, res) => {
  try {
    const employeeId = req?.user?._id;
    const { fromDate, toDate } = req.body;

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

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

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

    const pendingRequests = await workFromHomeRequestSchema.aggregate([
      {
        $match: {
          notifyTo: new ObjectId(employeeId),
          $or: [
            {
              startDate: {
                $lte: toDateEnd,
              },
              endDate: {
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
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          wfhReason: 1,
          isHalfDay: 1,
          halfDayPeriod: 1,
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

    return res.status(200).json({
      message: "WFH Requests Fetched Successfully",
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching WFH actions:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get WFH request flow
const getWFHRequestFlow = async (req, res) => {
  try {
    const { wfhRequestId } = req.params;

    // Validate WFH request ID
    if (!wfhRequestId || !mongoose.Types.ObjectId.isValid(wfhRequestId)) {
      return res.status(400).json({ message: "Invalid WFH request ID" });
    }

    // Find the WFH request
    const wfhRequestFlow = await workFromHomeSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(wfhRequestId),
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
      message: "WFH request flow fetched successfully",
      data: wfhRequestFlow,
    });
  } catch (error) {
    console.error("Error fetching WFH request flow:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to cancel a WFH request
const cancelWFHRequest = async (req, res) => {
  try {
    const { wfhRequestId } = req.body;
    const employeeId = req?.user?._id;

    if (!wfhRequestId) {
      return res.status(400).json({ message: "WFH request ID is required" });
    }

    const [wfhRequest, acceptedStatus, superAdmin] = await Promise.all([
      workFromHomeRequestSchema.findOne({ _id: wfhRequestId }),
      statusTypeSchema.findOne(
        { orgId: req?.user?.orgId, statusType: "ACCEPTED" },
        { _id: 1 }
      ),
      privilegeSchema.findOne(
        { orgId: req?.user?.orgId, name: "SUPERADMIN" },
        { _id: 1 }
      ),
    ]);

    if (!wfhRequest) {
      return res.status(404).json({ message: "WFH request not found" });
    }

    if (!acceptedStatus) {
      return res.status(500).json({ message: "ACCEPTED status not found" });
    }

    if (getISTDateAndTime() >= wfhRequest.startDate && wfhRequest.statusId.toString() === acceptedStatus._id.toString()) {
      return res.status(400).json({
        message: "You cannot cancel past or ongoing WFH requests.",
      });
    }

    const isOwner = wfhRequest.employeeId.toString() === employeeId.toString();
    const isActioner =
      wfhRequest.statusId.toString() === acceptedStatus._id.toString() &&
      wfhRequest.actionedBy?.toString() === employeeId.toString();

    if (
      !(isOwner || isActioner) &&
      req.user.privilegeId.toString() !== superAdmin[0]._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this request" });
    }

    const cancelledStatus = await statusTypeSchema.findOne({
      orgId: req?.user?.orgId,
      statusType: "CANCELLED",
    });

    if (!cancelledStatus) {
      return res.status(500).json({ message: "CANCELLED status not found" });
    }

    const previousStatusId = wfhRequest.statusId;

    wfhRequest.statusId = cancelledStatus._id;
    wfhRequest.updatedAt = getISTDateAndTime();
    wfhRequest.actionedBy = employeeId;

    await wfhRequest.save();

    logger.info(
      `WFH request with ID '${wfhRequestId}' cancelled by user ${req.user.firstName} ${req.user.lastName}`
    );
    const [tokens, data] = await Promise.all([
      getNotificationToken(wfhRequest.employeeId),
      getWFHData(wfhRequest._id),
    ]);

    const response = await sendNotificationtoTokens(
      tokens,
      "WFH Request Cancelled",
      `Your WFH request from ${new Date(
        wfhRequest.startDate
      ).toDateString()} to ${new Date(
        wfhRequest.endDate
      ).toDateString()} has been cancelled.`,
      data
    );

    if (!response.success) {
      console.warn("Failed to send notification:", response.error);
    }

    return res
      .status(200)
      .json({ message: "WFH request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling WFH request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get NotifyTo names for a WFH request
const getNotifyToNames = async (req, res) => {
  try {
    const { wfhRequestId } = req.params;
    if (!wfhRequestId) {
      return res.status(400).json({ message: "wfhRequestId is required" });
    }
    const wfhRequest = await workFromHomeRequestSchema.findById(wfhRequestId);

    if (!wfhRequest) {
      return res.status(404).json({ message: "WFH request not found" });
    }

    const names = await workFromHomeRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(wfhRequestId),
        },
      },
      {
        $lookup: {
          from: "employees",
          let: { notifyIds: "$notifyTo" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$notifyIds"] },
              },
            },
            {
              $project: {
                _id: 0,
                fullName: { $concat: ["$firstName", " ", "$lastName"] },
              },
            },
          ],
          as: "notifyToDetails",
        },
      },
      {
        $addFields: {
          notifyTo: "$notifyToDetails.fullName",
        },
      },
      {
        $unwind: "$notifyToDetails",
      },
      {
        $project: {
          _id: 0,
          notifyName: "$notifyToDetails.fullName",
        },
      },
    ]);

    return res
      .status(200)
      .json({ message: "NotifyTo names fetched successfully", data: names });
  } catch (error) {
    console.error("Error while fetching notifyTo names:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getAllWFHRequestsData = async (
  fromDateStart,
  toDateEnd,
  statusArray,
  orgId
) => {
  try {
    const matchStage = {
      startDate: {
        $lte: toDateEnd,
      },
      endDate: {
        $gte: fromDateStart,
      },
    };

    if (statusArray.length > 0) {
      matchStage.statusId = { $in: statusArray };
    }

    const wfhRequests = await workFromHomeRequestSchema.aggregate([
      {
        $match: matchStage,
      },

      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "Status",
          pipeline: [
            {
              $project: { _id: 0, statusType: 1 },
            },
          ],
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
          as: "actionByInfo",
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
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "requestedByInfo",
        },
      },
      {
        $match: {
          "requestedByInfo.orgId": new ObjectId(orgId),
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          wfhReason: 1,
          isHalfDay: 1,
          actionReason: 1,
          halfDayPeriod: 1,
          createdAt: 1,
          updatedAt: 1,
          Status: { $first: "$Status.statusType" },
          notifyTo: "$notifyToInfo.fullName",
          actionedBy: {
            $first: "$actionByInfo.fullName",
          },
          requestedBy: {
            $concat: [
              { $first: "$requestedByInfo.firstName" },
              " ",
              { $first: "$requestedByInfo.lastName" },
            ],
          },
        },
      },
    ]);
    return {
      status: true,
      data: wfhRequests,
    };
  } catch (error) {
    console.error("Error fetching all WFH requests data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to get All WFH requests
const getAllWFHRequests = async (req, res) => {
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

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

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

    const wfhRequests = await getAllWFHRequestsData(
      fromDateStart,
      toDateEnd,
      [],
      req?.user?.orgId
    );
    if (!wfhRequests.status) {
      return res.status(404).json({
        message: "Error While fetching WFH requests",
        error: wfhRequests.message,
      });
    }

    return res.status(200).json({
      message: "Employees WFH Requests Data fetched Successfully",
      "No of Records": wfhRequests.data.length,
      data: wfhRequests.data,
    });
  } catch (error) {
    console.error("Error fetching employee WFH requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  addWFHRequest,
  processWFHRequest,
  getEmployeWFHRequests,
  getNotificationToken,
  getActionRequiredWFHS,
  getWFHRequestFlow,
  cancelWFHRequest,
  getNotifyToNames,
  getAllWFHRequests,
  getAllWFHRequestsData,
};
