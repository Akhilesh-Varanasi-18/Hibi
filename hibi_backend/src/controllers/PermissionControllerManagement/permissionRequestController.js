const permissionRequestSchema = require("../../models/PermissionSchemaManagement/permissionRequestSchema");
const permissionTypeSchema = require("../../models/PermissionSchemaManagement/permissionTypesSchema");
const firebaseMessagingTokenSchema = require("../../models/firebaseMessageingTockenSchema");
const statusTypeSchema = require("../../models/statusSchema");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { getISTDateAndTime } = require("../../utils/timeFunction");
const {
  sendNotificationtoTokens,
} = require("../FirebaseNotifications/firebaseMessageingTockenController");
const {
  checkForLimit,
  getNotifyToData,
} = require("../AttendenceControler/thumbRequestController");
const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const statusSchema = require("../../models/statusSchema");
const thumbRequestSchema = require("../../models/AttendenceSchemaManagement/thumbRequestSchema");
const holidaysSchema = require("../../models/AttendenceSchemaManagement/holidaysSchema");
const dailyAttendenceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const attendenceStatusTypesSchema = require("../../models/AttendenceSchemaManagement/attendenceStatusTypesSchema");
const permissionTypesSchema = require("../../models/PermissionSchemaManagement/permissionTypesSchema");
const logger = require("../../utils/logger");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");

