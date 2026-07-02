const leaveRequestSchema = require("../models/LeaveSchemaManagement/leaveRequestSchema");
const statusTypeSchema = require("../models/statusSchema");
const permissionRequestSchema = require("../models/PermissionSchemaManagement/permissionRequestSchema");
const thumbRequestSchema = require("../models/AttendenceSchemaManagement/thumbRequestSchema");
const wfhRequestSchema = require("../models/PermissionSchemaManagement/workFromHomeSchema");
const employeeSchema = require("../models/EmployeeSchemaManagement/employeeSchema");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { getISTDateAndTime } = require("../utils/timeFunction");
const {
  getWorkingDaysCount,
} = require("./AttendenceControler/attendencePunchesController");
const {
  getAllWFHRequestsData,
} = require("./PermissionControllerManagement/workFromHomeRequestController");

const {
  getAllLeaveRequestsData,
} = require("./LeaveContollerManagement/leaveRequestController");

const {
  getAllPermissionRequestsData,
} = require("./PermissionControllerManagement/permissionRequestController");

const {
  getAllThumbRequestsData,
} = require("./AttendenceControler/thumbRequestController");

// Function to get Leave Data
const getLeaveData = async (
  fromDate,
  toDate,
  employeeId,
  status,
  holidaysList
) => {
  try {
    const leavedata = await leaveRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(status),
          startDate: {
            $lte: toDate,
          },
          endDate: {
            $gte: fromDate,
          },
        },
      },
      {
        $addFields: {
          overlapStart: {
            $cond: [
              {
                $gt: ["$startDate", fromDate],
              },
              "$startDate",
              fromDate,
            ],
          },
          overlapEnd: {
            $cond: [
              {
                $lt: ["$endDate", toDate],
              },
              "$endDate",
              toDate,
            ],
          },
        },
      },
      {
        $addFields: {
          allDates: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $add: [
                      {
                        $dateDiff: {
                          startDate: "$overlapStart",
                          endDate: "$overlapEnd",
                          unit: "day",
                        },
                      },
                      1,
                    ],
                  },
                ],
              },
              as: "i",
              in: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $dateAdd: {
                      startDate: "$overlapStart",
                      unit: "day",
                      amount: "$$i",
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          validDates: {
            $filter: {
              input: "$allDates",
              as: "d",
              cond: {
                $not: [
                  {
                    $in: ["$$d", holidaysList],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          workingDaysCount: { $size: "$validDates" },
        },
      },
      {
        $addFields: {
          overlapDays: {
            $cond: [
              {
                $and: [
                  { $eq: ["$isHalfDay", true] },
                  {
                    $in: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$startDate",
                        },
                      },
                      "$validDates",
                    ],
                  },
                ],
              },
              0.5,
              "$workingDaysCount",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          totalLeaveDays: { $sum: "$overlapDays" },
        },
      },
    ]);
    // console.log("Leave Data", leavedata);
    return {
      status: true,
      totalLeaveDays: leavedata.length > 0 ? leavedata[0].totalLeaveDays : 0,
    };
  } catch (error) {
    console.log("Error while getting the employee leave data", error);
    return {
      status: false,
      message: "Error while getting the employee leave data",
      error: error.message,
    };
  }
};

// Function to get Permission Data
const getPermissionData = async (fromDate, toDate, employeeId, status) => {
  try {
    const permissiondata = await permissionRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(status),
          date: {
            $lte: toDate,
            $gte: fromDate,
          },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          totalPermissionDays: {
            $sum: 1,
          },
        },
      },
    ]);

    return {
      status: true,
      totalPermissionDays:
        permissiondata.length > 0 ? permissiondata[0].totalPermissionDays : 0,
    };
  } catch (error) {
    console.log("Error while getting the employee permissions data", error);
    return {
      status: false,
      message: "Error while getting the employee permissions data",
      error: error.message,
    };
  }
};

// Function to get Thumb Data
const getThumbData = async (fromDate, toDate, employeeId, status) => {
  try {
    const thumbdata = await thumbRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(status),
          thumbDate: {
            $lte: toDate,
            $gte: fromDate,
          },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          totalThumbDays: {
            $sum: 1,
          },
        },
      },
    ]);

    return {
      status: true,
      totalThumbDays: thumbdata.length > 0 ? thumbdata[0].totalThumbDays : 0,
    };
  } catch (error) {
    console.log("Error while getting the employee thumbs data", error);
    return {
      status: false,
      message: "Error while getting the employee thumbs data",
      error: error.message,
    };
  }
};

