const dailyAttendenceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const statusTypeSchema = require("../../models/statusSchema");
const holidaysSchema = require("../../models/AttendenceSchemaManagement/holidaysSchema");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const {
  getISTDateAndTime,
  changeGTMtoIST,
} = require("../../utils/timeFunction");
const { stat } = require("fs");
const workFromHomeSchema = require("../../models/PermissionSchemaManagement/workFromHomeSchema");
const rolesSchema = require("../../models/EmployeeSchemaManagement/rolesSchema");
const objectId = mongoose.Types.ObjectId;

// Get Monthly Attendance Report
const getMonthlyAttendenceReport = async (employeeId, startDate, endDate) => {
  try {
    if (!employeeId || !startDate || !endDate) {
      return {
        status: false,
        message: "Employee ID, startDate, enddate are required.",
      };
    }

    if (!objectId.isValid(employeeId)) {
      return { status: false, message: "Invalid Employee ID." };
    }

    if (typeof employeeId === "string") {
      employeeId = new objectId(employeeId);
    }

    // console.log("Fetching attendance data for Employee ID:", employeeId);
    // console.log("Date Range:", startDate, "to", endDate);

    const attendanceData = await dailyAttendenceSchema.aggregate([
      {
        $match: {
          employeeId: employeeId,
          $or: [
            {
              logInTime: {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              logOutTime: {
                $gte: startDate,
                $lte: endDate,
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
          as: "employeeInfo",
        },
      },
      { $unwind: "$employeeInfo" },
      {
        $lookup: {
          from: "attendencestatustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "StatusInfo",
        },
      },
      { $unwind: "$StatusInfo" },
      {
        $addFields: {
          effectiveDate: {
            $cond: [
              { $ifNull: ["$logInTime", false] },
              "$logInTime",
              "$logOutTime",
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          date: {
            $arrayElemAt: [
              { $split: [{ $toString: "$effectiveDate" }, "T"] },
              0,
            ],
          },
          logInTime: 1,
          logOutTime: 1,
          status: "$StatusInfo.shortName",
        },
      },
      {
        $sort: {
          dateOfJoining: 1,
        },
      },
      {
        $group: {
          _id: null,
          docs: {
            $push: {
              k: "$date",
              v: {
                _id: "$_id",
                logInTime: "$logInTime",
                logOutTime: "$logOutTime",
                date: "$date",
                status: "$status",
              },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: { $arrayToObject: "$docs" },
        },
      },
    ]);

    if (!attendanceData[0] || Object.keys(attendanceData[0]).length === 0) {
      //   console.warn(
      //     "No attendance data found for the employee",
      //     employeeId,
      //     "for the date",
      //     startDate,
      //     "to",
      //     endDate
      //   );
      // } else {
      // console.log("Attendance Data:", Object.keys(attendanceData[0]).length);
    }

    return {
      status: true,
      data: attendanceData[0] ? attendanceData[0] : {},
    };
  } catch (error) {
    console.error("Error in getMonthlyAttendenceReport:", error);
    return { status: false, message: "Internal server error" };
  }
};

// Get Leave Report
// const getLeaveReport = async (
//   employeeId,
//   startDate,
//   endDate,
//   acceptedStatusId
// ) => {
//   try {
//     if (!employeeId || !startDate || !endDate) {
//       return {
//         status: false,
//         message: "Employee ID, startDate, endDate are required.",
//       };
//     }

//     if (!objectId.isValid(employeeId)) {
//       return { status: false, message: "Invalid Employee ID." };
//     }

//     if (typeof employeeId === "string") {
//       employeeId = new objectId(employeeId);
//     }

//     const leaveData = await leaveRequestSchema.aggregate([
//       {
//         $match: {
//           employeeId: employeeId,
//           startDate: {
//             $lte: endDate,
//           },
//           endDate: {
//             $gte: startDate,
//           },
//           statusId: acceptedStatusId,
//         },
//       },
//       {
//         $project: {
//           lopDays: 1,
//           clDays: 1,
//           odDays: 1,
//           isHalfDay: 1,
//           startDate: 1,
//           endDate: 1,
//         },
//       },
//     ]);

//     if (!leaveData[0] || Object.keys(leaveData[0]).length === 0) {
//       // console.warn(
//       //   "No leave data found for the employee",
//       //   employeeId,
//       //   "for the date",
//       //   startDate,
//       //   "to",
//       //   endDate
//       // );
//     } else {
//       // console.log("Leave Data:", Object.keys(leaveData[0]).length);
//     }

//     return {
//       status: true,
//       data: leaveData[0] ? leaveData[0] : {},
//     };
//   } catch (error) {
//     console.error("Error in getLeaveReport:", error);
//     return { status: false, message: "Internal server error" };
//   }
// };
// Get WFH Report
const getWFHReport = async (
  employeeId,
  startDate,
  endDate,
  acceptedStatusId
) => {
  try {
    if (!employeeId || !startDate || !endDate) {
      return {
        status: false,
        message: "Employee ID, startDate, endDate are required.",
      };
    }

    if (!objectId.isValid(employeeId)) {
      return { status: false, message: "Invalid Employee ID." };
    }

    if (typeof employeeId === "string") {
      employeeId = new objectId(employeeId);
    }

    // const wfhData = await workFromHomeSchema.aggregate([
    //   {
    //     $match: {
    //       employeeId: employeeId,
    //       startDate: {
    //         $lte: endDate,
    //       },
    //       endDate: {
    //         $gte: startDate,
    //       },
    //       statusId: acceptedStatusId,
    //     },
    //   },

    //   {
    //     $addFields: {
    //       effectiveStart: {
    //         $cond: [
    //           {
    //             $gt: ["$startDate", startDate],
    //           },
    //           "$startDate",
    //           endDate,
    //         ],
    //       },
    //       effectiveEnd: {
    //         $cond: [
    //           {
    //             $lt: ["$endDate", startDate],
    //           },
    //           "$endDate",
    //           endDate,
    //         ],
    //       },
    //     },
    //   },

    //   {
    //     $project: {
    //       dates: {
    //         $map: {
    //           input: {
    //             $range: [
    //               0,
    //               {
    //                 $add: [
    //                   {
    //                     $toInt: {
    //                       $divide: [
    //                         {
    //                           $subtract: ["$effectiveEnd", "$effectiveStart"],
    //                         },
    //                         86400000,
    //                       ],
    //                     },
    //                   },
    //                   1,
    //                 ],
    //               },
    //             ],
    //           },
    //           as: "i",
    //           in: {
    //             $dateToString: {
    //               format: "%Y-%m-%d",
    //               date: {
    //                 $add: ["$effectiveStart", { $multiply: ["$$i", 86400000] }],
    //               },
    //             },
    //           },
    //         },
    //       },
    //       isHalfDay: 1,
    //       halfDayPeriod: 1,
    //       _id: 1,
    //     },
    //   },
    //   { $unwind: "$dates" },

    //   {
    //     $group: {
    //       _id: "$dates",
    //       wfh: {
    //         $push: {
    //           _id: "$_id",
    //           consideration: { $literal: "WFH" },
    //           isHalfDay: "$isHalfDay",
    //           halfDayPeriod: "$halfDayPeriod",
    //           date: "$dates",
    //         },
    //       },
    //     },
    //   },

    //   {
    //     $project: {
    //       k: "$_id",
    //       v: {
    //         $cond: [
    //           { $gt: [{ $size: "$wfh" }, 1] },
    //           "$wfh",
    //           { $arrayElemAt: ["$wfh", 0] },
    //         ],
    //       },
    //     },
    //   },

    //   {
    //     $group: {
    //       _id: null,
    //       docs: { $push: { k: "$k", v: "$v" } },
    //     },
    //   },
    //   {
    //     $replaceRoot: {
    //       newRoot: { $arrayToObject: "$docs" },
    //     },
    //   },
    // ]);

    const dateMap = {};

    const wfhData = await workFromHomeSchema.aggregate([
      {
        $match: {
          employeeId: employeeId,
          startDate: {
            $lte: endDate,
          },
          endDate: {
            $gte: startDate,
          },
          statusId: acceptedStatusId,
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          isHalfDay: 1,
          halfDayPeriod: 1,
        },
      },
    ]);

    for (const wfh of wfhData) {
      const start = new Date(
        wfh.startDate < startDate ? startDate : wfh.startDate
      );
      const end = new Date(wfh.endDate > endDate ? endDate : wfh.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayString = d.toISOString().split("T")[0];
        dateMap[dayString] = {
          _id: wfh._id,
          consideration: "WFH",
          isHalfDay: wfh.isHalfDay || false,
          halfDayPeriod: wfh.halfDayPeriod || "",
          date: dayString,
        };
      }
    }

    // if (!wfhData[0] || Object.keys(wfhData[0]).length === 0) {
    //   // console.warn(
    //   //   "No leave data found for the employee",
    //   //   employeeId,
    //   //   "for the date",
    //   //   startDate,
    //   //   "to",
    //   //   endDate
    //   // );
    // } else {
    //   // console.log("WFH Data:", Object.keys(wfhData[0]).length);
    // }

    return {
      status: true,
      data: dateMap,
    };
  } catch (error) {
    console.error("Error in getWFHReport:", error);
    return { status: false, message: "Internal server error" };
  }
};

// Get All Employee Data for an Organization
const getAllEmployeeData = async (orgId) => {
  try {
    if (!orgId) {
      return { status: false, message: "Organization ID is required." };
    }

    if (!objectId.isValid(orgId)) {
      return { status: false, message: "Invalid Organization ID." };
    }

    if (typeof orgId === "string") {
      orgId = new objectId(orgId);
    }

    const [orgHeadRoleId, activeStatusId] = await Promise.all([
      rolesSchema.findOne(
        { orgId: orgId, name: "ORGANIZATIONHEAD" },
        { _id: 1 }
      ),
      statusTypeSchema.findOne(
        { orgId: orgId, statusType: "ACTIVE" },
        { _id: 1 }
      ),
    ]);

    // console.log("orgHeadRoleId, activeStatusId", orgHeadRoleId, activeStatusId);

    if (!activeStatusId) {
      return {
        status: false,
        message: "No Active Status ID found for the organization.",
      };
    }

    if (!orgHeadRoleId) {
      return {
        status: false,
        message: "No Org Head Role ID found for the organization.",
      };
    }

    const employees = await employeeSchema.aggregate([
      {
        $match: {
          orgId: orgId,
          roleId: { $ne: orgHeadRoleId._id },
          status: activeStatusId._id,
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
          from: "employeebankdetails",
          localField: "_id",
          foreignField: "employeeId",
          as: "bankDetailsInfo",
        },
      },
      {
        $unwind: {
          path: "$bankDetailsInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          designation: "$designationInfo.title",
          employeeId: "$_id",
          accountNumber: "$bankDetailsInfo.accountNumber",
          employeeName: {
            $concat: ["$firstName", " ", "$lastName"],
          },
          employeeCode: 1,
          considerAttendence: 1,
          roleId: 1,
        },
      },
    ]);

    if (!employees || employees.length === 0) {
      console.warn("No employees found for the organization", orgId);
    } else {
      console.log("Number of employees found:", employees.length);
    }
    return {
      status: true,
      data: employees,
    };
  } catch (error) {
    console.error("Error in getAllEmployeeData:", error);
    return {
      status: false,
      message: "Internal server error",
    };
  }
};

// Get Holidays for an Organization within a Date Range
const getHolidays = async (orgId, startDate, endDate) => {
  try {
    if (!orgId || !startDate || !endDate) {
      return {
        status: false,
        message: "Organization ID, start date, and end date are required.",
      };
    }

    if (!objectId.isValid(orgId)) {
      return { status: false, message: "Invalid Organization ID." };
    }

    if (typeof orgId === "string" && orgId.trim() !== "") {
      orgId = new objectId(orgId);
    }

    let dateList = [];
    let d = new Date(startDate);
    while (d <= endDate) {
      dateList.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    // console.log("This is the date list", dateList);

    const holidays = await holidaysSchema.aggregate([
      {
        $match: {
          orgId: orgId,
          fromDate: { $lte: endDate },
          toDate: { $gte: startDate },
        },
      },
      {
        $project: {
          name: 1,
          shortCode: 1,
          dates: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $add: [
                      {
                        $toInt: {
                          $divide: [
                            { $subtract: ["$toDate", "$fromDate"] },
                            86400000,
                          ],
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
                    $add: ["$fromDate", { $multiply: ["$$i", 86400000] }],
                  },
                },
              },
            },
          },
        },
      },
      { $unwind: "$dates" },
      {
        $project: {
          name: 1,
          date: "$dates",
          shortCode: 1,
        },
      },
    ]);

    // let holidayList = [];
    // holidays.forEach((h) => {
    //   if (Array.isArray(h.dates)) {
    //     h.dates.forEach((dateStr) => {
    //       holidayList.push({ date: new Date(dateStr), name: h.name });
    //     });
    //   }
    // });

    // console.log("This is holiday list", holidayList);

    const holidayMap = {};
    holidays.forEach((h) => {
      //   console.log(h);
      const dateStr = h.date.toString().split("T")[0];
      // console.log("This is Dates ", dateStr);
      if (
        dateStr >= startDate.toISOString().split("T")[0] &&
        dateStr <= endDate.toISOString().split("T")[0]
      ) {
        // console.log("Adding holiday date:", dateStr, "for holiday:", h.name);

        holidayMap[h.date.toString().split("T")[0]] = {
          name: h.name,
          shortCode: h.shortCode,
        };
      }
    });

    if (!holidays || Object.keys(holidays).length === 0) {
      // console.warn(
      //   "No holidays found for the organization",
      //   orgId,
      //   "for the date",
      //   startDate,
      //   "to",
      //   endDate
      // );
    } else {
      // console.log("Number of holidays found:", holidays.length);
    }

    return {
      status: true,
      date: holidayMap ? holidayMap : {},
    };
  } catch (error) {
    console.error("Error in getHolidays:", error);
    return { status: false, message: "Internal server error" };
  }
};

// Get Sundays within a Date Range
const getSundays = (startDate, endDate) => {
  try {
    let dateList = [];
    let d = new Date(startDate);

    while (d <= endDate) {
      dateList.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    const sundayDocs = [];

    for (const dateObj of dateList) {
      if (dateObj.getDay() === 0) {
        const dateStr = dateObj.toISOString().split("T")[0];
        sundayDocs.push({
          k: dateStr,
          v: {
            name: "SUNDAY",
            shortCode: "WO",
          },
        });
      }
    }

    // Convert array of {k,v} into an object keyed by date
    const sundayObj = Object.fromEntries(sundayDocs.map(({ k, v }) => [k, v]));

    if (!sundayDocs || Object.keys(sundayDocs).length === 0) {
      // console.warn(
      //   "No Sundays found in the given date range",
      //   startDate,
      //   "to",
      //   endDate
      // );
    } else {
      // console.log("Number of Sundays found:", Object.keys(sundayObj).length);
    }

    return {
      status: true,
      data: sundayObj,
    };
  } catch (error) {
    console.error("Error in getSundays:", error);
    return {
      status: false,
      message: "Internal server error",
    };
  }
};

const getLeaveReport = async (
  employeeId,
  startDate,
  endDate,
  acceptedStatusId,
  holidays
) => {
  const dateMap = {};

  if (!employeeId || !startDate || !endDate) {
    return {
      status: false,
      message: "Employee ID, startDate, endDate are required.",
    };
  }

  if (!objectId.isValid(employeeId)) {
    return { status: false, message: "Invalid Employee ID." };
  }

  if (typeof employeeId === "string") {
    employeeId = new objectId(employeeId);
  }

  const leaves = await leaveRequestSchema.aggregate([
    {
      $match: {
        employeeId: employeeId,
        startDate: {
          $lte: endDate,
        },
        endDate: {
          $gte: startDate,
        },
        statusId: acceptedStatusId,
      },
    },
    {
      $lookup: {
        from: "leaveconsiderations",
        localField: "considerationTypeId",
        foreignField: "_id",
        as: "LeaveConsiderInfo",
      },
    },
    {
      $unwind: {
        path: "$LeaveConsiderInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        lopDays: 1,
        clDays: 1,
        odDays: 1,
        isHalfDay: 1,
        halfDayPeriod: 1,
        startDate: 1,
        endDate: 1,
        halfDayPeriod: 1,
        consideration: "$LeaveConsiderInfo.considerTypeCode",
      },
    },
  ]);

  for (const leave of leaves) {
    const start = new Date(
      leave.startDate < startDate ? startDate : leave.startDate
    );
    const end = new Date(leave.endDate > endDate ? endDate : leave.endDate);

    let odUsed = 0;
    let clUsed = 0;
    let lopUsed = 0;

    const odDays = leave.odDays || 0;
    const clDays = leave.clDays || 0;
    const lopDays = leave.lopDays || 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayString = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();

      if (dayOfWeek === 0 || holidays[dayString]) continue;

      let consideration = "";
      if (odUsed < odDays) {
        consideration = "OD";
        odUsed++;
      } else if (clUsed < clDays) {
        consideration = "CL";
        clUsed++;
      } else if (lopUsed < lopDays) {
        consideration = "LOP";
        lopUsed++;
      } else {
        consideration = leave.consideration;
      }

      dateMap[dayString] = {
        _id: leave._id,
        consideration,
        lopDays: leave.lopDays,
        isHalfDay: leave.isHalfDay || false,
        halfDayPeriod: leave.halfDayPeriod || "",
        date: dayString,
      };
    }
  }

  return dateMap;
};

// setTimeout(() => {
//   const leaves = [
//     {
//       _id: "68e398ce7acc69f8f751b2dd",
//       startDate: "2025-10-24T00:00:00.000Z",
//       endDate: "2025-10-31T23:59:59.999Z",
//       isHalfDay: false,
//       odDays: 2,
//       clDays: 2,
//       lopDays: 3,
//     },
//     {
//       _id: "68e3901e2707dec271741ef8",
//       startDate: "2025-12-11T00:00:00.000Z",
//       endDate: "2025-12-11T23:59:59.999Z",
//       isHalfDay: false,
//       lopDays: 0.5,
//     },
//   ];
//   const finalData = generateLeaveDateMap(leaves);
//   console.log("This final Leave data is : ", finalData);
// }, 1000);

// Generate Excel Report

const generateExcelReport = async (columns, data, startDate, endDate) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Add title row (merged)
    worksheet.addRow([`TECHNICAL HUB`]);
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    worksheet.addRow([`Attendance Report (${startDate} TO ${endDate})`]);
    worksheet.mergeCells(2, 1, 2, columns.length);
    worksheet.getRow(2).font = { bold: true, size: 14 };
    worksheet.getRow(2).alignment = { horizontal: "center" };

    // Add header row
    worksheet.addRow(columns);
    worksheet.getRow(3).font = { bold: true };

    // Set column widths
    columns.forEach((col, i) => {
      if (i === 0) worksheet.getColumn(i + 1).width = 8; // Emp Code
      else if (i === 1) worksheet.getColumn(i + 1).width = 20; // Name
      else if (i === 2) worksheet.getColumn(i + 1).width = 18; // Designations
      else if (i === 3) worksheet.getColumn(i + 1).width = 15; // Mobile
      else worksheet.getColumn(i + 1).width = 4; // Days & summary
    });

    // Status color map
    const statusColor = {
      P: { font: { color: { argb: "FF0070C0" } } }, // Blue
      WO: { font: { color: { argb: "FFFF0000" } } }, // Red
      CL: { font: { color: { argb: "FF00B050" } } }, // Green
      ML: { font: { color: { argb: "FF00B050" } } }, // Green
      PH: { font: { color: { argb: "FF00B050" } } }, // Green
      OD: { font: { color: { argb: "FF00B050" } } }, // Green
      LOP: { font: { color: { argb: "FFFF0000" } } }, // Red
      AB: { font: { color: { argb: "FFFF0000" } } }, // Red
      FH: { font: { color: { argb: "FF7030A0" } } }, // Purple
      SH: { font: { color: { argb: "FF7030A0" } } }, // Purple
      VAC: { font: { color: { argb: "FF7030A0" } } }, // Purple
    };

    // Add data rows
    data.forEach((row) => {
      const rowData = columns.map((col) =>
        row[col] !== undefined ? row[col] : ""
      );
      const addedRow = worksheet.addRow(rowData);
      // Center align all cells in the row
      addedRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // for (let i = 0; i < columns.length; i++) {
      //   const val = row[columns[i]];
      //   if (typeof val === "string") {
      //     // Color by first status code
      //     const status = val.split("/")[0].split(",")[0];
      //     if (statusColor[status]) {
      //       addedRow.getCell(i + 1).font = statusColor[status].font;
      //     }
      //   }
      // }
    });

    // Add empty row for spacings
    worksheet.addRow([]);

    // Add remarks/legend section
    worksheet.addRow(["Remarks:"]);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = {
      color: { argb: "FFFF0000" },
      bold: true,
      size: 12,
    };
    worksheet.addRow(["FH - First Half", "CL - Casual Leave"]);
    worksheet.addRow(["SH - Second Half", "ML - Marignal Leave"]);
    worksheet.addRow(["WO - Week OFF", "P - Present"]);
    worksheet.addRow(["VAC - Vacation", "AB - Absent/LOP"]);
    worksheet.addRow(["PH - Public Holiday"]);

    // Add signature line at the end of the data columns
    const sigRow = worksheet.lastRow.number + 2;
    const sigCol = columns.length;
    worksheet.getCell(sigRow, sigCol).value = "Signature of CEO";
    worksheet.getCell(sigRow, sigCol).alignment = { horizontal: "right" };

    return workbook;
  } catch (error) {
    console.error("Error in generateExcelReport:", error);
    throw error;
  }
};

// Main Attendence Report Controller
const getAttendenceReport = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: "startDate and endDate are required.",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        status: false,
        message: "startDate cannot be greater than endDate.",
      });
    }

    const fromDateStart = new Date(startDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(endDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    const orgId = new objectId(req.user.orgId);

    // Get accepted status id, all employees, holidays, Sundays
    const [acceptedStatusId, employeeResult, holidaysResult, sundaysResult] =
      await Promise.all([
        // accepted status
        statusTypeSchema.findOne({ orgId, statusType: "ACCEPTED" }, { _id: 1 }),

        // all employees
        getAllEmployeeData(orgId),

        // Holidays
        getHolidays(orgId, fromDateStart, toDateEnd),

        // Sundays
        getSundays(fromDateStart, toDateEnd),
      ]);

    if (!acceptedStatusId) {
      return res.status(404).json({
        status: false,
        message: "No accepted status id found",
      });
    }

    if (!employeeResult.status) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch employees",
      });
    }
    const employees = employeeResult.data;

    const holidays = holidaysResult.date || {};

    const sundays = sundaysResult.data || {};

    const dateColumns = [];
    const dateMap = [];
    let d = new Date(fromDateStart);
    while (d <= toDateEnd) {
      const dateStr = d.toISOString().split("T")[0];
      const dayStr = ("0" + d.getDate()).slice(-2);
      dateColumns.push(dayStr);
      dateMap.push({ dateStr, dayStr });
      d.setDate(d.getDate() + 1);
    }

    // Prepare report rows
    const reportRows = [];
    for (const emp of employees) {
      const empId = emp.employeeId;
      const empName = emp.employeeName;
      const empCode = emp.employeeCode;
      const roleId = emp.roleId;
      const designation = emp.designation || "";
      const accountNumber = emp.accountNumber || "";
      const considerAttendence = emp?.considerAttendence ?? true;

      // if(considerAttendence === false){
      //   console.log(`Skipping attendance for ${empName} as considerAttendence is false.`);
      // }

      // Get Attendence, Leaves, WFH
      const [attendanceResult, leaveResult, wfhRequests] = await Promise.all([
        getMonthlyAttendenceReport(empId, fromDateStart, toDateEnd),
        getLeaveReport(
          empId,
          fromDateStart,
          toDateEnd,
          acceptedStatusId._id,
          holidays,
          sundays
        ),

        getWFHReport(empId, fromDateStart, toDateEnd, acceptedStatusId._id),
      ]);

      // Attendance
      const attendanceData = attendanceResult.data || {};

      // Leave
      const leaveData = leaveResult || {};

      // if (empName === "MURTHY (BABJI) N.V.S") {
      //   console.log("Leave Data:", leaveData);
      // }

      // WFH
      const wfhData = wfhRequests.data || {};

      // if (empName === "JONATHAN PETERS") {
      //   console.log("WFH Data:", wfhData);
      // }
      // console.log("This is Attendence Data : ", attendanceData);
      // console.log("This is leave Data : ", leaveData);

      // Row object
      const row = {
        "Emp.Code": empCode,
        "Emp.Name": empName,
        "Designation": designation,
        "Account Number": accountNumber,
      };

      let WO = 0,
        OD = 0,
        CL = 0,
        PH = 0,
        Working = 0,
        Payble = 0,
        LO = 0,
        WFH = 0,
        VAC = 0;

      for (let i = 0; i < dateMap.length; i++) {
        const { dateStr, dayStr } = dateMap[i];

        if (sundays[dateStr]) {
          row[dayStr] = "WO";
          WO++;
          continue;
        }

        if (holidays[dateStr]) {
          row[dayStr] = "PH";
          PH++;
          continue;
        }

        let status = attendanceData[dateStr]?.status || "";
        if (status) {
          // Handle Present first so P is resolved immediately when attendance exists
          if (status === "P") {
            row[dayStr] = "P";
            Working += 1;
            Payble += 1;
            continue;
          }

          if (status === "FD") {
            if (leaveData[dateStr]) {
              const leaveEntry = leaveData[dateStr];
              if (leaveEntry && leaveEntry.isHalfDay) {
                const cons = leaveEntry.consideration === "LO" ? "LOP" : (leaveEntry.consideration || "LOP");
                if (leaveEntry.halfDayPeriod === "1STHALF") {
                  row[dayStr] = `${cons}/SH`;
                } else {
                  row[dayStr] = `FH/${cons}`;
                }
                // increment counters for the half-day leave portion (0.5 day)
                if (cons === "LOP") {
                  LO += 0.5;
                } else if (cons === "OD") {
                  OD += 0.5;
                } else if (cons === "CL") {
                  CL += 0.5;
                } else if (cons === "VAC") {
                  VAC += 0.5;
                } else {
                  // unknown consideration -> treat as LOP
                  LO += 0.5;
                }
                // the FD half (other half) counts as LOP/absent (0.5)
                LO += 0.5;
              } else {
                // full-day leave overrides FD
                row[dayStr] = leaveEntry.consideration === "LO" ? "LOP" : leaveEntry.consideration || "LOP";
                if (row[dayStr] === "LO" || row[dayStr] === "LOP") {
                  LO++;
                } else if (row[dayStr] === "VAC") {
                  VAC++;
                }
                if (row[dayStr] === "OD") {
                  OD++;
                } else if (row[dayStr] === "CL") {
                  CL++;
                }
              }
              continue;
            }

            if (wfhData[dateStr]) {
              const wfhEntry = wfhData[dateStr];
              if (wfhEntry && wfhEntry.isHalfDay) {
                const cons = wfhEntry.consideration || "WFH";
                if (wfhEntry.halfDayPeriod === "1STHALF") {
                  row[dayStr] = `${cons}/SH`;
                } else {
                  row[dayStr] = `FH/${cons}`;
                }
                // half-day WFH counts as half WFH; FD half is absent
                WFH += 0.5;
                LO += 0.5; // FD half
              } else {
                // full-day WFH overrides FD
                row[dayStr] = wfhEntry.consideration || "WFH";
                WFH++;
              }
              continue;
            }

            // No leave/WFH -> FD behaves as full-day absent
            row[dayStr] = "FD";
            LO++;
            continue;
          }

          if (status === "FH" || status === "SH") {
            let leaveFound = null;
            if (leaveData[dateStr] && leaveData[dateStr].isHalfDay) {
              if (
                (status === "FH" && leaveData[dateStr].halfDayPeriod === "1STHALF") ||
                (status === "SH" && leaveData[dateStr].halfDayPeriod === "2NDHALF")
              ) {
                leaveFound = leaveData[dateStr];
              }
            }

            let wfhFound = null;
            if (!leaveFound && wfhData[dateStr] && wfhData[dateStr].isHalfDay) {
              if (
                (status === "FH" && wfhData[dateStr].halfDayPeriod === "1STHALF") ||
                (status === "SH" && wfhData[dateStr].halfDayPeriod === "2NDHALF")
              ) {
                wfhFound = wfhData[dateStr];
              }
            }

            const found = leaveFound || wfhFound;
            if (found) {
              // Place leave/WFH on correct half based on halfDayPeriod
              if (found.halfDayPeriod === "1STHALF") {
                // first half is leave/WFH, second half present
                row[dayStr] = `${found.consideration}/P`;
              } else if (found.halfDayPeriod === "2NDHALF") {
                // first half present, second half is leave/WFH
                row[dayStr] = `P/${found.consideration}`;
              } else {
                // fallback: keep previous ordering
                row[dayStr] = `${found.consideration}/P`;
              }
              if (found.lopDays === 0 || !found.lopDays) {
                // If this is a half-day leave/wfh that isn't LOP, it's counted as working/payable
                if (found.consideration === "VAC") {
                  VAC += 0.5;
                }
                Working += 1;
                Payble += 1;
              } else {
                // partial LOP scenario
                if (found.consideration === "VAC") {
                  VAC += 0.5;
                }
                Working += 0.5;
                Payble += 0.5;
                LO += 0.5;
              }
            } else {
              if (status === "FH") {
                row[dayStr] = "AB/P";
              } else {
                row[dayStr] = "P/AB";
              }
              Working += 0.5;
              Payble += 0.5;
              LO += 0.5;
            }
            continue;
          }
        }

        if (leaveData[dateStr] && wfhData[dateStr]) {
          const leaveEntry = leaveData[dateStr];
          const wfhEntry = wfhData[dateStr];
          // Both present as half-day and complementary halves
          if (
            leaveEntry && wfhEntry &&
            leaveEntry.isHalfDay && wfhEntry.isHalfDay &&
            leaveEntry.halfDayPeriod && wfhEntry.halfDayPeriod &&
            leaveEntry.halfDayPeriod !== wfhEntry.halfDayPeriod
          ) {
            // Build left/right display according to half periods
            let left, right;
            if (leaveEntry.halfDayPeriod === "1STHALF") {
              left = leaveEntry.consideration === "LO" ? "LOP" : (leaveEntry.consideration || "LOP");
              right = wfhEntry.consideration || "WFH";
            } else {
              left = wfhEntry.consideration || "WFH";
              right = leaveEntry.consideration === "LO" ? "LOP" : (leaveEntry.consideration || "LOP");
            }
            row[dayStr] = `${left}/${right}`;
            // Counters: half leave + half WFH
            if (leaveEntry.consideration === "LO") {
              LO += 0.5;
            } else if (leaveEntry.consideration === "OD") {
              OD += 0.5;
            } else if (leaveEntry.consideration === "CL") {
              CL += 0.5;
            } else if (leaveEntry.consideration === "VAC") {
              VAC += 0.5;
            } else {
              LO += 0.5;
            }
            WFH += 0.5;
            // WFH half is payable
            Payble += 0.5;
            continue;
          }
        }

        // 4) If no attendance or attendance not decisive, check WFH
        if (wfhData[dateStr]) {
          const wfhEntry = wfhData[dateStr];
          if (wfhEntry && wfhEntry.isHalfDay) {
            const cons = wfhEntry.consideration || "WFH";
            if (wfhEntry.halfDayPeriod === "1STHALF") {
              // half-day WFH for first half, absent for second half
              row[dayStr] = `${cons}/AB`;
            } else {
              // half-day WFH for second half, absent for first half
              row[dayStr] = `AB/${cons}`;
            }
            // count half-day WFH as half WFH and half absent
            WFH += 0.5;
            LO += 0.5; // absent half
          } else {
            row[dayStr] = wfhEntry.consideration || "WFH";
            WFH += 1;
          }
          continue;
        }

        // 5) Leave (when there is no attendance/WFH)
        if (leaveData[dateStr]) {
          const leaveEntry = leaveData[dateStr];
          if (leaveEntry && leaveEntry.isHalfDay) {
            const cons = leaveEntry.consideration === "LO" ? "LOP" : (leaveEntry.consideration || "LOP");
            if (leaveEntry.halfDayPeriod === "1STHALF") {
              // half-day leave for first half, absent for second half
              row[dayStr] = `${cons}/AB`;
            } else {
              // half-day leave for second half, absent for first half
              row[dayStr] = `AB/${cons}`;
            }
            // increment counters for half-day leave and absent half
            if (cons === "LOP") {
              LO += 0.5;
            } else if (cons === "OD") {
              OD += 0.5;
            } else if (cons === "CL") {
              CL += 0.5;
            } else {
              LO += 0.5;
            }
            // absent half
            LO += 0.5;
          } else {
            row[dayStr] = leaveEntry.consideration === "LO" ? "LOP" : leaveEntry.consideration || "LOP";
            if (row[dayStr] === "LO" || row[dayStr] === "LOP") {
              LO++;
            } else if (row[dayStr] === "VAC") {
              VAC++;
            }
            if (row[dayStr] === "OD") {
              OD++;
            } else if (row[dayStr] === "CL") {
              CL++;
            }
          }
          continue;
        }

        // 6) Future dates
        if (dateStr > getISTDateAndTime().toISOString().split("T")[0]) {
          row[dayStr] = "-";
          continue;
        }

        if (considerAttendence === false) {
          row[dayStr] = "P";
          Working++;
          Payble++;
          continue;
        } else {
          row[dayStr] = "AB";
          LO++;
        }
      }

      Payble += PH + WO + WFH + OD + CL + VAC;

      row["WO"] = WO;
      row["No.of Days"] = dateColumns.length;
      row["OD's"] = OD;
      row["WFH"] = WFH;
      row["VAC"] = VAC;
      row["PH"] = PH;
      row["CL Used"] = CL;
      row["No.of Working Days"] = Working;
      row["Payble Days"] = Payble;
      row["LOP"] = LO;

      reportRows.push(row);
    }

    const columns = [
      "Emp.Code",
      "Emp.Name",
      "Designation",
      "Account Number",
      ...dateColumns,
      "WO",
      "No.of Days",
      "OD's",
      "CL Used",
      "WFH",
      "VAC",
      "PH",
      "No.of Working Days",
      "Payble Days",
      "LOP",
    ];

    if (req.query.format === "excel" || req.body.format === "excel") {
      try {
        const workbook = await generateExcelReport(
          [
            "Emp.Code",
            "Emp.Name",
            "Designation",
            "Account Number",
            ...dateColumns,
            "WO",
            "No. of Days",
            "OD's",
            "WFH",
            "VAC",
            "PH",
            "No. of Working Days",
            "Payble Days",
            "LOP",
            "CL Used",
          ],
          reportRows,
          startDate,
          endDate
        );
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=AttendanceReport_${startDate}_to_${endDate}.xlsx`
        );
        res.send(buffer);
      } catch (error) {
        console.error("Error generating Excel:", error);
        return res.status(500).json({
          status: false,
          message: "Error generating Excel report",
        });
      }
    } else {
      return res.status(200).json({
        status: true,
        columns: [
          "Emp.Code",
          "Emp.Name",
          "Designation",
          "Account Number",
          ...dateColumns,
          "WO",
          "No.of Days",
          "OD's",
          "CL Used",
          "WFH",
          "VAC",
          "PH",
          "No.of Working Days",
          "Payble Days",
          "LOP",
        ],
        data: reportRows,
      });
    }
  } catch (error) {
    console.error("Error in getAttendenceReport:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const getAttendenceReport = async (req, res) => {
//   try {
//     const { startDate, endDate, format } = req.body;

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         status: false,
//         message: "startDate and endDate are required.",
//       });
//     }

//     if (new Date(startDate) > new Date(endDate)) {
//       return res.status(400).json({
//         status: false,
//         message: "startDate cannot be greater than endDate.",
//       });
//     }

//     const fromDateStart = new Date(startDate);
//     fromDateStart.setUTCHours(0, 0, 0, 0);
//     const toDateEnd = new Date(endDate);
//     toDateEnd.setUTCHours(23, 59, 59, 999);

//     const orgId = new objectId(req.user.orgId);

//     // Parallel fetch: accepted status, employees, holidays, sundays
//     const [acceptedStatusId, employeeResult, holidaysResult, sundaysResult] =
//       await Promise.all([
//         statusTypeSchema.findOne({ orgId, statusType: "ACCEPTED" }, { _id: 1 }),
//         getAllEmployeeData(orgId),
//         getHolidays(orgId, fromDateStart, toDateEnd),
//         getSundays(fromDateStart, toDateEnd),
//       ]);

//     if (!acceptedStatusId) {
//       return res.status(404).json({
//         status: false,
//         message: "No accepted status id found",
//       });
//     }

//     if (!employeeResult.status) {
//       return res.status(500).json({
//         status: false,
//         message: "Failed to fetch employees",
//       });
//     }

//     const employees = employeeResult.data;
//     const holidays = holidaysResult.date || {};
//     const sundays = sundaysResult.data || {};

//     // build dateColumns and dateMap
//     const dateColumns = [];
//     const dateMap = [];
//     let d = new Date(fromDateStart);
//     while (d <= toDateEnd) {
//       const dateStr = d.toISOString().split("T")[0];
//       const dayStr = ("0" + d.getDate()).slice(-2);
//       dateColumns.push(dayStr);
//       dateMap.push({ dateStr, dayStr });
//       d.setDate(d.getDate() + 1);
//     }

//     // helper to find half-day entry matching attendance half
//     const findHalfDayMatch = (entry, status) => {
//       if (!status) return null;
//       const targetPeriod = status === "FH" ? "1STHALF" : status === "SH" ? "2NDHALF" : null;
//       if (!targetPeriod) return null;

//       if (Array.isArray(entry)) {
//         return entry.find((e) => e && e.isHalfDay && e.halfDayPeriod === targetPeriod) || null;
//       } else if (entry && entry.isHalfDay) {
//         return entry.halfDayPeriod === targetPeriod ? entry : null;
//       }
//       return null;
//     };

//     const reportRows = [];

//     for (const emp of employees) {
//       const empId = emp.employeeId;
//       const empName = emp.employeeName;
//       const empCode = emp.employeeCode;

//       // Parallel fetch for this employee
//       const [attendanceResult, leaveResult, wfhRequests] = await Promise.all([
//         getMonthlyAttendenceReport(empId, fromDateStart, toDateEnd),
//         getLeaveReport(empId, fromDateStart, toDateEnd, acceptedStatusId._id),
//         getWFHReport(empId, fromDateStart, toDateEnd, acceptedStatusId._id),
//       ]);

//       const attendanceData = attendanceResult.data || {};
//       const leaveData = leaveResult.data || {};
//       const wfhData = wfhRequests.data || {};

//       const row = {
//         "E.ID": empCode,
//         "E.Name": empName,
//       };

//       let WO = 0,
//         OD = 0,
//         PH = 0,
//         Working = 0,
//         Payble = 0,
//         LOP = 0,
//         WFH = 0;

//       for (let i = 0; i < dateMap.length; i++) {
//         const { dateStr, dayStr } = dateMap[i];
//         let status = attendanceData[dateStr]?.status || "";

//         // 1) Holiday
//         if (holidays[dateStr]) {
//           row[dayStr] = holidays[dateStr].shortCode || "PH";
//           PH++;
//           Payble += 1; // holiday counted as payable in this setup
//           continue;
//         }

//         // 2) Sunday (WO)
//         if (sundays[dateStr]) {
//           row[dayStr] = sundays[dateStr].shortCode || "WO";
//           WO++;
//           Payble += 1;
//           continue;
//         }

//         // 3) Leave (take precedence over WFH)
//         if (leaveData[dateStr]) {
//           const leaveEntry = leaveData[dateStr];
//           // array of leaves -> show joined considerations (legacy behavior)
//           if (Array.isArray(leaveEntry)) {
//             row[dayStr] = leaveEntry.map((l) => l.consideration).join(",");
//             // count as leave day (not payable) - original approach incremented LO; same behaviour:
//             LOP++;
//           } else {
//             // single leave object - check half-day merging with attendance (FH/SH)
//             if ((status === "FH" || status === "SH") && leaveEntry.isHalfDay) {
//               // find matching half-day leave
//               const leaveFound = findHalfDayMatch(leaveEntry, status) || (leaveEntry.isHalfDay ? leaveEntry : null);
//               if (leaveFound) {
//                 row[dayStr] = `${leaveFound.consideration}/P`;
//                 // if lopDays present and > 0, apply partial LOP
//                 if (leaveFound.lopDays && Number(leaveFound.lopDays) > 0) {
//                   Working += 0.5;
//                   Payble += 0.5;
//                   LOP += Number(leaveFound.lopDays);
//                 } else {
//                   // no LOP -> full count as working/payable
//                   Working += 1;
//                   Payble += 1;
//                 }
//               } else {
//                 // no matching leave half -> attendance half-day absent scenario
//                 if (status === "FH") row[dayStr] = "AB/P";
//                 else row[dayStr] = "P/AB";
//                 Working += 0.5;
//                 Payble += 0.5;
//                 LOP += 0.5;
//               }
//             } else {
//               // full day leave
//               row[dayStr] =
//                 leaveEntry.consideration === "LO" ? "LOP" : leaveEntry.consideration || "LOP";
//               LOP += leaveEntry.lopDays ? Number(leaveEntry.lopDays) : 1;
//               // Full day leave is typically not counted as Working/Payable (matching previous behavior).
//             }
//           }
//           continue;
//         }

//         // 4) WFH - treat like leave, but WFH is usually payable in your earlier logic
//         if (wfhData[dateStr]) {
//           const wfhEntry = wfhData[dateStr];
//           if (Array.isArray(wfhEntry)) {
//             // join multiple WFH considerations if present
//             // but also check for half-day match with attendance
//             const halfMatch = findHalfDayMatch(wfhEntry, status);
//             if (halfMatch) {
//               row[dayStr] = `${halfMatch.consideration}/P`;
//               // treat half-day WFH + half-day present as full working day
//               Working += 1;
//               Payble += 1;
//             } else {
//               row[dayStr] = wfhEntry.map((w) => w.consideration).join(",");
//               WFH += 1; // count as a WFH day
//               Payble += 1; // WFH counts as payable
//             }
//           } else {
//             // single object
//             if ((status === "FH" || status === "SH") && wfhEntry.isHalfDay) {
//               const wfhFound = findHalfDayMatch(wfhEntry, status) || (wfhEntry.isHalfDay ? wfhEntry : null);
//               if (wfhFound) {
//                 row[dayStr] = `${wfhFound.consideration}/P`;
//                 Working += 1;
//                 Payble += 1;
//               } else {
//                 if (status === "FH") row[dayStr] = "AB/P";
//                 else row[dayStr] = "P/AB";
//                 Working += 0.5;
//                 Payble += 0.5;
//                 LOP += 0.5;
//               }
//             } else {
//               // full day WFH
//               row[dayStr] = wfhEntry.consideration || "WFH";
//               WFH += 1;
//               Payble += 1;
//             }
//           }
//           continue;
//         }

//         // 5) Attendance-based statuses next
//         if (status) {
//           if (status === "P") {
//             row[dayStr] = "P";
//             Working += 1;
//             Payble += 1;
//           } else if (status === "FH" || status === "SH") {
//             // handle half-day attendance with no leave/wfh match => partial present + partial LOP
//             // (we already tried matching with leave/wfh above)
//             if (status === "FH") {
//               row[dayStr] = "AB/P";
//             } else {
//               row[dayStr] = "P/AB";
//             }
//             Working += 0.5;
//             Payble += 0.5;
//             LOP += 0.5;
//           } else if (status === "OD") {
//             row[dayStr] = "OD";
//             OD++;
//             Payble += 1;
//           } else {
//             // other attendance statuses (e.g., FD etc.)
//             row[dayStr] = status;
//           }
//         } else {
//           // 6) Nothing found -> mark AB (absent/LOP)
//           row[dayStr] = "AB";
//           LOP += 1;
//         }
//       } // end per-date loop

//       // Finish row totals
//       row["WO"] = WO;
//       row["No. of Days"] = dateColumns.length;
//       row["OD"] = OD;
//       row["WFH"] = WFH;
//       row["PH"] = PH;
//       row["Working"] = Working;
//       row["Payble"] = Payble;
//       row["LOP"] = LOP;

//       reportRows.push(row);
//     } // end per-employee

//     const columns = [
//       "E.ID",
//       "E.Name",
//       ...dateColumns,
//       "WO",
//       "No. of Days",
//       "OD",
//       "WFH",
//       "PH",
//       "Working",
//       "Payble",
//       "LOP",
//     ];

//     if (req.query.format === "excel" || req.body.format === "excel") {
//       try {
//         const workbook = await generateExcelReport(columns, reportRows, startDate, endDate);
//         const buffer = await workbook.xlsx.writeBuffer();
//         res.setHeader(
//           "Content-Type",
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         );
//         res.setHeader(
//           "Content-Disposition",
//           `attachment; filename=AttendanceReport_${startDate}_to_${endDate}.xlsx`
//         );
//         res.send(buffer);
//       } catch (error) {
//         console.error("Error generating Excel:", error);
//         return res.status(500).json({
//           status: false,
//           message: "Error generating Excel report",
//         });
//       }
//     } else {
//       return res.status(200).json({
//         status: true,
//         columns,
//         data: reportRows,
//       });
//     }
//   } catch (error) {
//     console.error("Error in getAttendenceReport:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

// setTimeout(async () => {
//   console.log("This is a delayed log message.");
//   const employeeId = "68bbfccb06e9159927029415";

//   const startDate = "2025-09-01";
//   const endDate = "2025-09-30";

//   const fromDateStart = new Date(startDate);
//   fromDateStart.setUTCHours(0, 0, 0, 0);
//   const toDateEnd = new Date(endDate);
//   toDateEnd.setUTCHours(23, 59, 59, 999);

//   const orgId = new objectId("68bbfb1106e9159927029312");

//   console.log(fromDateStart, toDateEnd);

//   const acceptedStatusId = await statusTypeSchema.findOne(
//     { orgId, statusType: "ACCEPTED" },
//     { _id: 1 }
//   );

//   if (!acceptedStatusId) {
//     console.warn("No accepted status id found");
//   }
//   //   console.log(acceptedStatusId);

//   const employeeData = await getAllEmployeeData(orgId);
//     console.log("Employee Data:", employeeData);

//   const holidays = await getHolidays(orgId, fromDateStart, toDateEnd);
//     console.log("Holidays:", holidays);

//   const sundays = getSundays(fromDateStart, toDateEnd);
//     console.log("Sundays:", sundays);

//   const attendanceReport = await getMonthlyAttendenceReport(
//     employeeId,
//     fromDateStart,
//     toDateEnd
//   );
//   console.log("Monthly Attendance Report:", attendanceReport);

//   const leaveReport = await getLeaveReport(
//     employeeId,
//     fromDateStart,
//     toDateEnd,
//     acceptedStatusId._id
//   );
//   console.log("Leave Report:", leaveReport);
// }, 5000);

const getUnActiveEmployee = async (req, res) => {
  try {
    // const orgId = req?.user?.orgId;
    // if(!orgId) {
    //   return res.status(400).json({
    //     status: false,
    //     message: "Organization ID is required.",
    //   });
    // }

    const employees = await employeeSchema.aggregate([
      {
        $match: {
          // orgId : new objectId(orgId)
          $or: [{ lastLoginAt: null }, { lastLoginAt: { $exists: false } }],
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $project: {
          employeeCode: 1,
          employeeName: { $concat: ["$firstName", " ", "$lastName"] },
          phone: 1,
        },
      },
    ]);

    if (!employees || employees.length === 0) {
      console.warn("No inactive employees found for the organization");
    }

    return res.status(200).json({
      status: true,
      message: "Inactive employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Error in getUnActiveEmployee:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getActiveEmployee = async (req, res) => {
  try {
    const employees = await employeeSchema.aggregate([
      {
        $match: {
          lastLoginAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          employeeCode: 1,
          employeeName: { $concat: ["$firstName", " ", "$lastName"] },
          phone: 1,
        },
      },
    ]);

    if (!employees || employees.length === 0) {
      console.warn("No inactive employees found for the organization", orgId);
    }

    return res.status(200).json({
      status: true,
      message: "Active employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Error in getActiveEmployee:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  setTimeout(async () => {
//   const startDate = new Date("2025-09-01");
//   const endDate = new Date("2025-09-30");
//   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//     const dateStr = d.toISOString().split("T")[0];
//     console.log("Process Starts for day ", dateStr);
//   }
// }, 5000);

// setTimeout(async()=>{
//   console.log("This is a delayed log message.");
//   // You can add more code here to be executed after the delay
//   const data  = await dailyAttendenceSchema.updateMany(
//   {
//     logOutTime: null,  // still active
//     $expr: {
//       $gt: [
//         "$logInTime",
//         {
//           $dateFromParts: {
//             year: { $year: "$logInTime" },
//             month: { $month: "$logInTime" },
//             day: { $dayOfMonth: "$logInTime" },
//             hour: 15,
//             minute: 30
//           }
//         }
//       ]
//     }
//   },
//   [
//     {
//       $set: {
//         logOutTime: "$logInTime",
//         logInTime: null
//       }
//     }
//   ]
// )

// console.log("This is the updated data",data);

// }, 10000);

module.exports = {
  // getMonthlyAttendenceReport,
  // getLeaveReport,
  // getAllEmployeeData,
  // getHolidays,
  // getSundays,
  getUnActiveEmployee,
  getActiveEmployee,
  getAttendenceReport,
  getHolidays,
  getSundays,
};