// Function to get the Permission Request Data to send Notification
const getPermissionData = async (permissionRequestId) => {
  try {
    const permissionRequest = await permissionRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(permissionRequestId),
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
          from: "permissiontypes",
          localField: "permissionTypeId",
          foreignField: "_id",
          as: "permissionType",
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
          startTime: 1,
          endTime: 1,
          totalHours: 1,
          date: 1,
          employee: { $first: "$employee.firstName" },
          notifyTo: { $first: "$notifyTo.firstName" },
          status: { $first: "$Status.statusType" },
          permissionType: { $first: "$permissionType.permissionType" },
        },
      },
    ]);

    if (!permissionRequest) {
      throw new Error("Permission request not found");
    }

    return permissionRequest[0];
  } catch (error) {
    console.error("Error getting permission data:", error);
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

const changeGTMtoIST = (date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const res = new Date(date.getTime() + istOffset);
  return res;
};

const changeAttendanceRecords = async (
  permissionRequestId,
  needToUpdateInPunch,
  needToUpdateOutPunch,
  employeeId,
  startTime,
  endTime
) => {
  try {
    // console.log("Change Attendance Called with:", { permissionRequestId, needToUpdateInPunch, needToUpdateOutPunch, employeeId, startTime, endTime });
    const fromDateStart = new Date(startTime);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endTime);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log("From Date Start:", fromDateStart);
    // console.log("To Date End:", toDateEnd);

    const attendanceRecord = await dailyAttendenceSchema.findOne({
      employeeId: new ObjectId(employeeId),
      $or: [
        { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
        { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
      ],
    });

    // console.log(
    //   "This is Attendence Record for Employee ID:", employeeId, attendanceRecord
    // )

    if (!attendanceRecord) {
      console.log("No Attendance Record Found for the given date and employee");
      return {
        status: false,
        message: "No Attendance Record Found for the given date and employee",
      };
    }
    const orgId = attendanceRecord.orgId;

    const [firstHalfStatus, secondHalfStatus, fullDayStatus, presentStatus] =
      await Promise.all([
        attendenceStatusTypesSchema.findOne({
          orgId: orgId,
          shortName: "FH",
        }),
        attendenceStatusTypesSchema.findOne({
          orgId: orgId,
          shortName: "SH",
        }),
        attendenceStatusTypesSchema.findOne({
          orgId: orgId,
          shortName: "FD",
        }),
        attendenceStatusTypesSchema.findOne({
          orgId: orgId,
          shortName: "P",
        }),
      ]);

    if (!firstHalfStatus || !secondHalfStatus || !fullDayStatus) {
      return {
        status: false,
        message: "Attendance Status Types (FH, SH, FD) not found for the org",
      };
    }

    attendanceRecord.permissions.push(permissionRequestId);

    // console.log("Attendance Record Found:", attendanceRecord);

    if (needToUpdateInPunch) {
      // console.log("Comming for Late In");
      // need to update the logInTime
      if (!attendanceRecord.logInTime) {
        return {
          status: false,
          message: "LogIn Time is not present to update",
        };
      }

      // console.log("This is in Time", attendanceRecord.logInTime, " This is end Time ", endTime)
      if (attendanceRecord.logInTime <= endTime) {
        // console.log("This is with in time");
        attendanceRecord.logInTime = startTime;
        attendanceRecord.lateIn = false;
        if (
          attendanceRecord.statusId.toString() ===
            fullDayStatus._id.toString() ||
          (attendanceRecord.statusId.toString() ===
            firstHalfStatus._id.toString() &&
            attendanceRecord.finalizedAt == null)
        ) {
          attendanceRecord.statusId = secondHalfStatus._id;
        } else if (
          attendanceRecord.statusId.toString() ===
            firstHalfStatus._id.toString() &&
          attendanceRecord.finalizedAt != null
        ) {
          attendanceRecord.statusId = presentStatus._id;
        }
      }
      // else {
      //   console.log("This is out of Time");
      // }
    } else if (needToUpdateOutPunch) {
      // need to update the logOutTime
      // console.log("Comming for update in logOutTime");
      if (!attendanceRecord.logOutTime) {
        return {
          status: false,
          message: "LogOut Time is not present to update",
        };
      }

      if (attendanceRecord.logOutTime >= startTime) {
        attendanceRecord.logOutTime = endTime;
        attendanceRecord.earlyOut = false;
        if (
          attendanceRecord.statusId.toString() === fullDayStatus._id.toString()
        ) {
          attendanceRecord.statusId = firstHalfStatus._id;
        } else if (
          attendanceRecord.statusId.toString() ===
            secondHalfStatus._id.toString() &&
          attendanceRecord.finalizedAt != null
        ) {
          attendanceRecord.statusId = presentStatus._id;
        }
      }
    }
    // console.log("Updated Attendance Record:", attendanceRecord);
    attendanceRecord.updatedAt = getISTDateAndTime();
    attendanceRecord.save();
    return {
      status: true,
      message: "Attendance Records Updated Successfully",
    };
  } catch (error) {
    console.error("Error While Changing the Attendance Records:", error);
    return { status: false, message: error.message };
  }
};

// setTimeout(async () => {
//   console.log("This is a delayed log message after 2 seconds");
//   const changeAttendance = await changeAttendanceRecords(
//     "64b8f3f4f1c2c9b1a5e4d3c2",
//     "2025-10-10",
//     true,
//     "68bc7a2cf5a9d0213efba7ba",
//     "10:30"
//   );
//   console.log("Change Attendance Result:", changeAttendance);
// }, 2000);

const checkHolidaysAndSundays = async (fromDateStart, toDateEnd, orgId) => {
  try {
    // console.log("This is comming fromdate and toDate", fromDateStart, toDateEnd)

    const holidays = await holidaysSchema.aggregate([
      {
        $match: {
          orgId : orgId,
          fromDate: { $lte: toDateEnd },
          toDate: { $gte: fromDateStart },
        },
      },
    ]);

    // console.log("Check Holidays:",holidays.length );

    const isSunday = fromDateStart.getDay() === 0;

    // console.log("sunday", isSunday)

    if (holidays.length > 0 || isSunday) {
      // console.log("Comming for not")
      return {
        status: false,
        message: "You are not able to apply for Non Working Days",
      };
    } else {
      return { status: true, message: "You can apply for Permission" };
    }
  } catch (error) {
    console.error("Error While checking Holidays:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//Function to add a new permission request
const addPermissionRequest = async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      date,
      permissionReason,
      permissionTypeId,
      totalHours,
      isFirstHalf,
    } = req.body;

    // Validate required fields
    if (
      !startTime ||
      !endTime ||
      !date ||
      // !permissionReason ||
      !permissionTypeId ||
      !totalHours
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isFirstHalf === null || isFirstHalf === undefined) {
      return res.status(400).json({ message: "isFirstHalf is required" });
    }

    const employeeId = req?.user?._id;

    if (new Date(startTime) > new Date(endTime)) {
      return res
        .status(400)
        .json({ message: "Start time cannot be after end time" });
    }
    const monthStart = changeGTMtoIST(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    // console.log("Month Start: ", monthStart);
    // console.log("Start Time: ", startTime);

    // console.log("Start Time: ", changeGTMtoIST(new Date(startTime)));
    // console.log("Current Time: ", getISTDateAndTime());
    // console.log(changeGTMtoIST(new Date(startTime)) < getISTDateAndTime());

    if (startTime < monthStart) {
      return res.status(400).json({
        message: `You are not able to select the past date of ${startTime}.`,
      });
    }

    console.log("From and to", startTime, endTime);

    // Check if the Permission request already exists

    //! Need to combine the both calls
    // const existingPermissionRequest = await permissionRequestSchema.findOne({
    //   employeeId,
    //   permissionTypeId,
    //   startTime: { $lte: new Date(endTime) },
    //   endTime: { $gte: new Date(startTime) },
    //   date: { $eq: new Date(date) },
    // });

    // const PendingstatusId = await statusTypeSchema.findOne(
    //   { statusType: "PENDING" },
    //   { _id: 1 }
    // );

    const fromDateStart = changeGTMtoIST(new Date(startTime));
    // console.log("from", fromDateStart)
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = changeGTMtoIST(new Date(endTime));
    // console.log("TO", toDateEnd)
    toDateEnd.setUTCHours(23, 59, 59, 999);

    console.log("From date Start and to Date End ", fromDateStart, toDateEnd);

    const [rejectedStatusId, cancelledStatusId] = await Promise.all([
      statusTypeSchema.findOne(
        { orgId: req?.user?.orgId, statusType: "REJECTED" },
        { _id: 1 }
      ),
      statusTypeSchema.findOne(
        { orgId: req?.user?.orgId, statusType: "CANCELLED" },
        { _id: 1 }
      ),
    ]);

    if (!rejectedStatusId || !cancelledStatusId) {
      return res
        .status(400)
        .json({ message: "Rejected or Cancelled Status not found" });
    }

    const [existingPermissionRequest, PendingstatusId, existingLeaveRequest] =
      await Promise.all([
        permissionRequestSchema.findOne({
          employeeId,
          // permissionTypeId,
          // isFirstHalf,
          // startTime: { $lte: toDateEnd },
          // endTime: { $gte: fromDateStart },
          date: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
          statusId: {
            $nin: [rejectedStatusId._id, cancelledStatusId._id],
          },
        }),
        statusTypeSchema.findOne({ statusType: "PENDING" }, { _id: 1 }),
        leaveRequestSchema.findOne({
          employeeId,
          startDate: { $gte: fromDateStart },
          endDate: { $lte: toDateEnd },
        }),
      ]);

    if (existingPermissionRequest || existingPermissionRequest?.length > 0) {
      return res.status(400).json({
        message: "Permission request already exists for the specified period",
      });
    }

    if (existingLeaveRequest || existingLeaveRequest?.length > 0) {
      return res.status(400).json({
        message: "Leave Request already exists for the specified period",
      });
    }

    const startOfMonth = changeGTMtoIST(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    // const acceptedStatusId = await statusSchema.findOne({orgId : req?.user?.orgId, statusType: "ACCEPTED" } )

    // if(!acceptedStatusId){
    //   return res.status(400).json({message : 'Accepted Status not found'})
    // }

    // const permissionRequestCount = await permissionRequestSchema.aggregate([
    //   {
    //     $match: {
    //       employeeId: new ObjectId(employeeId),
    //       statusId : new ObjectId(acceptedStatusId._id),
    //       startTime: {
    //         $gte: startOfMonth,
    //       },
    //     },
    //   },
    //   {
    //     $count: "count",
    //   },
    // ]);

    // if (permissionRequestCount[0]?.count >= 3) {
    //   return res.status(400).json({
    //     message:
    //       "You have reached the maximum limit of 3 permission requests for this month.",
    //   });
    // }

    // const check = await checkForLimit(
    //   employeeId,
    //   req?.user?.orgId,
    //   startTime.toString().split("T")[0]
    // );

    // // console.log("Check for Limit:", check);

    // if (!check.status) {
    //   return res.status(400).json({ message: check.message });
    // }

    // if (check.totalCount >= 3) {
    //   return res.status(400).json({
    //     message:
    //       "You have reached the maximum limit of 3 permission requests for this month.",
    //   });
    // }

    // console.log("This is going fromDtae and toDaTE", fromDateStart, toDateEnd)

    const checkForHolidays = await checkHolidaysAndSundays(
      fromDateStart,
      toDateEnd,
      req?.user?.orgId  
    );

    // console.log(checkForHolidays)

    if (!checkForHolidays.status) {
      return res
        .status(400)
        .json({ message: "You are not able to apply for Non Working Days" });
    }

    const requiredData = await getNotifyToData(
      req?.user.teamId,
      req?.user.roleId,
      req?.user.orgId
    );
    // console.log("This is Required Data", requiredData);

    // console.log(requiredData, "This is Notify To Data");

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

    const permissionDate = new Date(date);
    permissionDate.setUTCHours(0, 0, 0, 0);

    // Create a new permission request

    console.log("The final Start And end Time is ", startTime, endTime);
    const permissionRequest = new permissionRequestSchema({
      employeeId,
      notifyTo: requiredData.data.notifyTo,
      permissionTypeId,
      startTime: startTime,
      endTime: endTime,
      permissionReason: permissionReason || "",
      totalHours,
      isFirstHalf,
      date: fromDateStart,
      statusId: PendingstatusId._id,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
    });

    await permissionRequest.save();

    logger.info(
      `Permission request with reason '${permissionReason}' created by user ${req.user.firstName} ${req.user.lastName}`
    );
    //! Need to combine the both calls
    // const data = await getPermissionData(permissionRequest._id);
    // const tokens = await getNotificationToken(permissionRequest.notifyTo);

    // const [data, tokens] = await Promise.all([
    //   getPermissionData(permissionRequest._id),
    //   getNotificationToken(permissionRequest.notifyTo),
    // ]);

    const data = await getPermissionData(permissionRequest._id);

    const title = `Permission Request from ${data.empaloyee}`;
    const body = `${data.employee} permission request has been forwarded to You. Please review it.`;
    const response = await sendNotificationtoTokens(
      requiredData.data.tokens,
      title,
      body,
      data
    );
    if (!response.success) {
      console.error("Failed to send notification:", response.error);
    } else {
      console.log(
        `Notification sent successfully to ${requiredData.data.notifyTo}`,
        data
      );
      console.log("This is Title", title);
      console.log("This is Body", body);
    }

    return res
      .status(201)
      .json({ message: "Permission request added successfully" });
  } catch (error) {
    console.error("Error adding Permission request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to process a permission request (approve/reject/Forward)
const processPermissionRequest = async (req, res) => {
  try {
    const { permissionRequestId, statusId, actionReason } = req.body;
    // console.log("This is coming", req.body);

    const employeeId = req?.user?._id;
    const orgId = req?.user?.orgId;

    // Validate required fields
    if (!permissionRequestId || !statusId) {
      return res.status(400).json({
        message: "Permission request ID, status ID  are required",
      });
    }

    //! Need to combine the Three calls
    // Validate statusId
    // const status = await statusTypeSchema.findById(
    //   { _id: statusId },
    //   { statusType: 1 }
    // );

    // // Find the permission request
    // const permissionRequest = await permissionRequestSchema.findById(
    //   permissionRequestId
    // );

    // const PendingstatusId = await statusTypeSchema.findOne(
    //   { statusType: "PENDING" },
    //   { _id: 1 }
    // );

    const [status, permissionRequest, superAdmin] = await Promise.all([
      statusTypeSchema.findById({ _id: statusId }, { statusType: 1 }),
      permissionRequestSchema.findById(permissionRequestId),
      privilegeSchema.find(
        { orgId: req?.user?.orgId, name: "SUPERADMIN" },
        { _id: 1 }
      ),
      // statusTypeSchema.findOne({ statusType: "PENDING" }, { _id: 1 }),
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

    // if (status.statusType === statusTyes.ESCALATED && !notifyTo) {
    //   return res
    //     .status(400)
    //     .json({ message: "NotifyTo is required for escalated requests" });
    // }

    if (!permissionRequest) {
      return res.status(404).json({ message: "Permission request not found" });
    }

    if (
      !permissionRequest.notifyTo.includes(employeeId) &&
      req.user.privilegeId.toString() !== superAdmin[0]._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to process this request" });
    }

    // if(notifyTo && notifyTo.toString() === permissionRequest.employeeId.toString()){
    //     return res.status(400).json({ message: "You cannot forward the request to the same employee who raised it." });
    //   }

    // const check = await checkForLimit(
    //   permissionRequest.employeeId,
    //   req?.user?.orgId,
    //   permissionRequest.startTime.toString().split("T")[0]
    // );

    // if (!check.status) {
    //   return res.status(400).json({ message: check.message });
    // }

    // if (check.totalCount > 3 && status.statusType === statusTyes.ACCEPTED) {
    //   return res.status(400).json({
    //     message:
    //       "The employee has reached the maximum limit of 3 thumb and permission requests for this month.",
    //   });
    // }

    const actionList = {
      actionedBy: employeeId,
      statusId,
      actionReason: actionReason ? actionReason : "",
      createdAt: getISTDateAndTime(),
    };

    // permissionRequest.approvalList[
    //   permissionRequest.approvalList.length - 1
    // ].actionReason = actionReason;
    // permissionRequest.approvalList[
    //   permissionRequest.approvalList.length - 1
    // ].statusId = statusId;
    // permissionRequest.approvalList[
    //   permissionRequest.approvalList.length - 1
    // ].updatedAt = getISTDateAndTime();

    // if (status.statusType === statusTyes.ESCALATED && notifyTo) {
    //   permissionRequest.approvalList.push({
    //     actionedBy: notifyTo,
    //     statusId: PendingstatusId._id,
    //     actionReason: "",
    //   });
    // }

    // permissionRequest.notifyTo = notifyTo ? notifyTo : permissionRequest.notifyTo;

    permissionRequest.approvalList.push(actionList);
    permissionRequest.statusId = statusId;
    permissionRequest.actionReason = actionReason;
    permissionRequest.actionedBy = employeeId;
    permissionRequest.updatedAt = getISTDateAndTime();

    if (
      status.statusType === statusTyes.ACCEPTED ||
      status.statusType === statusTyes.REJECTED
    ) {
      // permissionRequest.actionedBy = employeeId;
      // permissionRequest.notifyTo = employeeId;
      // permissionRequest.actionedAt = getISTDateAndTime();

      //! Need to combine the both calls
      // const data = await getPermissionData(permissionRequest._id);
      // const tokens = await getNotificationToken(permissionRequest.employeeId);

      const [earlyOut, lateIn] = await Promise.all([
        permissionTypesSchema.findOne({
          orgId: orgId,
          permissionType: "EARLYOUT",
        }),
        permissionTypesSchema.findOne({
          orgId: orgId,
          permissionType: "LATEIN",
        }),
      ]);

      if (
        status.statusType === statusTyes.ACCEPTED &&
        permissionRequest.startTime < getISTDateAndTime()
        // &&
        // (permissionRequest.permissionTypeId.toString() ===
        //   lateIn._id.toString() ||
        //   permissionRequest.permissionTypeId.toString() ===
        //     earlyOut._id.toString())
      ) {
        // console.log("Permission Request Accepted after it starts");

        // const employeeShiftDate = await employeeSchema.aggregate([
        //   {
        //     $match: {
        //       _id : permissionRequest.employeeId,
        //     },
        //   },
        //   {
        //     $lookup: {
        //       from: "shifts",
        //       localField: "shiftId",
        //       foreignField: "_id",
        //       as: "shiftInfo",
        //     },
        //   },
        //   {
        //     $unwind: "$shiftInfo",
        //   },
        //   {
        //     $project: {
        //       start: "$shiftInfo.startTime",
        //       end: "$shiftInfo.endTime",
        //       breakStart: "$shiftInfo.breakTimeStart",
        //       breakEnd: "$shiftInfo.breakTimeEnd",
        //       gracePeriod: "$shiftInfo.gracePeriodMin",
        //     },
        //   },
        // ]);

        // date = getISTDateAndTime().toISOString().split("T")[0];

        // const gracePeriodMs = employeeShiftDate[0].gracePeriod * 60 * 1000;

        // const shiftStartBase = new Date(
        //   `${date}T${employeeShiftDate[0].start}:00.000Z`
        // );
        // const shiftEndBase = new Date(
        //   `${date}T${employeeShiftDate[0].end}:00.000Z`
        // );
        // const shiftBreakStartBase = new Date(
        //   `${date}T${employeeShiftDate[0].breakStart}:00.000Z`
        // );
        // const shiftBreakEndBase = new Date(
        //   `${date}T${employeeShiftDate[0].breakEnd}:00.000Z`
        // );

        // const shiftStartWithGrace = new Date(
        //   shiftStartBase.getTime() + gracePeriodMs
        // );
        // const shiftBreakStartWithGrace = new Date(
        //   shiftBreakStartBase.getTime() - gracePeriodMs
        // );
        // const shiftBreakEndWithGrace = new Date(
        //   shiftBreakEndBase.getTime() + gracePeriodMs
        // );
        // const shiftEndWithGrace = new Date(
        //   shiftEndBase.getTime() - gracePeriodMs
        // );

        // const needToUpdateInPunch = permissionRequest.permissionTypeId.toString() ===
        //     lateIn._id.toString() || permissionRequest.startTime <= shiftStartWithGrace

        // const needToUpdateOutPunch = permissionRequest.permissionTypeId.toString() ===
        //     earlyOut._id.toString() || permissionRequest.endTime >= shiftEndWithGrace

        const changeAttendance = await changeAttendanceRecords(
          permissionRequest._id,
          // needToUpdateInPunch,
          // needToUpdateOutPunch,
          permissionRequest.isFirstHalf === true,
          permissionRequest.isFirstHalf !== true,
          permissionRequest.employeeId,
          permissionRequest.startTime,
          permissionRequest.endTime
        );
        console.log("This is attendence Attempt", changeAttendance);
        if (!changeAttendance.status) {
          console.log(
            "Error While Changing the Attendance",
            changeAttendance.message
          );
          return res.status(400).json({
            message: changeAttendance.message,
            //  message: "Error While Checking the Attendance",
            // error: changeAttendance.message,
          });
        }
      }

      const [data, tokens] = await Promise.all([
        getPermissionData(permissionRequest._id),
        getNotificationToken(permissionRequest.employeeId),
      ]);

      const title = `Update On Your Permission Request`;
      const body = `Your Permission Request has been ${status.statusType}. Please review it.`;
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
        req?.user.teamId,
        req?.user.roleId,
        req?.user.orgId
      );

      // console.log(requiredData.data.notifyTo, "This is Notify To Data");

      // console.log(employeeId, "This is Employee ID");

      if (!requiredData.status) {
        return res.status(500).json({
          message: "Error While Notifying ",
          error: requiredData.message,
        });
      }

      // check if i am sending notify to the same employee who raised the request or not
      if (
        permissionRequest.employeeId.toString() in requiredData.data.notifyTo
      ) {
        return res.status(400).json({
          message:
            "You cannot forward the request to the same employee who raised it.",
        });
      }

      // filter the notify to array to remove the employee who have already actioned the request
      // console.log(permissionRequest.approvalList);
      const approvalIds = permissionRequest.approvalList
        .map((item, index) => {
          if (index === permissionRequest.approvalList.length - 1) return;
          return String(item.actionedBy);
        })
        .filter(Boolean);

      // console.log("This is approvalIds", approvalIds);

      // console.log("This is", requiredData.data.notifyTo);

      const filteredNotifyTo = requiredData.data.notifyTo.filter(
        (id) => !approvalIds.includes(String(id))
      );

      // console.log("This is filtered", filteredNotifyTo);

      //checking if after filtering the array is empty or not
      if (filteredNotifyTo && filteredNotifyTo.length === 0) {
        return res
          .status(400)
          .json({ message: "No one to notify, Please contact Admin" });
      }
      permissionRequest.notifyTo = filteredNotifyTo;

      //! Need to combine the both calls
      // const data = await getPermissionData(permissionRequest._id);
      // const tokens = await getNotificationToken(notifyTo);

      // const [data, tokens] = await Promise.all([
      //   getPermissionData(permissionRequest._id),
      //   getNotificationToken(notifyTo),
      // ]);

      const data = await getPermissionData(permissionRequest._id);

      const title = `Permission Request Forwarded to You`;
      const body = `${data.employee}'s Permission Request Forwarded from ${req.user.firstName} to You. Please review it.`;

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
          `Notification sent successfully to ${requiredData.data.tokens}`,
          data
        );
        console.log("This is Title", title);
        console.log("This is Body", body);
      }
    } else {
      console.warn(`Unexpected status type: ${status.statusType} ${statusId}`);
      return res.status(400).json({ message: "Invalid status type" });
    }

    await permissionRequest.save();
    logger.info(
      `Permission request with ID '${permissionRequestId}' processed by user ${req.user.firstName} ${req.user.lastName} with status ${status.statusType}`
    );
    return res
      .status(200)
      .json({ message: "Permission request processed successfully" });
  } catch (error) {
    console.log("Error while processing Permission request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to delete a permission request
const deletePermissionRequest = async (req, res) => {
  try {
    const { permissionRequestId } = req.params;

    if (!permissionRequestId) {
      return res
        .status(400)
        .json({ message: "Permission request ID is required" });
    }

    const permissionRequest = await permissionRequestSchema.findById(
      permissionRequestId
    );
    if (!permissionRequest) {
      return res.status(404).json({ message: "Permission request not found" });
    }

    if (getISTDateAndTime() >= permissionRequest.startTime) {
      return res.status(400).json({
        message: "You cannot delete past or ongoing permission requests.",
      });
    }

    await permissionRequest.deleteOne();

    logger.info(
      `Permission request with ID '${permissionRequestId}' deleted by user ${req.user.firstName} ${req.user.lastName}`
    );
    return res
      .status(200)
      .json({ message: "Permission request deleted successfully" });
  } catch (error) {
    console.error("Error deleting permission request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getEmployeePermissionRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    const employeeId = req?.user?._id;

    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "from Date and to Date are required" });
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    // console.log("From Date:", fromDate, "To Date:", toDate);

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

    // console.log("From Date After:", fromDateStart, "To Date After:", toDateEnd);

    // Validate date range
    if (fromDateStart && toDateEnd && fromDateStart > toDateEnd) {
      return res
        .status(400)
        .json({ message: "From time cannot be after to time" });
    }

    const permissionRequests = await permissionRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          $or: [
            {
              startTime: {
                $lte: toDateEnd,
              },
              endTime: {
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
          from: "permissiontypes",
          localField: "permissionTypeId",
          foreignField: "_id",
          as: "permissionType",
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
          as: "notifyToDetails",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "actionedByInfo",
        },
      },
      {
        $project: {
          startTime: 1,
          endTime: 1,
          totalHours: 1,
          permissionReason: 1,
          actionReason: 1,
          isFirstHalf: 1,
          createdAt: 1,
          updatedAt: 1,
          Status: { $first: "$Status.statusType" },
          permissionType: {
            $first: "$permissionType.permissionType",
          },
          notifyTo: "$notifyToDetails.fullName",
          actionedBy: {
            $concat: [
              { $first: "$actionedByInfo.firstName" },
              " ",
              { $first: "$actionedByInfo.lastName" },
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Employee Permission Requests Fetched Successfully",
      "no.ofRequests": permissionRequests.length,
      data: permissionRequests,
    });
  } catch (error) {
    console.error("Error fetching employee permission requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getActionRequiredPermissions = async (req, res) => {
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

    if (new Date(fromDateStart) > new Date(toDateEnd)) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const pendingRequests = await permissionRequestSchema.aggregate([
      {
        $match: {
          notifyTo: new ObjectId(employeeId),
          $or: [
            {
              startTime: {
                $lte: toDateEnd,
              },
              endTime: {
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
          from: "permissiontypes",
          localField: "permissionTypeId",
          foreignField: "_id",
          as: "permissionType",
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
          startTime: 1,
          endTime: 1,
          totalHours: 1,
          isFirstHalf: 1,
          permissionReason: 1,
          createdAt: 1,
          actionReason: 1,
          updatedAt: 1,
          Status: { $first: "$Status.statusType" },
          permissionType: { $first: "$permissionType.permissionType" },
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

    return res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error fetching permission actions:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getPermissionRequestFlow = async (req, res) => {
  try {
    const { permissionRequestId } = req.params;

    // Validate permission request ID
    if (!permissionRequestId) {
      return res
        .status(400)
        .json({ message: "Permission request ID is required" });
    }

    const permissionFlow = await permissionRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(permissionRequestId),
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
          actionedBy: {
            $concat: ["$approver.firstName", " ", "$approver.lastName"],
          },
          status: "$status.statusType",
          actionReason: "$approvalList.actionReason",
          sendAt: "$approvalList.createdAt",
          actionAt: "$approvalList.updatedAt",
        },
      },
    ]);

    return res.status(200).json(permissionFlow);
  } catch (error) {
    console.error("Error fetching permission request flow:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to cancel a permission request
const cancelPermissionRequest = async (req, res) => {
  try {
    const { permissionRequestId } = req.body;
    const employeeId = req?.user?._id;

    if (!permissionRequestId) {
      return res
        .status(400)
        .json({ message: "Permission request ID is required" });
    }

    const [permissionRequest, acceptedStatus, superAdmin] = await Promise.all([
      permissionRequestSchema.findOne({ _id: permissionRequestId }),
      statusTypeSchema.findOne(
        { orgId: req?.user.orgId, statusType: "ACCEPTED" },
        { _id: 1 }
      ),
      privilegeSchema.find(
        { orgId: req?.user?.orgId, name: "SUPERADMIN" },
        { _id: 1 }
      ),
    ]);

    if (!permissionRequest) {
      return res.status(404).json({
        message: "Permission request not found or cannot be cancelled",
      });
    }

    if (!acceptedStatus) {
      return res.status(500).json({ message: "ACCEPTED status not found" });
    }

    if (getISTDateAndTime() >= permissionRequest.startTime && permissionRequest.statusId.toString() === acceptedStatus._id.toString()) {
      return res.status(400).json({
        message: "You cannot cancel past or ongoing permission requests.",
      });
    }

    if (
      permissionRequest.employeeId.toString() === employeeId.toString() ||
      (permissionRequest.statusId.toString() ===
        acceptedStatus._id.toString() &&
        permissionRequest.actionedBy.toString() === employeeId.toString() &&
        req.user.privilegeId.toString() !== superAdmin[0]._id.toString())
    ) {
      const cancelledStatus = await statusTypeSchema.findOne({
        orgId: req?.user?.orgId,
        statusType: "CANCELLED",
      });
      if (!cancelledStatus) {
        return res.status(500).json({ message: "CANCELLED status not found" });
      }

      permissionRequest.statusId = cancelledStatus._id;
      permissionRequest.updatedAt = getISTDateAndTime();
      permissionRequest.actionedBy = employeeId;
      await permissionRequest.save();

      logger.info(
        `Permission request with ID '${permissionRequestId}' cancelled by user ${req.user.firstName} ${req.user.lastName}`
      );
      const [tokens, data] = await Promise.all([
        getNotificationToken(permissionRequest.employeeId),
        getPermissionData(permissionRequest._id),
      ]);

      const response = await sendNotificationtoTokens(
        tokens,
        "Permission Request Cancelled",
        `Your permission request has been cancelled.`,
        data
      );

      if (!response.success) {
        console.warn("Failed to send notification:", response.error);
      }

      return res
        .status(200)
        .json({ message: "Permission request cancelled successfully" });
    } else {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this request" });
    }
  } catch (error) {
    console.error("Error cancelling permission request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get notifyTo names for a permission request
const getNotifyToNames = async (req, res) => {
  try {
    const { permissionRequestId } = req.body;
    if (!permissionRequestId) {
      return res
        .status(400)
        .json({ message: "permissionRequestId is required" });
    }
    const permissionRequest = await permissionRequestSchema.findById(
      permissionRequestId
    );

    if (!permissionRequest) {
      return res.status(404).json({ message: "Permission request not found" });
    }

    const names = await permissionRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(permissionRequestId),
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

const getAllPermissionRequestsData = async (
  fromDateStart,
  toDateEnd,
  statusArray,
  orgId
) => {
  try {
    const matchStage = {
      startTime: {
        $lte: toDateEnd,
      },
      endTime: {
        $gte: fromDateStart,
      },
    };

    if (statusArray.length > 0) {
      matchStage.statusId = { $in: statusArray };
    }

    const permissionRequests = await permissionRequestSchema.aggregate([
      {
        $match: matchStage,
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
          from: "permissiontypes",
          localField: "permissionTypeId",
          foreignField: "_id",
          as: "permissionType",
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
          as: "notifyToDetails",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "actionedByInfo",
        },
      },
      {
        $project: {
          startTime: 1,
          endTime: 1,
          totalHours: 1,
          permissionReason: 1,
          actionReason: 1,
          isFirstHalf: 1,
          createdAt: 1,
          updatedAt: 1,
          requestedBy: {
            $concat: [
              { $first: "$requestedByInfo.firstName" },
              " ",
              { $first: "$requestedByInfo.lastName" },
            ],
          },
          Status: { $first: "$Status.statusType" },
          permissionType: {
            $first: "$permissionType.permissionType",
          },
          notifyTo: "$notifyToDetails.fullName",
          actionedBy: {
            $concat: [
              { $first: "$actionedByInfo.firstName" },
              " ",
              { $first: "$actionedByInfo.lastName" },
            ],
          },
        },
      },
    ]);

    return {
      status: true,
      data: permissionRequests,
    };
  } catch (error) {
    console.log("Error While fetching the Permission Requests ", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to get all permission requests within a date range
const getAllPermissionRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    const employeeId = req?.user?._id;

    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "from Date and to Date are required" });
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    // console.log("From Date:", fromDate, "To Date:", toDate);

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

    // console.log("From Date After:", fromDateStart, "To Date After:", toDateEnd);

    // Validate date range
    if (fromDateStart && toDateEnd && fromDateStart > toDateEnd) {
      return res
        .status(400)
        .json({ message: "From time cannot be after to time" });
    }

    const permissionRequests = await getAllPermissionRequestsData(
      fromDateStart,
      toDateEnd,
      [],
      req?.user?.orgId
    );

    if (!permissionRequests.status) {
      return res.status(404).json({
        message: "Error While fetching Permissions requests",
        error: permissionRequests.message,
      });
    }

    return res.status(200).json({
      message: "Employee Permission Requests Fetched Successfully",
      "no.ofRequests": permissionRequests.data.length,
      data: permissionRequests.data,
    });
  } catch (error) {
    console.error("Error fetching employee permission requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// const addIsFirstHalfField = async(reqId, isFirstHalf) =>{
//   try{
//     await permissionRequestSchema.findByIdAndUpdate(reqId, { isFirstHalf });
//     console.log("isFirstHalf field added successfully");
//   } catch (error) {
//     console.error("Error adding isFirstHalf field:", error);
//   }
// }

// setTimeout(() => {
//   addIsFirstHalfField("68a6bc1dfe17da46e6d5a59f", true);
// }, 1000);

// setTimeout(async()=>{
//   await checkForLimit();
// }, 1000)

// setTimeout(async () => {
//   console.log("Permission Request Controller Loaded Successfully");
//   const employeeShiftDate = await employeeSchema.aggregate([
//     {
//       $match: {
//         employeeCode: "4299"
//       },
//     },
//     {
//       $lookup: {
//         from: "shifts",
//         localField: "shiftId",
//         foreignField: "_id",
//         as: "shiftInfo",
//       },
//     },
//     {
//       $unwind: "$shiftInfo",
//     },
//     {
//       $project: {
//         start: "$shiftInfo.startTime",
//         end: "$shiftInfo.endTime",
//         breakStart: "$shiftInfo.breakTimeStart",
//         breakEnd: "$shiftInfo.breakTimeEnd",
//         gracePeriod: "$shiftInfo.gracePeriodMin",
//       },
//     },
//   ]);
//   date = getISTDateAndTime().toISOString().split("T")[0];

//   const gracePeriodMs = employeeShiftDate[0].gracePeriod * 60 * 1000;

//   const shiftStartBase = new Date(`${date}T${employeeShiftDate[0].start}:00.000Z`);
//   const shiftEndBase = new Date(`${date}T${employeeShiftDate[0].end}:00.000Z`);
//   const shiftBreakStartBase = new Date(`${date}T${employeeShiftDate[0].breakStart}:00.000Z`);
//   const shiftBreakEndBase = new Date(
//     `${date}T${employeeShiftDate[0].breakEnd}:00.000Z`
//   );

//   const shiftStartWithGrace = new Date(shiftStartBase.getTime() + gracePeriodMs);
//   const shiftBreakStartWithGrace = new Date(
//     shiftBreakStartBase.getTime() - gracePeriodMs
//   );
//   const shiftBreakEndWithGrace = new Date(shiftBreakEndBase.getTime() + gracePeriodMs);
//   const shiftEndWithGrace = new Date(shiftEndBase.getTime() - gracePeriodMs);

//   console.log("This is Shift Start", shiftStartWithGrace)
//   console.log("This is Shift end", shiftEndWithGrace)
//   console.log("This is Shift break Start", shiftBreakStartWithGrace)
//   console.log("This is Shift break end", shiftBreakEndWithGrace)

// }, 10000);

module.exports = {
  addPermissionRequest,
  processPermissionRequest,
  deletePermissionRequest,
  getEmployeePermissionRequests,
  getActionRequiredPermissions,
  getPermissionRequestFlow,
  cancelPermissionRequest,
  getNotifyToNames,
  checkHolidaysAndSundays,
  getAllPermissionRequests,
  getAllPermissionRequestsData,
};