const getWFHData = async (fromDate, toDate, employeeId, status) => {
  try {
    const wfhData = await wfhRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(status),
          startDate: {
            $lte: toDate,
          },
          endDate: {
            $gte: fromDate,
          },
        },
      },
      {
        $addFields: {
          overlapStart: {
            $cond: [
              {
                $gt: ["$startDate", fromDate],
              },
              "$startDate",
              fromDate,
            ],
          },
          overlapEnd: {
            $cond: [
              {
                $lt: ["$endDate", toDate],
              },
              "$endDate",
              toDate,
            ],
          },
        },
      },
      {
        $addFields: {
          overlapDays: {
            $let: {
              vars: {
                diffDays: {
                  $divide: [
                    {
                      $subtract: ["$overlapEnd", "$overlapStart"],
                    },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
              in: {
                $cond: [
                  { $lt: ["$$diffDays", 1] },
                  1,
                  { $round: ["$$diffDays", 0] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          overlapDays: {
            $cond: [{ $eq: ["$isHalfDay", true] }, 0.5, "$overlapDays"],
          },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          totalWFHDays: { $sum: "$overlapDays" },
        },
      },
    ]);

    return {
      status: true,
      totalWFHDays: wfhData.length > 0 ? wfhData[0].totalWFHDays : 0,
    };
  } catch (error) {
    console.log("Error while getting the employee WFH data", error);
    return {
      status: false,
      message: "Error while getting the employee WFH data",
      error: error.message,
    };
  }
};

const getEmployeeStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "Required Fields From Date or To Date are missing" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 59);

    if (toDateEnd < fromDateStart) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const [
      activeStatus,
      acceptedStatus,
      { totalWorkingDays, overAllHolidays },
    ] = await Promise.all([
      statusTypeSchema.findOne({ orgId: req.user.orgId, statusType: "ACTIVE" }),
      statusTypeSchema.findOne({
        orgId: req.user.orgId,
        statusType: "ACCEPTED",
      }),
      getWorkingDaysCount(req.user.orgId, fromDateStart, toDateEnd),
    ]);

    if (!activeStatus || !acceptedStatus) {
      return res
        .status(500)
        .json({ message: "Active or Accepted status not found" });
    }

    const employees = await employeeSchema.aggregate([
      {
        $match: {
          orgId: new ObjectId(req.user.orgId),
          status: activeStatus._id,
          considerAttendence: true,
        },
      },
      {
        $project: {
          _id: 1,
          employeeName: {
            $concat: ["$firstName", " ", "$lastName"],
          },
          employeeCode: 1,
        },
      },
    ]);

    // console.log("Employees Fetched for Stats", employees.length);
    // console.log(" overAllHolidays ", overAllHolidays);

    const employeeStatsPromises = employees.map(async (employee) => {
      const [leaveData, permissionData, thumbData, wfhData] = await Promise.all(
        [
          getLeaveData(
            fromDateStart,
            toDateEnd,
            employee._id,
            acceptedStatus._id,
            overAllHolidays
          ),
          getPermissionData(
            fromDateStart,
            toDateEnd,
            employee._id,
            acceptedStatus._id
          ),
          getThumbData(
            fromDateStart,
            toDateEnd,
            employee._id,
            acceptedStatus._id
          ),
          getWFHData(
            fromDateStart,
            toDateEnd,
            employee._id,
            acceptedStatus._id
          ),
        ]
      );

      // console.log("Employee Stats Data for ", employee.employeeName, {
      //   leaveData,
      //   permissionData,
      //   thumbData,
      //   wfhData,
      // });

      if (leaveData.status === false) {
        console.log(
          "Error in Leave Data for employee ",
          employee.employeeName,
          leaveData
        );
      }

      if (permissionData.status === false) {
        console.log(
          "Error in Permission Data for employee ",
          employee.employeeName,
          permissionData
        );
      }

      if (thumbData.status === false) {
        console.log(
          "Error in Thumb Data for employee ",
          employee.employeeName,
          thumbData
        );
      }

      if (wfhData.status === false) {
        console.log(
          "Error in WFH Data for employee ",
          employee.employeeName,
          wfhData
        );
      }

      return {
        employeeId: employee._id,
        employeeName: employee.employeeName,
        employeeCode: employee.employeeCode,
        totalLeaveDays: leaveData?.totalLeaveDays || 0,
        totalPermissionDays: permissionData?.totalPermissionDays || 0,
        totalThumbDays: thumbData?.totalThumbDays || 0,
        totalWFHDays: wfhData?.totalWFHDays || 0,
      };
    });

    // console.log("Employee Stats Promises Created", employeeStatsPromises);

    const employeeStats = await Promise.all(employeeStatsPromises);

    return res.status(200).json({
      message: "Employee Stats Fetched Successfully",
      data: employeeStats,
    });
  } catch (error) {
    console.log("Error While getting employee Stats", error);
    return res
      .status(500)
      .json({ message: "Internal Error", error: error.message });
  }
};

const getAllPendingRequets = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
          message: "Required Fields Start Date or End Date are missing",
        });
    }

    const fromDateStart = new Date(startDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endDate);
    toDateEnd.setUTCHours(23, 59, 59, 59);

    if (toDateEnd < fromDateStart) {
      return res
        .status(400)
        .json({ message: "From date cannot be after to date" });
    }

    const orgId = req.user.orgId;

    const [pendingStatus, escalateStatus] = await Promise.all([
      statusTypeSchema.findOne(
        { orgId: orgId, statusType: "PENDING" },
        { _id: 1 }
      ),
      statusTypeSchema.findOne(
        { orgId: orgId, statusType: "ESCALATED" },
        { _id: 1 }
      ),
    ]);

    if (!pendingStatus?._id || !escalateStatus?._id) {
      return res.status(400).json({ message: "Required Status are Missing" });
    }

    const statusArray = [];
    statusArray.push(pendingStatus._id);
    statusArray.push(escalateStatus._id);

    const [
      wfhRequestsData,
      leaveRequestsData,
      permissionRequestsData,
      thumbRequestsData,
    ] = await Promise.all([
      getAllWFHRequestsData(fromDateStart, toDateEnd, statusArray, orgId),
      getAllLeaveRequestsData(fromDateStart, toDateEnd, statusArray, orgId),
      getAllPermissionRequestsData(
        fromDateStart,
        toDateEnd,
        statusArray,
        orgId
      ),
      getAllThumbRequestsData(fromDateStart, toDateEnd, statusArray, orgId),
    ]);

    if (!wfhRequestsData.status) {
      return res.status(500).json({
        message: "Error While fetching the WFHs Data",
        error: wfhRequestsData.message,
      });
    }

    if (!leaveRequestsData.status) {
      return res.status(500).json({
        message: "Error While fetching the Leaves Data",
        error: leaveRequestsData.message,
      });
    }

    if (!permissionRequestsData.status) {
      return res.status(500).json({
        message: "Error While fetching the Permission Data",
        error: permissionRequestsData.message,
      });
    }

    if (!thumbRequestsData.status) {
      return res.status(500).json({
        message: "Error While fetching the Thumb Data",
        error: thumbRequestsData.message,
      });
    }

    // console.log("Leaves : ", leaveRequestsData.data.length);
    // console.log("Permissions : ", permissionRequestsData.data.length);
    // console.log("Thumbs : ", thumbRequestsData.data.length);
    // console.log("WFH : ", wfhRequestsData.data.length);

    return res.status(200).json({
      message: "Pending Requests Fetched Successfully",
      data: {
        leavesData: leaveRequestsData.data,
        wfhsData: wfhRequestsData.data,
        thumbsData: thumbRequestsData.data,
        permissionsData: permissionRequestsData.data,
      },
    });
  } catch (error) {
    console.log("Error While getting Pending Requests", error);
    return res
      .status(500)
      .json({ message: "Internal Error", error: error.message });
  }
};

// setTimeout(async () => {
// console.log("Testing Employee Stats Function");
//   const data = await getLeaveData(new Date("2025-10-28T00:00:00.000Z"), new Date("2025-10-29T23:59:59.999Z"), "68f32cc06629cbacf4e7430b", "68bc01224d744d9ea425ee1e", ["2025-10-28", "2025-10-29"]);
// const data = await getPermissionData(new Date("2025-10-28T00:00:00.000Z"), new Date("2025-10-29T23:59:59.999Z"), "68f32cc06629cbacf4e7430b", "68bc01224d744d9ea425ee1e");
//   const data = await getThumbData(new Date("2025-10-28T00:00:00.000Z"), new Date("2025-10-29T23:59:59.999Z"), "68f32cc06629cbacf4e7430b", "68bc01224d744d9ea425ee1e");
//   const data = await getWFHData(new Date("2025-10-28T00:00:00.000Z"), new Date("2025-10-29T23:59:59.999Z"), "68f32cc06629cbacf4e7430b", "68bc01224d744d9ea425ee1e");
//   console.log("Data", data);
// }, 5000);

module.exports = {
  getEmployeeStats,
  getAllPendingRequets,
};
