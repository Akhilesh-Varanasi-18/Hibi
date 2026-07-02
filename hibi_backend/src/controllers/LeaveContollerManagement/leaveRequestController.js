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
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");
const logger = require("../../utils/logger");

// Function to get the leave Request Data to send Notification
const getLeaveData = async (leaveRequestId) => {
  try {
    const leaveRequest = await leaveRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(leaveRequestId),
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
          from: "leavetypes",
          localField: "leaveTypeId",
          foreignField: "_id",
          as: "leaveType",
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
          startDate: 1,
          endDate: 1,
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
          leaveType: { $first: "$leaveType.leaveType" },
        },
      },
    ]);

    if (!leaveRequest) {
      throw new Error("leave request not found");
    }

    return leaveRequest[0];
  } catch (error) {
    console.error("Error getting leave data:", error);
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

// Function to get CL counts
const getCLCounts = async (employeeId, statusId) => {
  try {
    if (!employeeId || !statusId) {
      return {
        status: false,
        message: "Employee ID and Status ID are required",
      };
    }

    const clsData = await CLSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(statusId),
        },
      },
      {
        $group: {
          _id: "$employeeId",
          TotalCls: { $sum: 0.5 },
        },
      },
    ]);
    // console.log("This is CL Data", clsData, clsData.length);

    // if (!clsData || clsData.length === 0) {
    //   // console.log("No CL data found for the employee");
    //   return {
    //     status: false,
    //     message: "No CL data found for the employee",
    //   };
    // }

    // console.log("This is CL Data", clsData[0]);
    return {
      status: true,
      data: clsData[0]?.TotalCls || 0,
    };
  } catch (error) {
    console.error("Error getting CL Data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to get the OD Counts
const getODCounts = async (employeeId, statusId) => {
  try {
    if (!employeeId || !statusId) {
      return {
        status: false,
        message: "Employee ID and Status ID are required",
      };
    }

    const odData = await ODSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(statusId),
        },
      },
      {
        $group: {
          _id: "$employeeId",
          TotalOds: { $sum: 0.5 },
        },
      },
    ]);
    // console.log("This is OD Data", odData);
    return {
      status: true,
      data: odData[0]?.TotalOds || 0,
    };
  } catch (error) {
    console.error("Error getting OD Data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to mark used CL leave
const markUsedCL = async (
  clsUsed,
  employeeId,
  leaveRequestId,
  presentStatusId,
  updateStatusId
) => {
  try {
    if (!clsUsed || clsUsed === 0) {
      return {
        status: false,
        message: "No CL data to update",
      };
    }

    if (!employeeId || !presentStatusId || !updateStatusId) {
      return {
        status: false,
        message: "All parameters are required",
      };
    }

    // console.log("This is Leave Request ID", leaveRequestId);
    // console.log("This is Present Status ID", presentStatusId);
    // console.log("This is Update Status ID", updateStatusId);
    // console.log("This is Employee ID", employeeId);
    // console.log("Used CLs ", clsUsed);

    const getClsData = await CLSchema.find({
      employeeId,
      statusId: presentStatusId,
    })
      .sort({ createdAt: 1 })
      .limit(clsUsed * 2);

    if (!getClsData || getClsData.length === 0) {
      return {
        status: true,
        message: "No CL data found for the employee",
      };
    }

    const updatePromises = getClsData.map((record) =>
      CLSchema.updateOne(
        { _id: record._id },
        {
          $set: {
            statusId: updateStatusId,
            updatedAt: getISTDateAndTime(),
            ...(leaveRequestId && { leaveRequestId }),
          },
        }
      )
    );

    const results = await Promise.all(updatePromises);

    // console.log("This is Results", results);

    return {
      status: true,
      message: `${results.length / 2} CL records updated successfully`,
      data: results,
    };
  } catch (error) {
    console.error("Error updating CL data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to mark used OD leave
const markUsedOD = async (
  odUsed,
  employeeId,
  leaveRequestId,
  presentStatusId,
  updateStatusId
) => {
  try {
    if (!odUsed || odUsed === 0) {
      return {
        status: false,
        message: "No CL data to update",
      };
    }

    if (!employeeId || !presentStatusId || !updateStatusId) {
      return {
        status: false,
        message: "All parameters are required",
      };
    }

    const getODsData = await ODSchema.find({
      employeeId,
      statusId: presentStatusId,
    })
      .sort({ createdAt: 1 })
      .limit(odUsed * 2);

    if (!getODsData || getODsData.length === 0) {
      return {
        status: true,
        message: "No OD data found for the employee",
      };
    }

    // console.log("This is Leave Request ID", leaveRequestId);
    // console.log("This is Present Status ID", presentStatusId);
    // console.log("This is Update Status ID", updateStatusId);
    // console.log("This is Employee ID", employeeId);
    // console.log("Used Ods ", odUsed);

    const updatePromises = getODsData.map((record) =>
      ODSchema.updateOne(
        { _id: record._id },
        {
          $set: {
            statusId: updateStatusId,
            updatedAt: getISTDateAndTime(),
            ...(leaveRequestId && { leaveRequestId }),
          },
        }
      )
    );

    const results = await Promise.all(updatePromises);

    // console.log("This is Results", results);

    return {
      status: true,
      message: `${results.length / 2} OD records updated successfully`,
      data: results,
    };
  } catch (error) {
    console.error("Error updating OD data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to unmark used CL leave
const unmarkUsedCL = async (
  orgId,
  employeeId,
  leaveRequestId,
  presentStatusId,
  updateStatusId,
  isAccepted
) => {
  try {
    if (
      !employeeId ||
      !presentStatusId ||
      !updateStatusId ||
      !leaveRequestId ||
      !orgId
    ) {
      return {
        status: false,
        message: "All parameters are required",
      };
    }

    // const getClWithLeaveRequestId = await CLSchema.findOne({
    //   leaveRequestId,
    //   employeeId,
    //   orgId,
    // });

    // if (!getClWithLeaveRequestId) {
    //   return {
    //     status: true,
    //     message: "No CL data found for the employee",
    //   };
    // }

    // console.log("This is Leave Request ID", leaveRequestId);
    // console.log("This is Present Status ID", presentStatusId);
    // console.log("This is Update Status ID", updateStatusId);
    // console.log("This is Employee ID", employeeId);
    // console.log("This is Org ID", orgId);

    const getClsData = await CLSchema.find({
      leaveRequestId,
      employeeId,
      statusId: presentStatusId,
    });

    if (!getClsData || getClsData.length === 0) {
      return {
        status: true,
        message: "No CL data found for the employee",
      };
    }

    const updatePromises = getClsData.map((record) =>
      CLSchema.updateOne(
        { _id: record._id },
        {
          $set: {
            updatedAt: getISTDateAndTime(),
            statusId: updateStatusId,
            ...(isAccepted && isAccepted === false && { leaveRequestId: null }),
          },
        }
      )
    );

    const results = await Promise.all(updatePromises);
    // console.log("Results", results);

    return {
      status: true,
      message: `${results.length / 2} CL records updated successfully`,
      data: results,
    };
  } catch (error) {
    console.error("Error updating CL data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to unmark used OD leave
const unmarkUsedOD = async (
  orgId,
  employeeId,
  leaveRequestId,
  presentStatusId,
  updateStatusId,
  isAccepted
) => {
  try {
    if (
      !employeeId ||
      !presentStatusId ||
      !updateStatusId ||
      !leaveRequestId ||
      !orgId
    ) {
      return {
        status: false,
        message: "All parameters are required",
      };
    }

    // console.log("This is Leave Request ID", leaveRequestId);
    // console.log("This is Present Status ID", presentStatusId);
    // console.log("This is Update Status ID", updateStatusId);
    // console.log("This is Employee ID", employeeId);
    // console.log("This is Org ID", orgId);

    // const getODWithLeaveRequestId = await ODSchema.findOne({
    //   leaveRequestId,
    //   // employeeId,
    //   // orgId,
    // });

    // if (!getODWithLeaveRequestId) {
    //   return {
    //     status: true,
    //     message: "No OD data found for the employee",
    //   };
    // }

    const getODsData = await ODSchema.find({
      leaveRequestId,
      employeeId,
      statusId: presentStatusId,
    });

    if (!getODsData || getODsData.length === 0) {
      return {
        status: true,
        message: "No OD data found for the employee",
      };
    }

    const acceptedStatusId = await statusSchema.findOne({
      orgId: orgId,
      statusType: "ACCEPTED",
    });

    const updatePromises = getODsData.map((record) =>
      ODSchema.updateOne(
        { _id: record._id },
        {
          $set: {
            updatedAt: getISTDateAndTime(),
            statusId: updateStatusId,
            ...(isAccepted && isAccepted === false && { leaveRequestId: null }),
          },
        }
      )
    );

    const results = await Promise.all(updatePromises);
    // console.log(results);

    return {
      status: true,
      message: `${results.length / 2} OD records updated successfully`,
      data: results,
    };
  } catch (error) {
    console.error("Error updating OD data:", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to get employee CLs and ODs
const getWorkingDays = async (req, res) => {
  try {
    // console.log("Current Working Days Calculation");
    // console.log("Request Body:", req.body);
    const { startDate, endDate, isHalfDay } = req.body;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Start date cannot be after end date" });
    }

    // console.log("Start Date:", startDate);
    // console.log("End Date:", endDate);

    const fromDateStrat = new Date(startDate);
    fromDateStrat.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log("From Date Start (UTC):", fromDateStrat);
    // console.log("To Date End (UTC):", toDateEnd);

    const holidays = await holidaysSchema.aggregate([
      {
        $match: {
          orgId : new ObjectId(req?.user?.orgId),
          fromDate: { $lte: toDateEnd },
          toDate: { $gte: fromDateStrat },
        },
      },
    ]);

    const holidayDates = holidays
      .map((holiday) => {
        const dates = [];
        let currentDate = new Date(holiday.fromDate);
        const endDate = new Date(holiday.toDate);
        while (currentDate <= endDate) {
          dates.push(currentDate.toISOString().split("T")[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
      })
      .flat();

    const holidaySet = new Set(holidayDates);

    const msInDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((toDateEnd - fromDateStrat) / msInDay) + 1;

    let actualWorkingDays = 0;
    let current = new Date(fromDateStrat);

    while (current <= toDateEnd) {
      const formatted = current.toISOString().split("T")[0];
      const isSunday = current.getDay() === 0;
      const isHoliday = holidaySet.has(formatted);

      if (!isSunday && !isHoliday) {
        // console.log("This date is counted as a working day:", formatted);
        actualWorkingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    if (isHalfDay) {
      actualWorkingDays = actualWorkingDays > 0 ? actualWorkingDays - 0.5 : 0;
    }

    // console.log("Total Days:", totalDays);
    // console.log("Actual Working Days:", actualWorkingDays);

    return res.status(200).json({ totalDays, actualWorkingDays });
  } catch (error) {
    console.error("Error calculating working days:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to add a new leave request
// const addLeaveRequest = async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       isHalfDay,
//       halfDayPeriod,
//       leaveReason,
//       leaveTypeId,
//       totalDays,
//       actualWorkingDays,
//       // temporaryAssignmentId,
//       considerAs,
//     } = req.body;

//     // console.log("This is the request body", req.body);

//     // Validate required fields
//     if (
//       !leaveTypeId ||
//       !startDate ||
//       !endDate ||
//       // !leaveReason ||
//       !totalDays ||
//       !actualWorkingDays ||
//       !considerAs
//       // !temporaryAssignmentId
//     ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }
//     const employeeId = req?.user?._id;
//     const orgId = req?.user?.orgId;

//     if (new Date(startDate) > new Date(endDate)) {
//       return res
//         .status(400)
//         .json({ message: "Start date cannot be after end date" });
//     }

//     const startDateOnly = new Date(
//       new Date(startDate).getFullYear(),
//       new Date(startDate).getMonth(),
//       new Date(startDate).getDate()
//     );

//     const monthStart = new Date(
//       new Date().getFullYear(),
//       new Date().getMonth(),
//       1
//     );

//     if (startDateOnly < monthStart) {
//       return res.status(400).json({
//         message: `You are not able to select the past date of ${startDate}.`,
//       });
//     }

//     if (isHalfDay && !halfDayPeriod) {
//       return res
//         .status(400)
//         .json({ message: "Half day period is required for half day leave" });
//     }

//     const fromDateStrat = new Date(startDate);
//     fromDateStrat.setUTCHours(0, 0, 0, 0);
//     const toDateEnd = new Date(endDate);
//     toDateEnd.setUTCHours(23, 59, 59, 999);

//     const [
//       acceptedStatusId,
//       vacationTypeId,
//       rejectedStatusId,
//       cancelledStatusId,
//     ] = await Promise.all([
//       statusTypeSchema.findOne({ orgId, statusType: "ACCEPTED" }, { _id: 1 }),
//       leaveTypeSchema.findOne({ orgId, leaveType: "VACATION" }, { _id: 1 }),
//       statusTypeSchema.findOne({ orgId, statusType: "REJECTED" }, { _id: 1 }),
//       statusTypeSchema.findOne({ orgId, statusType: "CANCELLED" }, { _id: 1 }),
//     ]);

//     if (!acceptedStatusId || !vacationTypeId) {
//       return res
//         .status(400)
//         .json({ message: "Accepted Status or Vacation Type not found" });
//     }

//     const [
//       existingLeaveRequests,
//       PendingstatusId,
//       existingPermissionRequests,
//       existingAttendenceRecord,
//     ] = await Promise.all([
//       leaveRequestSchema.find({
//         employeeId,
//         statusId: {
//           $nin: [
//             new ObjectId(rejectedStatusId._id),
//             new ObjectId(cancelledStatusId._id),
//           ],
//         },
//         startDate: { $lte: toDateEnd },
//         endDate: { $gte: fromDateStrat },
//       }),
//       statusTypeSchema.findOne({ statusType: "PENDING" }, { _id: 1 }),
//       permissionSchema.find({
//         employeeId,
//         statusId: {
//           $nin: [
//             new ObjectId(rejectedStatusId._id),
//             new ObjectId(cancelledStatusId._id),
//           ],
//         },
//         startDate: { $lte: toDateEnd },
//         endDate: { $gte: fromDateStrat },
//       }),
//       dailyAttendenceSchema.find({
//         employeeId,
//         $or: [
//           { logInTime: { $gte: fromDateStrat, $lte: toDateEnd } },
//           { logOutTime: { $gte: fromDateStrat, $lte: toDateEnd } },
//         ],
//       }),
//     ]);

//     // console.log("This is existingLeaveRequests", existingLeaveRequests);

//     // Check for existing leave requests
//     if (existingLeaveRequests.length > 0) {
//       return res.status(400).json({
//         message: "Leave request already exists for the specified period",
//       });
//     }

//     if (existingPermissionRequests.length > 0) {
//       return res.status(400).json({
//         message: "Permission Request already exists for the specified period",
//       });
//     }

//     if (isHalfDay === false && existingAttendenceRecord.length > 0) {
//       return res.status(400).json({
//         message:
//           "You have already marked your attendance for the specified period",
//       });
//     }

//     const startOfMonth = changeGTMtoIST(
//       new Date(new Date().getFullYear(), new Date().getMonth(), 1)
//     );

//     const now = new Date();
//     const joinDate = new Date(req?.user?.dateOfJoining);

//     const yearsOfService = now.getFullYear() - joinDate.getFullYear();

//     if (leaveTypeId.toString() === vacationTypeId._id.toString()) {
//       console.log(
//         "This is Vacation Leave with Year of Service:",
//         yearsOfService,
//         "employeeId:",
//         employeeId
//       );

//       if (yearsOfService < 1) {
//         return res.status(400).json({
//           message:
//             "You are not allowed to apply for Vacation Leave through this portal. Please contact HR for Vacation Leave requests.",
//         });
//       }

//       return res.status(502).json({
//         message:
//           "Vacation Leave application is currently disabled. Please contact HR for Vacation Leave requests.",
//       });

//       const startOfYear = new Date(new Date().getFullYear(), 0, 1);

//       const alreadyExist = await leaveRequestSchema.findOne({
//         employeeId,
//         leaveTypeId: vacationTypeId._id,
//         statusId: acceptedStatusId._id,
//         startDate: { $gte: startOfYear },
//         endDate: { $lte: toDateEnd },
//       });

//       if (alreadyExist) {
//         return res.status(400).json({
//           message:
//             "You have already applied for Vacation Leave this year. Please contact HR for further Vacation Leave requests.",
//         });
//       }
//     }

//     const requiredData = await getNotifyToData(
//       req?.user?.teamId,
//       req?.user?.roleId,
//       req?.user?.orgId
//     );

//     if (!requiredData.status) {
//       return res.status(500).json({
//         message: "Failed to get notifyTo data",
//         error: requiredData.message,
//       });
//     }

//     if (
//       !requiredData.data ||
//       !requiredData.data.notifyTo ||
//       requiredData.data.notifyTo.length === 0
//     ) {
//       return res
//         .status(400)
//         .json({ message: "No one to notify, Please contact Admin" });
//     }

//     //!need to verify the considerAs field

//     const [
//       clStatusId,
//       odStatusId,
//       lopStatusId,
//       CL_ODStatusId,
//       vacationStatusId,
//       activeStatusId,
//       processingStatusId,
//     ] = await Promise.all([
//       leaveConsiderationType.findOne(
//         { orgId, considerTypeCode: "CL" },
//         { _id: 1 }
//       ),
//       leaveConsiderationType.findOne(
//         { orgId, considerTypeCode: "OD" },
//         { _id: 1 }
//       ),
//       leaveConsiderationType.findOne(
//         { orgId, considerTypeCode: "LOP" },
//         { _id: 1 }
//       ),
//       leaveConsiderationType.findOne(
//         { orgId, considerTypeCode: "CL&OD" },
//         { _id: 1 }
//       ),
//       leaveConsiderationType.findOne(
//         { orgId, considerTypeCode: "VAC" },
//         { _id: 1 }
//       ),
//       statusTypeSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
//       statusTypeSchema.findOne({ orgId, statusType: "PROCESSING" }, { _id: 1 }),
//     ]);

//     // console.log(clStatusId, odStatusId, lopStatusId, CL_ODStatusId, activeStatusId, processingStatusId);

//     if (
//       !lopStatusId ||
//       !clStatusId ||
//       !odStatusId ||
//       !CL_ODStatusId ||
//       !activeStatusId ||
//       !processingStatusId ||
//       !vacationStatusId
//     ) {
//       return res.status(400).json({
//         message:
//           "One or more required leave types (LOP/CL/OD/CL&OD/ACTIVE/PROCESSING/VAC) not found in system contact Admin",
//       });
//     }

//     // let lopDays = 0;
//     // let considerationTypeId = null;

//     // //considerAs is an objectId
//     // if (considerAs.toString() === clStatusId._id.toString()) {
//     //   // console.log("This is CL");

//     //   // Need to check the available CL balance

//     //   // const cldata = {
//     //   //   availableCl: 0,
//     //   //   requestedCl: 0,
//     //   // };

//     //   const clData = getCLCounts();

//     //   if (!clData) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "CL data not found for employee" });
//     //   }

//     //   if (clData.availableCl <= 0) {
//     //     return res.status(400).json({
//     //       message: `You dont have any CL balance. Please contact HR.`,
//     //     });
//     //   }

//     //   if (clData.availableCl < actualWorkingDays) {
//     //     const lopDays = actualWorkingDays - cldata.availableCl;
//     //     considerationTypeId = lopStatusId._id;
//     //     // console.log("This is lop days", lopDays);
//     //   } else {
//     //     considerationTypeId = clStatusId._id;
//     //   }

//     //   //! need to update the requested CL in CL Schema
//     //   const utilizedCl = actualWorkingDays - lopDays;
//     // } else if (considerAs.toString() === odStatusId._id.toString()) {
//     //   // console.log("This is OD");

//     //   // Need to check the available OD balance

//     //   // const odData = {
//     //   //   availableOd: 0,
//     //   //   requestedOd: 0,
//     //   // };

//     //   const odData = getODCounts();

//     //   if (!odData) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "OD data not found for employee" });
//     //   }

//     //   if (odData.availableOd <= 0) {
//     //     return res.status(400).json({
//     //       message: `You dont have any OD balance. Please contact HR.`,
//     //     });
//     //   }

//     //   if (odData.availableOd < actualWorkingDays) {
//     //     const lopDays = actualWorkingDays - odData.availableOd;
//     //     considerationTypeId = lopStatusId._id;
//     //   } else {
//     //     considerationTypeId = odStatusId._id;
//     //   }

//     //   //! need to update the requested OD in OD Schema

//     //   const utilizedOd = actualWorkingDays - lopDays;
//     // } else if (considerAs.toString() === CL_ODStatusId._id.toString()) {
//     //   // console.log("This is CL&OD");

//     //   // const ODData = {
//     //   //   availableOd: 0,
//     //   //   requestedOd: 0,
//     //   // };

//     //   // const CLData = {
//     //   //   availableCl: 0,
//     //   //   requestedCl: 0,
//     //   // };

//     //   const CLData = getCLCounts();
//     //   const ODData = getODCounts();

//     //   if (!CLData || !ODData) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "CL or OD data not found for employee" });
//     //   }

//     //   if (CLData.availableCl <= 0 && ODData.availableOd <= 0) {
//     //     return res.status(400).json({
//     //       message: `You dont have any CL or OD balance. Please contact HR.`,
//     //     });
//     //   }

//     //   if (CLData.availableCl <= 0) {
//     //     return res.status(400).json({
//     //       message: `You dont have any CL balance. Please contact HR.`,
//     //     });
//     //   }

//     //   if (CLData.availableCl >= actualWorkingDays) {
//     //     return res.status(400).json({
//     //       message: `You have sufficient CL balance. Please apply for CL only.`,
//     //     });
//     //   }

//     //   if (ODData.availableOd <= 0) {
//     //     return res.status(400).json({
//     //       message: `You dont have any OD balance. Please contact HR.`,
//     //     });
//     //   }

//     //   if (ODData.availableOd >= actualWorkingDays) {
//     //     return res.status(400).json({
//     //       message: `You have sufficient OD balance. Please apply for OD only.`,
//     //     });
//     //   }

//     //   let clsConsidered = CLData.availableCl;
//     //   let odsConsidered = 0;

//     //   if (CLData.availableCl + ODData.availableOd < actualWorkingDays) {
//     //     const lopDays = actualWorkingDays - (CLData.availableCl + ODData.availableOd);
//     //     considerationTypeId = lopStatusId._id;
//     //   } else {
//     //     odsConsidered = actualWorkingDays - CLData.availableCl - ODData.availableOd;
//     //     considerationTypeId = CL_ODStatusId._id;
//     //   }
//     //   //! need to update the requested CL and OD in CL and OD Schema
//     // } else if (considerAs.toString() === lopStatusId._id.toString()) {
//     //   const lopDays = actualWorkingDays;
//     //   considerationTypeId = lopStatusId._id;
//     // } else {
//     //   return res.status(400).json({ message: "Invalid considerAs value" });
//     // }

//     // let lopDays = 0;
//     // let considerationTypeId = null;
//     // let utilizedCl = 0;
//     // let utilizedOd = 0;

//     // if (considerAs.toString() === clStatusId._id.toString()) {
//     //   // cl consideration case
//     //   const clData = await getCLCounts(employeeId, activeStatusId._id);

//     //   // console.log("This is CL data from bottom", clData);

//     //   // if (!clData || !clData.status)
//     //   //   return res
//     //   //     .status(400)
//     //   //     .json({ message: clData.message || "CL data not found" });

//     //   if (clData.data <= 0) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You don't have any CL balance. Contact HR." });
//     //   }

//     //   if (clData.data < actualWorkingDays) {
//     //     lopDays = actualWorkingDays - clData.data;
//     //     considerationTypeId = lopStatusId._id;
//     //   } else {
//     //     considerationTypeId = clStatusId._id;
//     //   }

//     //   utilizedCl = actualWorkingDays - lopDays;
//     // } else if (considerAs.toString() === odStatusId._id.toString()) {
//     //   // od consideration case
//     //   const odData = await getODCounts(employeeId, activeStatusId._id);

//     //   // console.log("This is OD data in bottom", odData);
//     //   // if (!odData || !odData.status)
//     //   //   return res.status(400).json({ message: "OD data not found" });

//     //   if (odData.data <= 0) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You don't have any OD balance. Contact HR." });
//     //   }

//     //   if (odData.data < actualWorkingDays) {
//     //     lopDays = actualWorkingDays - odData.data;
//     //     considerationTypeId = lopStatusId._id;
//     //   } else {
//     //     considerationTypeId = odStatusId._id;
//     //   }

//     //   utilizedOd = actualWorkingDays - lopDays;

//     //   //! Need to update the OD Data based on Utilization
//     // } else if (considerAs.toString() === CL_ODStatusId._id.toString()) {
//     //   // cl and od consideration Case
//     //   const CLData = await getCLCounts(employeeId, activeStatusId._id);
//     //   const ODData = await getODCounts(employeeId, activeStatusId._id);

//     //   // if (!CLData || !CLData.status) {
//     //   //   return res
//     //   //     .status(400)
//     //   //     .json({ message: CLData.message || "CL data not found" });
//     //   // }

//     //   // if (!ODData || !ODData.status) {
//     //   //   return res
//     //   //     .status(400)
//     //   //     .json({ message: ODData.message || "OD data not found" });
//     //   // }

//     //   // console.log("This is CL data in bottom", CLData);.

//     //   if (CLData.data <= 0) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You don't have any CL balance. Contact HR." });
//     //   }

//     //   if (actualWorkingDays <= CLData.data) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You have sufficient CL balance. Apply CL only." });
//     //   }

//     //   if (ODData.data <= 0) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You don't have any OD balance. Contact HR." });
//     //   }

//     //   if (actualWorkingDays <= ODData.data) {
//     //     return res
//     //       .status(400)
//     //       .json({ message: "You have sufficient OD balance. Apply OD only." });
//     //   }

//     //   utilizedCl = Math.min(CLData.data, actualWorkingDays);
//     //   let remaining = actualWorkingDays - utilizedCl;
//     //   utilizedOd = Math.min(ODData.data, remaining);
//     //   lopDays = actualWorkingDays - (utilizedCl + utilizedOd);

//     //   if (lopDays > 0) {
//     //     considerationTypeId = lopStatusId._id;
//     //   } else {
//     //     considerationTypeId = CL_ODStatusId._id;
//     //   }
//     // } else if (considerAs.toString() === lopStatusId._id.toString()) {
//     //   // lop consideration case
//     //   lopDays = actualWorkingDays;
//     //   considerationTypeId = lopStatusId._id;
//     // } else if (considerAs.toString() === vacationStatusId._id.toString()) {
//     //   // vacation leave case

//     //   if (leaveTypeId.toString() !== vacationTypeId._id.toString()) {
//     //     return res.status(400).json({
//     //       message: "For Vacation Leave, leaveTypeId must be of VACATION type",
//     //     });
//     //   }

//     //   considerationTypeId = vacationStatusId._id;
//     // } else {
//     //   return res.status(400).json({ message: "Invalid considerAs value" });
//     // }

//     // console.log("Total Days (inclusive):", totalDaysCalc);
//     // console.log("Actual Working Days:", actualWorkingDays);

//     let lopDays = 0;
//     let considerationTypeId = null;
//     let utilizedCl = 0;
//     let utilizedOd = 0;

//     if (leaveTypeId.toString() === vacationTypeId._id.toString()) {
//       // Vacation leave case
//       considerationTypeId = vacationStatusId._id;
//     } else {
//       // Fetch balances
//       const [odData, clData] = await Promise.all([
//         getODCounts(employeeId, activeStatusId._id),
//         getCLCounts(employeeId, activeStatusId._id),
//       ]);

//       let remaining = actualWorkingDays;

//       // Step 1: Use OD first
//       if (odData?.data > 0) {
//         utilizedOd = Math.min(odData.data, remaining);
//         remaining -= utilizedOd;
//       }

//       // Step 2: Use CL next
//       if (remaining > 0 && clData?.data > 0) {
//         utilizedCl = Math.min(clData.data, remaining);
//         remaining -= utilizedCl;
//       }

//       // Step 3: Remaining goes as LOP
//       if (remaining > 0) {
//         lopDays = remaining;
//       }

//       // Final consideration type
//       if (lopDays > 0) {
//         considerationTypeId = lopStatusId._id;
//       } else if (utilizedOd > 0 && utilizedCl > 0) {
//         considerationTypeId = CL_ODStatusId._id;
//       } else if (utilizedOd > 0) {
//         considerationTypeId = odStatusId._id;
//       } else if (utilizedCl > 0) {
//         considerationTypeId = clStatusId._id;
//       } else {
//         return res
//           .status(400)
//           .json({ message: "No leave balance available. Contact HR." });
//       }
//     }

//     const leaveRequest = new leaveRequestSchema({
//       orgId: req?.user?.orgId,
//       employeeId,
//       notifyTo: requiredData.data.notifyTo,
//       leaveTypeId,
//       startDate: fromDateStrat,
//       endDate: toDateEnd,
//       leaveReason: leaveReason || "",
//       totalDays,
//       actualWorkingDays,
//       isHalfDay,
//       // temporaryAssignmentId,
//       lopDays,
//       considerationTypeId,
//       statusId: PendingstatusId._id,
//       createdAt: getISTDateAndTime(),
//       updatedAt: getISTDateAndTime(),
//     });

//     if (halfDayPeriod) {
//       leaveRequest.halfDayPeriod = halfDayPeriod;
//     }

//     await leaveRequest.save();

//     // const data = await getLeaveData(leaveRequest._id);
//     // const tokens = await getNotificationToken(leaveRequest.employeeId);

//     // const [data, tokens] = await Promise.all([
//     //   getLeaveData(leaveRequest._id),
//     //   getNotificationToken(notifyTo),
//     // ]);

//     if (utilizedCl > 0) {
//       const markCL = await markUsedCL(
//         utilizedCl,
//         employeeId,
//         leaveRequest._id,
//         activeStatusId._id,
//         processingStatusId._id
//       );

//       if (!markCL.status) {
//         return res
//           .status(500)
//           .json({ message: "Failed to mark used CL", error: markCL.message });
//       }

//       console.log(" The markCL message is: ", markCL.message);
//     }

//     if (utilizedOd > 0) {
//       const markOD = await markUsedOD(
//         utilizedOd,
//         employeeId,
//         leaveRequest._id,
//         activeStatusId._id,
//         processingStatusId._id
//       );
//       if (!markOD.status) {
//         return res
//           .status(500)
//           .json({ message: "Failed to mark used OD", error: markOD.message });
//       }
//       console.log(" The markOD message is: ", markOD.message);
//     }

//     const data = await getLeaveData(leaveRequest._id);

//     const title = `${data.employee}'s leave Request from ${req.user.firstName}`;
//     const body = `${data.employee} leave request has been forwarded to You. Please review it, ${data}`;
//     const response = await sendNotificationtoTokens(
//       requiredData.data.tokens,
//       title,
//       body,
//       data
//     );
//     if (!response.success) {
//       console.warn("Failed to send notification:", response.error);
//     } else {
//       console.log(
//         `Notification sent successfully to ${requiredData.data.notifyTo}`,
//         data
//       );
//       console.log("This is Title", title);
//       console.log("This is Body", body);
//     }

//     return res
//       .status(201)
//       .json({ message: "leave request added successfully" });
//   } catch (error) {
//     console.error("Error adding leave request:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

const addLeaveRequest = async (req, res) => {
  try {
    // return res.status(503).json({ message: "Currently Under Maintenance" });

    const {
      startDate,
      endDate,
      isHalfDay,
      halfDayPeriod,
      leaveReason,
      leaveTypeId,
      totalDays,
      actualWorkingDays,
      // temporaryAssignmentId,
      // considerAs,
    } = req.body;

    // console.log("This is the request body", req.body);

    // Validate required fields
    if (
      !leaveTypeId ||
      !startDate ||
      !endDate ||
      // !leaveReason ||
      !totalDays ||
      !actualWorkingDays
      //!considerAs
      // !temporaryAssignmentId
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }
    const employeeId = req?.user?._id;
    const orgId = req?.user?.orgId;

    //  Validate date order
    if (new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "End date cannot be earlier than start date" });
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
        .json({ message: "Half day period is required for half day leave" });
    }

    const fromDateStrat = new Date(startDate);
    fromDateStrat.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    const [
      acceptedStatusId,
      vacationTypeId,
      rejectedStatusId,
      cancelledStatusId,
    ] = await Promise.all([
      statusTypeSchema.findOne({ orgId, statusType: "ACCEPTED" }, { _id: 1 }),
      leaveTypeSchema.findOne({ orgId, leaveType: "VACATION" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "REJECTED" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "CANCELLED" }, { _id: 1 }),
    ]);

    if (!acceptedStatusId || !vacationTypeId) {
      return res
        .status(400)
        .json({ message: "Accepted Status or Vacation Type not found" });
    }

    const [
      existingLeaveRequests,
      pendingStatusId,
      existingPermissionRequests,
      existingAttendenceRecord,
    ] = await Promise.all([
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

    // console.log("This is existingLeaveRequests", existingLeaveRequests);

    if (!pendingStatusId) {
      return res
        .status(400)
        .json({ message: "Pending Status Id's are missin" });
    }

    // Check for existing leave requests
    if (existingLeaveRequests.length > 0) {
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

    const now = new Date();
    const joinDate = new Date(req?.user?.dateOfJoining);

    const yearsOfService = now.getFullYear() - joinDate.getFullYear();

    if (leaveTypeId.toString() === vacationTypeId._id.toString()) {
      console.log(
        "This is Vacation Leave with Year of Service:",
        yearsOfService,
        "employeeId:",
        employeeId
      );

      if (yearsOfService < 1) {
        return res.status(400).json({
          message:
            "You Don't have enough tenure to apply for Vacation Leave through this portal. Please contact HR for Vacation Leave requests.",
        });
      }

      // console.log("Environment:", process.env.NODE_ENV);
      // console.log("Vacation Leave application check");
      // console.log(typeof process.env.NODE_ENV);
      // console.log(process.env.NODE_ENV != 'staging');

      // if (process.env.NODE_ENV !== "staging") {
      // return res.status(403).json({
      //   message:
      //     "Vacation Leave application is currently disabled. Please contact HR for Vacation Leave requests.",
      // });
      // }

      const startOfYear = new Date(new Date().getFullYear(), 0, 1);

      const alreadyExist = await leaveRequestSchema.findOne({
        employeeId,
        leaveTypeId: vacationTypeId._id,
        statusId: {
          $nin: [
            new ObjectId(rejectedStatusId._id),
            new ObjectId(cancelledStatusId._id),
          ],
        },
        startDate: { $gte: startOfYear },
        endDate: { $lte: toDateEnd },
      });

      if (alreadyExist) {
        return res.status(400).json({
          message:
            "You have already applied for Vacation Leave this year. Please contact HR for further Vacation Leave requests.",
        });
      }

      // return res.status(403).json({
      //   message:
      //     "Vacation Leave application is currently disabled. Please contact HR for Vacation Leave requests.",
      // });
    }

    const [
      clStatusId,
      odStatusId,
      lopStatusId,
      CL_ODStatusId,
      vacationStatusId,
      activeStatusId,
      processingStatusId,
    ] = await Promise.all([
      leaveConsiderationType.findOne(
        { orgId, considerTypeCode: "CL" },
        { _id: 1 }
      ),
      leaveConsiderationType.findOne(
        { orgId, considerTypeCode: "OD" },
        { _id: 1 }
      ),
      leaveConsiderationType.findOne(
        { orgId, considerTypeCode: "LOP" },
        { _id: 1 }
      ),
      leaveConsiderationType.findOne(
        { orgId, considerTypeCode: "CL&OD" },
        { _id: 1 }
      ),
      leaveConsiderationType.findOne(
        { orgId, considerTypeCode: "VAC" },
        { _id: 1 }
      ),
      statusTypeSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
      statusTypeSchema.findOne({ orgId, statusType: "PROCESSING" }, { _id: 1 }),
    ]);

    // console.log(clStatusId, odStatusId, lopStatusId, CL_ODStatusId, activeStatusId, processingStatusId);

    if (
      !lopStatusId ||
      !clStatusId ||
      !odStatusId ||
      !CL_ODStatusId ||
      !activeStatusId ||
      !processingStatusId ||
      !vacationStatusId
    ) {
      return res.status(400).json({
        message:
          "One or more required leave types (LOP/CL/OD/CL&OD/ACTIVE/PROCESSING/VAC) not found in system contact Admin",
      });
    }

    let utilizedCl = 0;
    let utilizedOd = 0;
    let lopDays = 0;
    let considerationTypeId = null;

    if (leaveTypeId.toString() !== vacationTypeId._id.toString()) {
      const [odBalance, clBalance] = await Promise.all([
        getODCounts(employeeId, activeStatusId._id),
        getCLCounts(employeeId, activeStatusId._id),
      ]);

      const odAvailable = odBalance?.data || 0;
      const clAvailable = clBalance?.data || 0;

      let remaining = actualWorkingDays;

      if (odAvailable > 0) {
        utilizedOd = Math.min(remaining, odAvailable);
        remaining -= utilizedOd;
      }

      if (remaining > 0 && clAvailable > 0) {
        utilizedCl = Math.min(remaining, clAvailable);
        remaining -= utilizedCl;
      }

      if (remaining > 0) {
        lopDays = remaining;
      }

      if (utilizedOd > 0 && utilizedCl > 0) {
        considerationTypeId = CL_ODStatusId._id;
      } else if (utilizedOd > 0) {
        considerationTypeId = odStatusId._id;
      } else if (utilizedCl > 0) {
        considerationTypeId = clStatusId._id;
      } else {
        considerationTypeId = lopStatusId._id;
        lopDays = actualWorkingDays;
      }
    } else {
      considerationTypeId = vacationStatusId._id;
    }

    const requiredData = await getNotifyToData(
      req?.user?.teamId,
      req?.user?.roleId,
      req?.user?.orgId
    );


    // console.log("This is requiredData notifyTo:", requiredData.data.notifyTo);
    // console.log("This is requiredData tokens:", requiredData.data.tokens);

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

    const leaveRequest = new leaveRequestSchema({
      orgId: req?.user?.orgId,
      employeeId,
      notifyTo: requiredData.data.notifyTo,
      leaveTypeId,
      startDate: fromDateStrat,
      endDate: toDateEnd,
      leaveReason: leaveReason || "",
      totalDays,
      actualWorkingDays,
      isHalfDay,
      odDays: utilizedOd,
      clDays: utilizedCl,
      lopDays,
      considerationTypeId,
      statusId: pendingStatusId._id,
      createdBy: employeeId,
      updatedBy: employeeId,
    });

    if (halfDayPeriod) {
      leaveRequest.halfDayPeriod = halfDayPeriod;
    }

    await leaveRequest.save();

    logger.info(
      `Leave request with reason '${leaveReason}' created by user ${req.user.firstName} ${req.user.lastName}`
    );
    // const data = await getLeaveData(leaveRequest._id);
    // const tokens = await getNotificationToken(leaveRequest.employeeId);

    // const [data, tokens] = await Promise.all([
    //   getLeaveData(leaveRequest._id),
    //   getNotificationToken(notifyTo),
    // ]);

    if (utilizedCl > 0) {
      const markCL = await markUsedCL(
        utilizedCl,
        employeeId,
        leaveRequest._id,
        activeStatusId._id,
        processingStatusId._id
      );

      if (!markCL.status) {
        return res
          .status(500)
          .json({ message: "Failed to mark used CL", error: markCL.message });
      }

      console.log(" The markCL message is: ", markCL.message);
    }

    if (utilizedOd > 0) {
      const markOD = await markUsedOD(
        utilizedOd,
        employeeId,
        leaveRequest._id,
        activeStatusId._id,
        processingStatusId._id
      );
      if (!markOD.status) {
        return res
          .status(500)
          .json({ message: "Failed to mark used OD", error: markOD.message });
      }
      console.log(" The markOD message is: ", markOD.message);
    }

    const data = await getLeaveData(leaveRequest._id);

    const title = `${data.employee}'s leave Request from ${req.user.firstName}`;
    const body = `${data.employee} leave request has been forwarded to You. Please review it.`;
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
        `Notification sent successfully to ${requiredData.data.notifyTo}`
      );
      // console.log("This is Title", title);
      // console.log("This is Body", body);
    }

    return res
      .status(201)
      .json({ message: "leave request added successfully" });
  } catch (error) {
    console.error("Error adding leave request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to process a leave request (approve/reject/Forward)
const processLeaveRequest = async (req, res) => {
  try {
    // return res.status(503).json({ message: "Currently Under Maintenance" });

    const { leaveRequestId, statusId, actionReason } = req.body;

    const employeeId = req?.user?._id;

    // Validate required fields
    if (!leaveRequestId || !statusId) {
      return res.status(400).json({
        message: "leave request ID and status ID are required",
      });
    }

    // Validate statusId
    // const status = await statusTypeSchema.findById(
    //   { _id: statusId },
    //   { statusType: 1 }
    // );

    // // Find the leave request
    // const leaveRequest = await leaveRequestSchema.findById(leaveRequestId);
    // if (!leaveRequest) {
    //   return res.status(404).json({ message: "leave request not found" });
    // }

    // // Get the Pending status ID
    // const PendingstatusId = await statusTypeSchema.findOne(
    //   { statusType: "PENDING" },
    //   { _id: 1 }
    // );

    const [status, leaveRequest, superAdmin] = await Promise.all([
      statusTypeSchema.findById({ _id: statusId }, { statusType: 1 }),
      leaveRequestSchema.findById(leaveRequestId),
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

    if (!leaveRequest) {
      return res.status(404).json({ message: "leave request not found" });
    }

    if (
      !leaveRequest.notifyTo.includes(employeeId) &&
      req.user.privilegeId.toString() !== superAdmin[0]._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to process this request" });
    }

    // if (status.statusType === statusTyes.ESCALATED && !notifyTo) {
    //   return res
    //     .status(400)
    //     .json({ message: "NotifyTo is required for escalated requests" });
    // }

    // if (
    //   notifyTo !== undefined &&
    //   notifyTo.toString() === leaveRequest.employeeId.toString()
    // ) {
    //   return res
    //     .status(400)
    //     .json({
    //       message:
    //         "You cannot forward the request to the same employee who raised it.",
    //     });
    // }

    const actionList = {
      actionedBy: employeeId,
      statusId,
      actionReason: actionReason || "",
      createdAt: getISTDateAndTime(),
    };

    leaveRequest.approvalList.push(actionList);

    // console.log("this is leave request", leaveRequest);
    // leaveRequest.approvalList[
    //   leaveRequest.approvalList.length - 1
    // ].actionReason = actionReason;
    // leaveRequest.approvalList[leaveRequest.approvalList.length - 1].statusId =
    //   statusId;
    // leaveRequest.approvalList[leaveRequest.approvalList.length - 1].updatedAt =
    //   getISTDateAndTime();

    //!check this logic once
    // if (status.statusType === statusTyes.ESCALATED && notifyTo) {
    //   leaveRequest.approvalList.push({
    //     actionedBy: notifyTo,
    //     statusId: PendingstatusId._id,
    //     actionReason: "",
    //   });
    // }

    leaveRequest.statusId = statusId;
    leaveRequest.actionReason = actionReason;
    leaveRequest.actionedBy = employeeId;
    leaveRequest.actionedAt = getISTDateAndTime();

    // leaveRequest.notifyTo = notifyTo ? notifyTo : leaveRequest.notifyTo;

    if (
      status.statusType === statusTyes.ACCEPTED ||
      status.statusType === statusTyes.REJECTED
    ) {
      // leaveRequest.actionedBy = employeeId;
      // leaveRequest.actionedAt = getISTDateAndTime();
      //!Send Push Notification TO Employee

      // const data = await getLeaveData(leaveRequest._id);
      // const tokens = await getNotificationToken(leaveRequest.employeeId);

      leaveRequest.notifyTo = [employeeId];

      const [
        data,
        tokens,
        // , temporaryAssignment
      ] = await Promise.all([
        getLeaveData(leaveRequest._id),
        getNotificationToken(leaveRequest.employeeId),
        // new temporaryAssignmentSchema({
        //   employeeId: leaveRequest.employeeId,
        //   temporaryHeadId: leaveRequest.temporaryAssignmentId,
        //   leaveRequestId: leaveRequest._id,
        // }),
      ]);

      const orgId = req?.user?.orgId;
      const [inActiveStatusId, activeStatusId, processingStatusId] =
        await Promise.all([
          statusTypeSchema.findOne(
            { orgId, statusType: "INACTIVE" },
            { _id: 1 }
          ),
          statusTypeSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
          statusTypeSchema.findOne(
            { orgId, statusType: "PROCESSING" },
            { _id: 1 }
          ),
        ]);

      if (!inActiveStatusId || !activeStatusId || !processingStatusId) {
        return res.status(500).json({
          message:
            "Required status types (INACTIVE/ACTIVE/PROCESSING) not found",
        });
      }

      const targetStatusId =
        status.statusType === statusTyes.ACCEPTED
          ? inActiveStatusId._id
          : activeStatusId._id;

      const [unmarkCL, unmarkOD] = await Promise.all([
        unmarkUsedCL(
          leaveRequest.orgId,
          leaveRequest.employeeId,
          leaveRequest._id,
          processingStatusId._id,
          targetStatusId,
          status.statusType === statusTyes.ACCEPTED
        ),
        unmarkUsedOD(
          leaveRequest.orgId,
          leaveRequest.employeeId,
          leaveRequest._id,
          processingStatusId._id,
          targetStatusId,
          status.statusType === statusTyes.ACCEPTED
        ),
      ]);

      if (!unmarkCL.status || !unmarkOD.status) {
        return res.status(500).json({
          message: "Failed to unmark leaves",
          errors: {
            cl: unmarkCL.message,
            od: unmarkOD.message,
          },
        });
      }

      const title = `Update On Your leave Request`;
      const body = `Your leave Request has been ${status.statusType}. Please review it.`;
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
      // console.log(`Forwarding leave request to ${notifyTo}`);
      // const data = await getLeaveData(leaveRequest._id);
      // const tokens = await getNotificationToken(notifyTo);

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
      if (leaveRequest.employeeId.toString() in requiredData.data.notifyTo) {
        return res.status(400).json({
          message:
            "You cannot forward the request to the same employee who raised it.",
        });
      }

      // filter the notify to array to remove the employee who have already actioned the request

      // console.log(leaveRequest.approvalList);
      const approvalIds = leaveRequest.approvalList
        .map((item, index) => {
          if (index === leaveRequest.approvalList.length - 1) return;
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

      leaveRequest.notifyTo = filteredNotifyTo;

      // const [data, tokens] = await Promise.all([
      //   getLeaveData(leaveRequest._id),
      //   getNotificationToken(notifyTo),
      // ]);

      const data = await getLeaveData(leaveRequest._id);
      const title = `${data.employee}'s leave Request Forwarded from ${req.user.firstName} to You`;
      const body = `${data.employee}'s leave request has been forwarded to You. Please review it.`;

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

    leaveRequest.updatedAt = getISTDateAndTime();
    await leaveRequest.save();
    logger.info(
      `Leave request with ID '${leaveRequestId}' processed by user ${req.user.firstName} ${req.user.lastName} with status ${status.statusType}`
    );
    return res
      .status(200)
      .json({ message: "leave request processed successfully" });
  } catch (error) {
    console.error("Error while processing leave request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to delete a leave request
const deleteLeaveRequest = async (req, res) => {
  try {
    // return res.status(503).json({ message: "Currently Under Maintenance" });

    const { leaveRequestId } = req.params;
    const employeeId = req?.user?._id;

    if (!leaveRequestId) {
      return res.status(400).json({ message: "Leave request ID is required" });
    }

    const [leaveRequest, acceptedStatus] = await Promise.all([
      leaveRequestSchema.findById(leaveRequestId),
      statusTypeSchema.findOne(
        { orgId: req?.user?.orgId, statusType: "ACCEPTED" },
        { _id: 1 }
      ),
    ]);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (!acceptedStatus) {
      return res.status(500).json({ message: "ACCEPTED status not found" });
    }

    // Restrict deletion for past or ongoing leave
    if (getISTDateAndTime() >= leaveRequest.startDate) {
      return res.status(400).json({
        message: "You cannot delete past or ongoing leave requests.",
      });
    }

    // Authorization check
    if (
      leaveRequest.employeeId.toString() === employeeId.toString() ||
      (leaveRequest.statusId.toString() === acceptedStatus._id.toString() &&
        leaveRequest.actionedBy.toString() === employeeId.toString())
    ) {
      const orgId = req?.user?.orgId;
      const [processingStatusId, activeStatusId, inActiveStatusId] =
        await Promise.all([
          statusTypeSchema.findOne(
            { orgId, statusType: "PROCESSING" },
            { _id: 1 }
          ),
          statusTypeSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
          statusTypeSchema.findOne(
            { orgId, statusType: "INACTIVE" },
            { _id: 1 }
          ),
        ]);

      if (!processingStatusId || !activeStatusId || !inActiveStatusId) {
        return res.status(500).json({
          message:
            "Required status types (PROCESSING/ACTIVE/INACTIVE) not found",
        });
      }

      let fromStatusId;
      if (leaveRequest.statusId.toString() === acceptedStatus._id.toString()) {
        fromStatusId = inActiveStatusId._id;
      } else {
        fromStatusId = processingStatusId._id;
      }

      const [unmarkCL, unmarkOD] = await Promise.all([
        unmarkUsedCL(
          leaveRequest.orgId,
          leaveRequest.employeeId,
          leaveRequest._id,
          fromStatusId,
          activeStatusId._id
        ),
        unmarkUsedOD(
          leaveRequest.orgId,
          leaveRequest.employeeId,
          leaveRequest._id,
          fromStatusId,
          activeStatusId._id
        ),
      ]);

      if (!unmarkCL.status || !unmarkOD.status) {
        console.log("Error in unmarkCL", unmarkCL);
        console.log("Error in unmarkOD", unmarkOD);
        return res.status(500).json({
          message: "Failed to unmark leaves",
          errors: {
            cl: unmarkCL.message,
            od: unmarkOD.message,
          },
        });
      }

      await leaveRequest.deleteOne();
      logger.info(
        `Leave request with ID '${leaveRequestId}' deleted by user ${req.user.firstName} ${req.user.lastName}`
      );
      return res
        .status(200)
        .json({ message: "Leave request deleted successfully" });
    } else {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this request" });
    }
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get leave requests for an employee within a date range
const getEmployeeLeaveRequests = async (req, res) => {
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

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);

    // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // toDateEnd.setTime(toDateEnd.getTime() + IST_OFFSET);

    // Validate date range

    if (new Date(fromDateStart) > new Date(toDateEnd)) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const leaveRequests = await leaveRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          $or: [
            {
              createdAt: {
                $gte: fromDateStart,
                $lte: toDateEnd,
              },
            },
            {
              startDate: {
                $lte: toDateEnd,
              },
              endDate: {
                $gte: fromDateStart,
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
          from: "leavetypes",
          localField: "leaveTypeId",
          foreignField: "_id",
          as: "leaveType",
        },
      },
      {
        $lookup: {
          from: "leaveconsiderations",
          localField: "considerationTypeId",
          foreignField: "_id",
          as: "considerationInfo",
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
        $addFields: {
          notifyTo: "$notifyToDetails.fullName",
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          leaveReason: 1,
          isHalfDay: 1,
          actionReason: 1,
          halfDayPeriod: 1,
          createdAt: 1,
          updatedAt: 1,
          actualWorkingDays: 1,
          Status: { $first: "$Status.statusType" },
          leaveType: {
            $first: "$leaveType.leaveType",
          },
          consideration: {
            $first: "$considerationInfo.considerTypeCode",
          },
          notifyTo: 1,
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
      message: "Employees Leave Requests Data feteched Successfully",
      data: leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching employee leave requests:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get leave requests that require action from the logged-in employee
const getActionRequiredLeaves = async (req, res) => {
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

    const pendingRequests = await leaveRequestSchema.aggregate([
      {
        $match: {
          notifyTo: new ObjectId(employeeId),
          $or: [
            {
              createdAt: {
                $gte: fromDateStart,
                $lte: toDateEnd,
              },
            },
            {
              startDate: {
                $lte: toDateEnd,
              },
              endDate: {
                $gte: fromDateStart,
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
          from: "leavetypes",
          localField: "leaveTypeId",
          foreignField: "_id",
          as: "leaveType",
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
          from: "leaveconsiderations",
          localField: "considerationTypeId",
          foreignField: "_id",
          as: "considerationInfo",
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          leaveReason: 1,
          isHalfDay: 1,
          halfDayPeriod: 1,
          actionReason: 1,
          actualWorkingDays: 1,
          createdAt: 1,
          updatedAt: 1,
          lopDays: 1,
          consideration: { $first: "$considerationInfo.considerTypeCode" },
          Status: { $first: "$Status.statusType" },
          leaveType: { $first: "$leaveType.leaveType" },
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
    console.error("Error fetching leave actions:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get leave request flow
const getLeaveRequestFlow = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;

    // Validate leave request ID
    if (!leaveRequestId || !mongoose.Types.ObjectId.isValid(leaveRequestId)) {
      return res.status(400).json({ message: "Invalid leave request ID" });
    }

    // Find the leave request
    const leaveRequestFlow = await leaveRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(leaveRequestId),
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
      message: "Leave request flow fetched successfully",
      data: leaveRequestFlow,
    });
  } catch (error) {
    console.error("Error fetching leave request flow:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Dummy notification for testing
const dummyNotification = async (req, res) => {
  const { employeeCode } = req.body;
  const title = "Dummy Notification";
  const body = "This is a dummy notification for testing purposes.";
  // const token = await firebaseMessageingTockenSchema.find({employeeId: req.user._id}, {token: 1});
  // const tokens = await firebaseMessageingTockenSchema.aggregate([
  //   {
  //     $match: {
  //       employeeId: new ObjectId(req.user._id),
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       tokens: {
  //         $push: "$token",
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       tokens: 1,
  //     },
  //   },
  // ]);

  const employee = await employeeSchema.findOne(
    { employeeCode: employeeCode },
    { _id: 1 }
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }


  
  // console.log("This is employee ", employee);
  const tokens = await getNotificationToken(employee._id);


  // console.log("Notification tokens:", tokens);
  const response = await sendNotificationtoTokens(
    tokens,
    title,
    body
  );
  // console.log("Notification response:", response);
  if (response.success) {
    console.log("Dummy notification sent successfully");
    res.status(200).json({ message: "Dummy notification sent successfully" });
  } else {
    console.log("Failed to send dummy notification:", response);
    res
      .status(500)
      .json({ message: "Failed to send dummy notification", response });
  }
};

// Function to add Temporary Assignment ID to Leave Request
const addTemporaryAssignmentIdToLeaveRequest = async (leaveId, employeeId) => {
  try {
    await leaveRequestSchema.findByIdAndUpdate(leaveId, {
      $set: {
        temporaryAssignmentId: employeeId,
      },
    });
    console.log("Temporary Assignment ID added to Leave Request successfully");
  } catch (err) {
    console.error(
      "Error adding temporary assignment ID to leave request:",
      err
    );
  }
};

// i need to send all the employees who are not in leave we need to check that from the leave Request collection
const getTemporaryAssignmentData = async (req, res) => {
  try {
    const privilegeId = req.user.privilegeId;
    const employees = await employeeSchema.aggregate([
      {
        $match: {
          _id: { $ne: req.user._id },
          privilegeId: privilegeId,
          orgId: req.user.orgId,
        },
      },
      {
        $project: {
          _id: 0,
          employeeCode: 1,
          employeeId: "$_id",
          employeeName: {
            $concat: ["$firstName", " ", "$lastName"],
          },
        },
      },
    ]);
    return res.status(200).json({
      message: "Temporary assignment data fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.log("Error While Getting the Temporary Assignment Data", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to cancel a leave request
const cancelLeaveRequest = async (req, res) => {
  try {
    // return res.status(503).json({ message: "Currently Under Maintenance" });

    const { leaveRequestId } = req.body;
    const employeeId = req?.user?._id;

    if (!leaveRequestId) {
      return res.status(400).json({ message: "Leave request ID is required" });
    }

    const [leaveRequest, acceptedStatus, superAdmin] = await Promise.all([
      leaveRequestSchema.findOne({ _id: leaveRequestId }),
      statusTypeSchema.findOne(
        { orgId: req?.user?.orgId, statusType: "ACCEPTED" },
        { _id: 1 }
      ),
      privilegeSchema.find({ orgId: req.user.orgId, name: "SUPERADMIN" }),
    ]);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (!acceptedStatus) {
      return res.status(500).json({ message: "ACCEPTED status not found" });
    }

    if (
      getISTDateAndTime() >= leaveRequest.startDate &&
      leaveRequest.statusId.toString() === acceptedStatus._id.toString()
    ) {
      if (leaveRequest.isHalfDay) {
        const employeeShiftDate = await employeeSchema.aggregate([
          {
            $match: {
              _id: new ObjectId(leaveRequest.employeeId),
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
              start: "$shiftInfo.startTime",
              breakEnd: "$shiftInfo.breakTimeEnd",
            },
          },
        ]);

        date = getISTDateAndTime().toISOString().split("T")[0];

        const shiftStart = new Date(
          `${date}T${employeeShiftDate[0].start}:00.000Z`
        );
        const shiftBreakEnd = new Date(
          `${date}T${employeeShiftDate[0].breakEnd}:00.000Z`
        );
        if (leaveRequest.halfDayPeriod === "1STHALF") {
          if (getISTDateAndTime() <= shiftStart) {
            return res.status(400).json({
              message:
                "You cannot cancel your 1st half leave request after your shift has started.",
            });
          }
        } else if (leaveRequest.halfDayPeriod === "2NDHALF") {
          if (getISTDateAndTime() <= shiftBreakEnd) {
            return res.status(400).json({
              message:
                "You cannot cancel your 2nd half leave request after your shift has started.",
            });
          }
        }
      }

      return res.status(400).json({
        message: "You cannot cancel past or ongoing leave requests.",
      });
    }

    const isOwner =
      leaveRequest.employeeId.toString() === employeeId.toString();
    const isActioner =
      leaveRequest.statusId.toString() === acceptedStatus._id.toString() &&
      leaveRequest.actionedBy?.toString() === employeeId.toString();

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

    const previousStatusId = leaveRequest.statusId;

    leaveRequest.statusId = cancelledStatus._id;
    leaveRequest.updatedAt = getISTDateAndTime();
    leaveRequest.actionedBy = employeeId;

    const orgId = req?.user?.orgId;
    const [processingStatusId, activeStatusId, inActiveStatusId] =
      await Promise.all([
        statusTypeSchema.findOne(
          { orgId, statusType: "PROCESSING" },
          { _id: 1 }
        ),
        statusTypeSchema.findOne({ orgId, statusType: "ACTIVE" }, { _id: 1 }),
        statusTypeSchema.findOne({ orgId, statusType: "INACTIVE" }, { _id: 1 }),
      ]);

    if (!processingStatusId || !activeStatusId || !inActiveStatusId) {
      return res.status(500).json({
        message: "Required status types (PROCESSING/ACTIVE/INACTIVE) not found",
      });
    }

    const fromStatusId =
      previousStatusId.toString() === acceptedStatus._id.toString()
        ? inActiveStatusId._id
        : processingStatusId._id;

    const [unmarkCL, unmarkOD] = await Promise.all([
      unmarkUsedCL(
        leaveRequest.orgId,
        leaveRequest.employeeId,
        leaveRequest._id,
        fromStatusId,
        activeStatusId._id
      ),
      unmarkUsedOD(
        leaveRequest.orgId,
        leaveRequest.employeeId,
        leaveRequest._id,
        fromStatusId,
        activeStatusId._id
      ),
    ]);

    if (!unmarkCL || !unmarkOD || !unmarkCL.status || !unmarkOD.status) {
      console.log("Error in unmarkCL", unmarkCL);
      console.log("Error in unmarkOD", unmarkOD);
      return res.status(500).json({
        message: "Failed to unmark leaves",
        errors: {
          cl: unmarkCL.message,
          od: unmarkOD.message,
        },
      });
    }

    leaveRequest.updatedAt = getISTDateAndTime();
    await leaveRequest.save();

    logger.info(
      `Leave request with ID '${leaveRequestId}' cancelled by user ${req.user.firstName} ${req.user.lastName}`
    );
    const [tokens, data] = await Promise.all([
      getNotificationToken(leaveRequest.employeeId),
      getLeaveData(leaveRequest._id),
    ]);

    const response = await sendNotificationtoTokens(
      tokens,
      "Leave Request Cancelled",
      `Your leave request from ${new Date(
        leaveRequest.startDate
      ).toDateString()} to ${new Date(
        leaveRequest.endDate
      ).toDateString()} has been cancelled.`,
      data
    );

    if (!response.success) {
      console.warn("Failed to send notification:", response.error);
    }

    return res
      .status(200)
      .json({ message: "Leave request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get NotifyTo names for a leave request
const getNotifyToNames = async (req, res) => {
  try {
    const { leaveRequestId } = req.body;
    if (!leaveRequestId) {
      return res.status(400).json({ message: "leaveRequestId is required" });
    }
    const leaveRequest = await leaveRequestSchema.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const names = await leaveRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(leaveRequestId),
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

const getLeavesData = async (req, res) => {
  try {
    const { fromDate, toDate, leaveType, employeeId, teamId, roleId } =
      req.body;
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "fromDate and toDate are required" });
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return res
        .status(400)
        .json({ message: "fromDate cannot be greater than toDate" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    const matchStage1 = {
      orgId: req.user.orgId,
      startDate: { $lte: toDateEnd },
      endDate: { $gte: fromDateStart },
    };
    const matchStage2 = {};

    if (leaveType) {
      matchStage1.leaveTypeId = new ObjectId(leaveType);
    }

    // use orgId from request user
    const orgId = req.user.orgId;

    const [superAdminDoc, adminDoc, generalDoc] = await Promise.all([
      privilegeSchema.findOne(
        { orgId, name: "SUPERADMIN" },
        { _id: 1, name: 1 }
      ),
      privilegeSchema.findOne({ orgId, name: "ADMIN" }, { _id: 1, name: 1 }),
      privilegeSchema.findOne({ orgId, name: "GENERAL" }, { _id: 1, name: 1 }),
    ]);

    if (!superAdminDoc || !adminDoc || !generalDoc) {
      return res
        .status(400)
        .json({ error: "SUPERADMIN/ADMIN/GENERAL Privilege Is Missing " });
    }

    if (generalDoc._id.toString() === req?.user?.privilegeId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to access this data" });
    }

    const privilegeId = req?.user?.privilegeId;

    if (
      adminDoc._id.toString() === privilegeId.toString() &&
      req?.user?.teamId
    ) {
      matchStage2["employeeInfo.teamId"] = new ObjectId(req?.user?.teamId);
    }

    if (employeeId) {
      const employee = await employeeSchema.findOne(
        { _id: new ObjectId(employeeId) },
        { teamId: 1 }
      );
      if (!employee) {
        return res.status(400).json({ message: "Empoyee not found" });
      }

      if (req?.user?.teamId) {
        if (req?.user?.teamId !== employee?.teamId?.toString()) {
          return res
            .status(403)
            .json({ error: "You are not authorized to access this data" });
        }
      }

      if (
        privilegeId.toString() !== superAdminDoc._id.toString() &&
        req?.user?.teamId?.toString() !== employee?.teamId?.toString()
      ) {
        return res
          .status(403)
          .json({ error: "You are not authorized to access this data" });
      }

      matchStage2["employeeInfo._id"] = new ObjectId(employeeId);
    }
    if (teamId) {
      if (req?.user?.teamId) {
        if (req?.user?.teamId.toString() !== teamId.toString()) {
          return res
            .status(403)
            .json({ error: "You are not authorized to access this data" });
        }
      } else {
        if (privilegeId.toString() !== superAdminDoc._id.toString()) {
          return res
            .status(403)
            .json({ error: "You are not authorized to access this data" });
        }
      }
      matchStage2["employeeInfo.teamId"] = new ObjectId(teamId);
    }
    if (roleId) {
      if (privilegeId.toString() !== superAdminDoc._id.toString()) {
        return res
          .status(403)
          .json({ error: "You are not authorized to access this data" });
      }
      matchStage2["employeeInfo.roleId"] = new ObjectId(roleId);
    }

    // make a working matchStage variable (alias of matchStage1)
    const matchStage = matchStage1;

    if (employeeId) {
      matchStage.employeeId = new ObjectId(employeeId);
    }

    // Build an employees pipeline filter for the lookup based on matchStage2
    const employeeLookupPipeline = [];
    // match by actual employee id first (will be supplied via let)
    const empMatchExpr = [{ $eq: ["$_id", "$$empId"] }];
    if (matchStage2["employeeInfo._id"]) {
      empMatchExpr.push({ $eq: ["$_id", matchStage2["employeeInfo._id"]] });
    }
    if (matchStage2["employeeInfo.teamId"]) {
      empMatchExpr.push({
        $eq: ["$teamId", matchStage2["employeeInfo.teamId"]],
      });
    }
    if (matchStage2["employeeInfo.roleId"]) {
      empMatchExpr.push({
        $eq: ["$roleId", matchStage2["employeeInfo.roleId"]],
      });
    }
    employeeLookupPipeline.push({
      $match: {
        $expr: {
          $and: empMatchExpr,
        },
      },
    });
    employeeLookupPipeline.push({
      $project: {
        firstName: 1,
        lastName: 1,
        employeeCode: 1,
        teamId: 1,
        roleId: 1,
      },
    });

    // Build aggregation pipeline so we can optionally filter out leave requests
    // whose employee didn't match team/role filters (employeeInfo lookup returns empty)
    const pipeline = [];
    pipeline.push({ $match: matchStage });
    pipeline.push({
      $lookup: {
        from: "statustypes",
        localField: "statusId",
        foreignField: "_id",
        as: "Status",
      },
    });
    pipeline.push({
      $lookup: {
        from: "leavetypes",
        localField: "leaveTypeId",
        foreignField: "_id",
        as: "leaveType",
      },
    });
    pipeline.push({
      $lookup: {
        from: "employees",
        localField: "actionedBy",
        foreignField: "_id",
        as: "actionedByInfo",
      },
    });
    // lookup employeeInfo with optional filtering (team/role/id) applied
    pipeline.push({
      $lookup: {
        from: "employees",
        let: { empId: "$employeeId" },
        pipeline: employeeLookupPipeline,
        as: "employeeInfo",
      },
    });

    // if any employee filters are present, require that employeeInfo matched
    if (Object.keys(matchStage2).length > 0) {
      pipeline.push({ $match: { "employeeInfo.0": { $exists: true } } });
    }

    pipeline.push({
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
    });
    pipeline.push({ $addFields: { notifyTo: "$notifyToDetails.fullName" } });
    pipeline.push({
      $project: {
        startDate: 1,
        endDate: 1,
        totalDays: 1,
        leaveReason: 1,
        actionReason: 1,
        employeeName: {
          $concat: [
            { $first: "$employeeInfo.firstName" },
            " ",
            { $first: "$employeeInfo.lastName" },
          ],
        },
        employeeCode: { $first: "$employeeInfo.employeeCode" },
        Status: { $first: "$Status.statusType" },
        leaveType: { $first: "$leaveType.leaveType" },
        notifyTo: 1,
        actionedBy: {
          $concat: [
            { $first: "$actionedByInfo.firstName" },
            " ",
            { $first: "$actionedByInfo.lastName" },
          ],
        },
      },
    });

    const leaves = await leaveRequestSchema.aggregate(pipeline);

    return res.status(200).json({
      message: "Leaves Date fetched successfully",
      "No.of Records": leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.error("Error while fetching leaves:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Function to get top leave-taking employees within a date range
const getTopLeavesEmployees = async (req, res) => {
  try {
    const { fromDate, toDate, limit = 5, teamId } = req.body;

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "fromDate and toDate are required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    const acceptedStatus = await statusTypeSchema.findOne(
      { orgId: req.user.orgId, statusType: "ACCEPTED" },
      { _id: 1 }
    );

    // console.log("This is Startrt Date ", fromDateStart)
    // console.log("This is End Date ", toDateEnd)

    const matchStage1 = {
      orgId: req.user.orgId,
      startDate: { $lte: toDateEnd },
      endDate: { $gte: fromDateStart },
      statusId: acceptedStatus._id,
    };

    const matchStage2 = {};

    if (teamId) {
      matchStage2["employeeInfo.teamId"] = new ObjectId(teamId);
    }

    const topEmployees = await leaveRequestSchema.aggregate([
      {
        $match: matchStage1,
      },
      {
        $group: {
          _id: "$employeeId",
          totalLeaveDays: {
            $sum: "$actualWorkingDays",
          },
        },
      },
      {
        $sort: { totalLeaveDays: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      {
        $project: {
          employeeName: {
            $concat: [
              { $first: "$employeeInfo.firstName" },
              " ",
              { $first: "$employeeInfo.lastName" },
            ],
          },
          employeeCode: {
            $first: "$employeeInfo.employeeCode",
          },
          employeeImage: {
            $first: "$employeeInfo.profileImage",
          },
          totalLeaveDays: 1,
        },
      },
    ]);

    // console.log("This is data ", topEmployees)

    return res.status(200).json({
      message: "Top leave-taking employees fetched successfully",
      data: topEmployees,
    });
  } catch (error) {
    console.error("Error while fetching top leave-taking employees:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getAllLeaveRequestsData = async (
  fromDateStart,
  toDateEnd,
  statusArray,
  orgId
) => {
  try {
    const matchStage = {
      $or: [
        {
          createdAt: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
        },
        {
          startDate: {
            $lte: toDateEnd,
          },
          endDate: {
            $gte: fromDateStart,
          },
        },
      ],
    };

    if (statusArray.length > 0) {
      matchStage.statusId = { $in: statusArray };
    }

    const leaveRequests = await leaveRequestSchema.aggregate([
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
          from: "leavetypes",
          localField: "leaveTypeId",
          foreignField: "_id",
          as: "leaveType",
        },
      },
      {
        $lookup: {
          from: "leaveconsiderations",
          localField: "considerationTypeId",
          foreignField: "_id",
          as: "considerationInfo",
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
        $addFields: {
          notifyTo: "$notifyToDetails.fullName",
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          leaveReason: 1,
          isHalfDay: 1,
          actionReason: 1,
          halfDayPeriod: 1,
          createdAt: 1,
          updatedAt: 1,
          actualWorkingDays: 1,
          Status: { $first: "$Status.statusType" },
          leaveType: {
            $first: "$leaveType.leaveType",
          },
          consideration: {
            $first: "$considerationInfo.considerTypeCode",
          },
          notifyTo: 1,
          actionedBy: {
            $concat: [
              { $first: "$actionedByInfo.firstName" },
              " ",
              { $first: "$actionedByInfo.lastName" },
            ],
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
      data: leaveRequests,
    };
  } catch (error) {
    console.log("Error While fetching the Leave Requets ", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// Function to get all leave requests within a date range
const getAllLeaveRequests = async (req, res) => {
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

    const leaveRequests = await getAllLeaveRequestsData(
      fromDateStart,
      toDateEnd,
      [],
      req.user.orgId
    );

    if (!leaveRequests.status) {
      return res.status(404).json({
        message: "Error While fetching Leave requests",
        error: leaveRequests.message,
      });
    }

    return res.status(200).json({
      message: "Leave Requests fetched successfully",
      "no.of Records": leaveRequests.data.length,
      data: leaveRequests.data,
    });
  } catch (error) {
    console.error("Error fetching leave actions:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// setTimeout(async() => {
//   await addTemporaryAssignmentIdToLeaveRequest(new ObjectId('68b0615c4a7859c8c43886af'), new ObjectId('68a5fe43ef1a3bd3934c005b'));
// }, 1000);

// setTimeout(async() => {
//   const array = [{
//   "orgId": "68bbfb1106e9159927029312",
//   "employeeId": "68bc7a2cf5a9d0213efba7ba",
//   "reason": "Official client meeting in Hyderabad",
//   "totalDays": 2,
//   "status": "650f2d4e8b3a3a6f3c1d2e33",
//   "createdBy": "68bbfccb06e9159927029415",
//   "updatedBy": "68bbfccb06e9159927029415",
//   "createdAt": "2025-09-17T09:15:00.000Z",
//   "updatedAt": "2025-09-17T09:30:00.000Z",
//   "expiresAt": "2025-11-17T00:00:00.000Z"
// },

// {
//   "orgId": "68bbfb1106e9159927029312",
//   "employeeId": "68bc7a2cf5a9d0213efba7ba",
//   "reason": "in Hyderabad",
//   "totalDays": 1.5,
//   "status": "650f2d4e8b3a3a6f3c1d2e33",
//   "createdBy": "68bbfccb06e9159927029415",
//   "updatedBy": "68bbfccb06e9159927029415",
//   "createdAt": "2025-07-17T09:15:00.000Z",
//   "updatedAt": "2025-07-17T09:30:00.000Z",
//   "expiresAt": "2025-09-17T00:00:00.000Z"
// },

// {
//   "orgId": "68bbfb1106e9159927029312",
//   "employeeId": "68bc7a2cf5a9d0213efba7ba",
//   "reason": "Official client meeting in Hyderabad",
//   "totalDays": 0.5,
//   "status": "650f2d4e8b3a3a6f3c1d2e33",
//   "createdBy": "68bbfccb06e9159927029415",
//   "updatedBy": "68bbfccb06e9159927029415",
//   "createdAt": "2025-10-17T09:15:00.000Z",
//   "updatedAt": "2025-10-17T09:30:00.000Z",
//   "expiresAt": "2025-12-17T00:00:00.000Z"
// },
// ]

// console.log("Starting data insertion...");
// await ODSchema.insertMany(array);
//   console.log("Data Inserted Successfully");
// }, 1000);

// i want to remove the short code from all the leave types
// setTimeout(async () => {
//   console.log("Process Started");
//   await leaveTypeSchema.updateMany({}, { $unset: { shortCode: "" } });
//   console.log("Process Ends");
// }, 10000);

// setTimeout(async () => {
//   const array = [{
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// },
// {
// 	orgId : "68bbfb1106e9159927029312",
// 	employeeId : "68bc7a2cf5a9d0213efba7ba",
// 	statusId : "68cbda6ee06bab8089c47486"
// }]
//   console.log("process started");
//   await CLSchema.insertMany(array);
//   console.log("process ended");

// } , 2000);

// setTimeout(async () => {
//   console.log("Process started");
//   const data = await getODCounts("68bc7a2cf5a9d0213efba7ba", "68cbda6ee06bab8089c47486");
// // const data = await getCLCounts();
//   console.log("This is data", data);
//   console.log("Process end");
// }, 1000);

//! setTimeOut for unmarkUsedCL
// setTimeout(async () => {
//   console.log("Process started");

//   const employeeId = new ObjectId("68bc7a2cf5a9d0213efba7ba");
//   const leaveRequestId = new ObjectId("68cd97ef3bac3cc5a104e970");
//   const presentStatusId = new ObjectId("68cd8541e356b0e3f6151bf2");
//   const updatedStatusId = new ObjectId("68cbda6ee06bab8089c47486");
//   await unmarkUsedOD(employeeId, leaveRequestId, presentStatusId, updatedStatusId);
//   console.log("Process end");
// }, 1000);

// setTimeout(async () => {
//   console.log("Process started");
//   await leaveRequestSchema.updateMany(
//     { isHalfDay: false },
//     { $set: { halfDayPeriod: "" } }
//   );
//   console.log("Process end");
// }, 1000);

// setTimeout(async () => {
//   console.log("Process started");

// const update = await leaveRequestSchema.updateMany(
//   {},
//   [
//     {
//       $set: {
//         orgId: {
//           $ifNull: [
//             "$orgId",
//             new ObjectId("68c1472391fd6c96b3962140")
//           ]
//         }
//       }
//     }
//   ]
// )

//     console.log("Process end");
//     console.log(update)
// },20000);

module.exports = {
  addLeaveRequest,
  processLeaveRequest,
  deleteLeaveRequest,
  getEmployeeLeaveRequests,
  dummyNotification,
  getNotificationToken,
  getActionRequiredLeaves,
  getLeaveRequestFlow,
  getTemporaryAssignmentData,
  cancelLeaveRequest,
  getNotifyToNames,
  getWorkingDays,
  getLeavesData,
  getTopLeavesEmployees,
  getAllLeaveRequests,
  getAllLeaveRequestsData,
};
