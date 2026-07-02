const mongoose = require("mongoose");
const objectId = mongoose.Types.ObjectId;
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");

const CLSchema = require("../../models/clSchema");
const ODSchema = require("../../models/odSchema");
const {
  getISTDateAndTime,
  changeGTMtoIST,
} = require("../../utils/timeFunction");

const cron = require("node-cron");
const organizationSchema = require("../../models/organizationSchema");
const statusTypesSchema = require("../../models/statusSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const statusSchema = require("../../models/statusSchema");
process.env.TZ = "Asia/Kolkata";

const getEmployeeCls = async (employeeId) => {
  try {
    // console.log("Fetching CLs for employeeId:", employeeId);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const fromDate = changeGTMtoIST(startOfYear);
    const toDate = getISTDateAndTime();

    const clsData = await CLSchema.aggregate([
      {
        $match: {
          employeeId: employeeId,
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "StatusInfo",
        },
      },
      {
        $unwind: {
          path: "$StatusInfo",
        },
      },
      {
        $group: {
          _id: "$StatusInfo.statusType",

          Count: { $sum: 0.5 },
        },
      },
    ]);

    // console.log("clsData", clsData);

    return {
      status: true,
      data:
        clsData.length > 0
          ? clsData
          : [
              {
                _id: "INACTIVE",
                Count: 0,
              },
              {
                _id: "ACTIVE",
                Count: 0,
              },
              {
                _id: "PROCESSING",
                Count: 0,
              },
            ],
    };
  } catch (error) {
    console.error("Error fetching CL data:", error);
    return { status: false, message: "Internal server error." };
  }
};

const getEmployeeOds = async (employeeId) => {
  try {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const fromDate = changeGTMtoIST(startOfYear);
    const toDate = getISTDateAndTime();

    // console.log("Fetching ODs from", fromDate, "to", toDate);
    const odsData = await ODSchema.aggregate([
      {
        $match: {
          employeeId: employeeId,
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "StatusInfo",
        },
      },
      {
        $unwind: {
          path: "$StatusInfo",
        },
      },
      {
        $group: {
          _id: "$StatusInfo.statusType",

          Count: { $sum: 0.5 },
        },
      },
    ]);

    return {
      status: true,
      data:
        odsData.length > 0
          ? odsData
          : [
              {
                _id: "INACTIVE",
                Count: 0,
              },
              {
                _id: "ACTIVE",
                Count: 0,
              },
              {
                _id: "PROCESSING",
                Count: 0,
              },
            ],
    };
  } catch (error) {
    console.error("Error fetching OD data:", error);
    return { status: false, message: "Internal server error." };
  }
};

const getEmployeeClsAndOds = async (req, res) => {
  try {
    const employeeId = req?.user?._id;
    const clsResult = await getEmployeeCls(employeeId);
    const odsResult = await getEmployeeOds(employeeId);

    return res.status(200).json({
      status: true,
      data: {
        CLs: clsResult.data,
        ODs: odsResult.data,
      },
    });
  } catch (error) {
    console.error("Error in getEmployeeClsAndOds:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

const addCLSForALlEmployees = async (orgId, activeStatusId) => {
  try {
    if (!orgId || !activeStatusId) {
      console.error("orgId or activeStatusId is missing");
      return { status: false, message: "orgId or activeStatusId is missing." };
    }

    if (typeof orgId === "string") {
      orgId = objectId(orgId);
    }
    if (typeof activeStatusId === "string") {
      activeStatusId = objectId(activeStatusId);
    }

    const allEmployees = await employeeSchema.find({ orgId }, { _id: 1 });

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    await Promise.all(
      allEmployees.map(async (emp) => {
        const existingCLs = await CLSchema.countDocuments({
          orgId,
          employeeId: emp._id,
          createdAt: {
            $gte: startOfMonth,
            $lte: getISTDateAndTime(),
          },
        });

        if (existingCLs < 2) {
          const recordsToAdd = [];
          for (let i = existingCLs; i < 2; i++) {
            recordsToAdd.push({
              orgId,
              employeeId: emp._id,
              statusId: activeStatusId,
              createdAt: getISTDateAndTime(),
            });
          }
          await CLSchema.insertMany(recordsToAdd);
        }
      })
    );

    logger.info(`CLs ensured for all employees in organization '${orgId}'`);
    return {
      status: true,
      message: "CLs ensured for every employee this month.",
    };
  } catch (error) {
    console.error("Error in addCLSForALlEmployees:", error);
    return { status: false, message: "Internal server error." };
  }
};

const addODSToEmployees = async (employees, orgId, activeStatusId) => {
  try {
    if (!orgId || !activeStatusId) {
      console.error("orgId or activeStatusId is missing");
      return { status: false, message: "orgId or activeStatusId is missing." };
    }

    if (!Array.isArray(employees) || employees.length === 0) {
      console.error("Employees array is empty or not provided");
      return { status: false, message: "Employees array is empty." };
    }

    if (typeof orgId === "string") {
      orgId = new mongoose.Types.ObjectId(orgId);
    }

    if (typeof activeStatusId === "string") {
      activeStatusId = new mongoose.Types.ObjectId(activeStatusId);
    }

    const FailedEmployees = [];
    const SuccessfulEmployees = [];

    await Promise.all(
      employees.map(async (emp) => {
        try {
          const recordsToAdd = [];

          for (let i = 0; i < emp.odCount * 2; i++) {
            recordsToAdd.push({
              orgId,
              employeeId: emp.employeeId,
              statusId: activeStatusId,
            });
          }

          if (recordsToAdd.length > 0) {
            await ODSchema.insertMany(recordsToAdd);
            SuccessfulEmployees.push(emp.employeeId);
          }
        } catch (empError) {
          console.error(
            `Error processing employee ${emp.employeeId}:`,
            empError
          );
          FailedEmployees.push(emp.employeeId);
        }
      })
    );

    logger.info(`OD addition completed. Successful: ${SuccessfulEmployees.length}, Failed: ${FailedEmployees.length}`);
    console.log(
      `OD addition completed. Successful: ${SuccessfulEmployees.length}, Failed: ${FailedEmployees.length}`
    );

    return {
      status: true,
      message: "ODs ensured for specified employees.",
      successful: SuccessfulEmployees,
      failed: FailedEmployees,
    };
  } catch (error) {
    console.error("Error in addODSToEmployees:", error);
    return { status: false, message: "Internal server error." };
  }
};

const getAllCLBalance = async (req, res) => {
  try {
    console.log("getAllCLBalance called");
    const orgId = await organizationSchema
      .findOne({ name: "Technical Hub" }, { _id: 1 })
      .then((org) => (org ? org._id : null));

    if (!orgId) {
      return res
        .status(400)
        .json({ status: false, message: "Organization ID is missing." });
    }

    const allEmployees = await CLSchema.aggregate([
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
        $group: {
          _id: "$employeeId",
          count: { $sum: 0.5 },
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
        },
      },
    ]);

    if (!allEmployees || allEmployees.length === 0) {
      return res
        .status(200)
        .json({ status: true, message: "No CL records found.", data: [] });
    }

    return res.status(200).json({
      status: true,
      message: "CL balances fetched successfully.",
      data: allEmployees,
    });
  } catch (error) {
    console.error("Error in getAllCLBalance:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

const getAllODBalance = async (req, res) => {
  try {
    const orgId = await organizationSchema
      .findOne({ name: "Technical Hub" }, { _id: 1 })
      .then((org) => (org ? org._id : null));

    if (!orgId) {
      return res
        .status(400)
        .json({ status: false, message: "Organization ID is missing." });
    }
    const allEmployees = await ODSchema.aggregate([
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
        $group: {
          _id: "$employeeId",
          count: { $sum: 0.5 },
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
        },
      },
    ]);

    if (!allEmployees || allEmployees.length === 0) {
      return res
        .status(200)
        .json({ status: true, message: "No OD records found.", data: [] });
    }

    return res.status(200).json({
      status: true,
      message: "OD balances fetched successfully.",
      data: allEmployees,
    });
  } catch (error) {
    console.error("Error in getAllODBalance:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error." });
  }
};

//! Schedule cron job to run at 00:01 on the 1st of every month
cron.schedule("1 0 1 * *", async () => {
  try {
    console.log("Running monthly CL addition cron job");
    const [orgId, activeStatusId] = await Promise.all([
      organizationSchema.findOne({ name: "Technical Hub" }, { _id: 1 }),
      statusTypesSchema.findOne({ statusType: "ACTIVE" }, { _id: 1 }),
    ]);

    if (!orgId || !activeStatusId) {
      console.error("Organization or ACTIVE status not found");
      return;
    }

    await addCLSForALlEmployees(orgId._id, activeStatusId._id);
    console.log("Monthly CL addition cron job completed");
  } catch (error) {
    console.error("Error in monthly CL addition cron job:", error);
  }
});

const assignOdsToEmployees = async (req, res) => {
  try {
    const { employeeArray, odCount } = req.body;
    const orgId = req?.user?.orgId;

    // Validate input
    if (
      !employeeArray ||
      !Array.isArray(employeeArray) ||
      employeeArray.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Employee Array is required and cannot be empty",
      });
    }

    if (!odCount || odCount <= 0) {
      return res
        .status(400)
        .json({ status: false, message: "odCount must be greater than 0" });
    }

    // Get ACTIVE status
    const activeStatus = await statusTypesSchema.findOne(
      { statusType: "ACTIVE", orgId: orgId },
      { _id: 1 }
    );
    if (!activeStatus) {
      return res
        .status(400)
        .json({ status: false, message: "Active status not found" });
    }

    const successEmployees = [];
    const failedEmployees = [];

    for (const empId of employeeArray) {
      const employee = await employeeSchema.findOne({
        orgId: orgId,
        employeeCode: empId,
      });

      if (!employee) {
        failedEmployees.push(empId);
      } else {
        const recordsToAdd = [];
        for (let i = 0; i < 2 * odCount; i++) {
          recordsToAdd.push({
            orgId,
            employeeId: employee._id,
            statusId: activeStatus._id,
          });
        }

        try {
          if (recordsToAdd.length > 0) {
            await ODSchema.insertMany(recordsToAdd);
            successEmployees.push(empId);
          }
        } catch (err) {
          failedEmployees.push(empId);
        }
      }
    }

    logger.info(`OD assignment process completed. Successful: ${successEmployees.length}, Failed: ${failedEmployees.length}`);
    return res.status(200).json({
      status: true,
      message: "OD assignment process completed",
      successEmployees,
      failedEmployees,
    });
  } catch (error) {
    console.error("Error in assignOds:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const generateClOdExcelReport = (data, startDate, endDate) => {
  // Prepare worksheet data
  const headers = [
    "S.No",
    "Employee Code",
    "Employee Name",
    "Previous CLs",
    "Added CLs",
    "Used CLs",
    "Forward CLs",
    "Previous ODs",
    "Added ODs",
    "Used ODs",
    "Forward ODs",
  ];

  const worksheetData = [];

  // Title row
  // worksheetData.push([`TECHNICAL HUB`]);
  worksheetData.push([`CL & OD Summary Report (${startDate} TO ${endDate})`]);

  // Empty row before header
  worksheetData.push([]);

  // Header row
  worksheetData.push(headers);

  // Data rows
  data.forEach((row, idx) => {
    worksheetData.push([
      idx + 1,
      row.employeeCode,
      row.employeeName,
      row.previousCLs,
      row.addedCLs,
      row.usedCLs,
      row.forwardCLs,
      row.previousODs,
      row.addedODs,
      row.usedODs,
      row.forwardODs,
    ]);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths roughly (optional)
  const colWidths = [
    { wch: 6 }, // S.No
    { wch: 15 }, // Employee Code
    { wch: 25 }, // Employee Name
    { wch: 12 }, // Previous CLs
    { wch: 12 }, // Added CLs
    { wch: 12 }, // Used CLs
    { wch: 12 }, // Forward CLs
    { wch: 12 }, // Previous ODs
    { wch: 12 }, // Added ODs
    { wch: 12 }, // Used ODs
    { wch: 12 }, // Forward ODs
  ];
  worksheet["!cols"] = colWidths;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CL & OD Summary");

  // Return workbook buffer to send as response
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
  return excelBuffer;
};

const getOdAndClSummary = async (req, res) => {
  try {
    const { fromDate, toDate, format } = req.body;
    const orgId = req?.user?.orgId;

    if (!orgId) {
      return res.status(400).json({ status: false, message: "orgId missing" });
    }
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ status: false, message: "fromDate/toDate required" });
    }
    if (new Date(toDate) < new Date(fromDate)) {
      return res
        .status(400)
        .json({ status: false, message: "toDate must be >= fromDate" });
    }

    const startOfYear = changeGTMtoIST(
      new Date(new Date(fromDate).getFullYear(), 0, 1)
    );

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log("fromDate:", fromDate, "toDate:", toDate);
    // console.log("fromDateStart:", fromDateStart, "toDateEnd:", toDateEnd);
    // console.log("Start of year:", startOfYear);

    // get statuses
    const [activeStatus, inActiveStatus] = await Promise.all([
      statusTypesSchema.findOne({ statusType: "ACTIVE", orgId }, { _id: 1 }),
      statusTypesSchema.findOne({ statusType: "INACTIVE", orgId }, { _id: 1 }),
    ]);

    if (!activeStatus || !inActiveStatus) {
      return res
        .status(400)
        .json({ status: false, message: "status types missing" });
    }

    const prevClsPipeline = [
      {
        $match: {
          orgId: orgId,
          createdAt: {
            $gte: startOfYear,
            $lt: fromDateStart,
          },
          updatedAt: {
            $lt: fromDateStart,
          },
          statusId: activeStatus._id,
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
        $group: {
          _id: "$employeeId",
          employeeCode: {
            $first: "$employeeInfo.employeeCode",
          },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          prevCL: { $sum: 0.5 },
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          prevCL: 1,
        },
      },
    ];

    const addedClsPipeline = [
      {
        $match: {
          orgId: orgId,
          createdAt: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
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
        $group: {
          _id: "$employeeId",
          employeeCode: {
            $first: "$employeeInfo.employeeCode",
          },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          addedCL: { $sum: 0.5 },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          addedCL: 1,
        },
      },
    ];

    const usedClsPipeline = [
      {
        $match: {
          orgId: orgId,
          $expr: { $ne: ["$createdAt", "$updatedAt"] },
          updatedAt: { $gte: fromDateStart, $lte: toDateEnd },
          statusId: inActiveStatus._id,
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
        $group: {
          _id: "$employeeId",
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          usedCL: { $sum: 0.5 },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          usedCL: 1,
        },
      },
    ];

    const prevOdsPipeline = [
      {
        $match: {
          orgId: orgId,
          createdAt: {
            $gte: startOfYear,
            $lt: fromDateStart,
          },
          updatedAt: {
            $lt: fromDateStart,
          },
          statusId: activeStatus._id,
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
        $group: {
          _id: "$employeeId",
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          prevOD: { $sum: 0.5 },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          prevOD: 1,
        },
      },
    ];

    const addedOdsPipeline = [
      {
        $match: {
          orgId: orgId,
          createdAt: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
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
        $group: {
          _id: "$employeeId",
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          addedOD: { $sum: 0.5 },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          addedOD: 1,
        },
      },
    ];

    const usedOdsPipeline = [
      {
        $match: {
          orgId: orgId,
          $expr: { $ne: ["$createdAt", "$updatedAt"] },
          updatedAt: { $gte: fromDateStart, $lte: toDateEnd },
          statusId: inActiveStatus._id,
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
        $group: {
          _id: "$employeeId",
          employeeCode: { $first: "$employeeInfo.employeeCode" },
          employeeName: {
            $first: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
          },
          usedOD: { $sum: 0.5 },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          employeeCode: 1,
          employeeName: 1,
          usedOD: 1,
        },
      },
    ];

    const [prevCLs, addedCLs, usedCLs, prevODs, addedODs, usedODs] =
      await Promise.all([
        CLSchema.aggregate(prevClsPipeline),
        CLSchema.aggregate(addedClsPipeline),
        CLSchema.aggregate(usedClsPipeline),
        ODSchema.aggregate(prevOdsPipeline),
        ODSchema.aggregate(addedOdsPipeline),
        ODSchema.aggregate(usedOdsPipeline),
      ]);

    const map = new Map();

    const pushToMap = (arr, keyName) => {
      for (const r of arr) {
        const code = r.employeeCode ?? String(r.employeeId);
        if (!map.has(code)) {
          map.set(code, {
            employeeCode: code,
            employeeName: r.employeeName ?? "",
            previousCLs: 0,
            addedCLs: 0,
            usedCLs: 0,
            forwardCLs: 0,
            previousODs: 0,
            addedODs: 0,
            usedODs: 0,
            forwardODs: 0,
          });
        }
        const entry = map.get(code);
        entry.employeeName = entry.employeeName || r.employeeName || "";
        if (keyName === "prevCL")
          entry.previousCLs = (entry.previousCLs || 0) + (r.prevCL || 0);
        if (keyName === "addedCL")
          entry.addedCLs = (entry.addedCLs || 0) + (r.addedCL || 0);
        if (keyName === "usedCL")
          entry.usedCLs = (entry.usedCLs || 0) + (r.usedCL || 0);

        if (keyName === "prevOD")
          entry.previousODs = (entry.previousODs || 0) + (r.prevOD || 0);
        if (keyName === "addedOD")
          entry.addedODs = (entry.addedODs || 0) + (r.addedOD || 0);
        if (keyName === "usedOD")
          entry.usedODs = (entry.usedODs || 0) + (r.usedOD || 0);
      }
    };

    pushToMap(prevCLs, "prevCL");
    pushToMap(addedCLs, "addedCL");
    pushToMap(usedCLs, "usedCL");

    pushToMap(prevODs, "prevOD");
    pushToMap(addedODs, "addedOD");
    pushToMap(usedODs, "usedOD");

    const result = Array.from(map.values()).map((e) => {
      const previousCLs = Number((e.previousCLs || 0).toFixed(1));
      const addedCLs = Number((e.addedCLs || 0).toFixed(1));
      const usedCLs = Number((e.usedCLs || 0).toFixed(1));
      const forwardCLs = Number((previousCLs + addedCLs - usedCLs).toFixed(1));

      const previousODs = Number((e.previousODs || 0).toFixed(1));
      const addedODs = Number((e.addedODs || 0).toFixed(1));
      const usedODs = Number((e.usedODs || 0).toFixed(1));
      const forwardODs = Number((previousODs + addedODs - usedODs).toFixed(1));

      return {
        employeeCode: e.employeeCode,
        employeeName: e.employeeName,
        previousCLs,
        addedCLs,
        usedCLs,
        forwardCLs,
        previousODs,
        addedODs,
        usedODs,
        forwardODs,
      };
    });

    result.sort((a, b) => {
      const na = Number(a.employeeCode);
      const nb = Number(b.employeeCode);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return (a.employeeCode || "").localeCompare(b.employeeCode || "");
    });

    const final = result.map((r, idx) => ({ sNo: idx + 1, ...r }));

    const monthLabel = new Date(fromDate).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (format === "excel") {
      const buffer = generateClOdExcelReport(final, fromDate, toDate);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=CL_OD_Summary_${fromDate}_to_${toDate}.xlsx`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    // Otherwise send JSON
    return res.status(200).json({
      status: true,
      month: monthLabel,
      data: final,
    });
  } catch (error) {
    console.error("Error in getOdSummary:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getClAndOdDateOfAnyEmployee = async (req, res) => {
  try {
    const { employeeCode } = req.body;
    const employeeId = await employeeSchema.findOne(
      { employeeCode },
      { _id: 1 }
    );

    if (!employeeId) {
      return res
        .status(400)
        .json({ status: false, message: "Employee not found" });
    }
    const clsResult = await getEmployeeCls(employeeId._id);
    const odsResult = await getEmployeeOds(employeeId._id);

    // console.log("clsResult, odsResult", clsResult, odsResult);

    if (!clsResult.status || !odsResult.status) {
      return res
        .status(500)
        .json({ status: false, message: "Error fetching CL/OD data" });
    }

    return res.status(200).json({
      status: true,
      data: {
        CLs: clsResult.data,
        ODs: odsResult.data,
      },
    });
  } catch (error) {}
};

const addClsOrOdsToEmployees = async (req, res) => {
  try {
    const { employeeCode, count, type } = req.body;

    if (!employeeCode || !count || !type) {
      return res.status(400).json({
        status: false,
        message: "employeeCode, count, and type are required",
      });
    }

    if (!["CL", "OD"].includes(type)) {
      return res.status(400).json({
        status: false,
        message: "type must be either 'CL' or 'OD'",
      });
    }

    if (count <= 0) {
      return res.status(400).json({
        status: false,
        message: "count must be greater than 0",
      });
    }

    const employee = await employeeSchema.findOne({
      employeeCode: employeeCode,
    });

    if (!employee) {
      return res.status(400).json({
        status: false,
        message: `Employee with code ${employeeCode} not found`,
      });
    }

    const activeStatus = await statusTypesSchema.findOne(
      { statusType: "ACTIVE", orgId: employee.orgId },
      { _id: 1 }
    );

    if (!activeStatus) {
      return res.status(400).json({
        status: false,
        message: "Active status not found for the organization",
      });
    }

    const recordsToAdd = [];
    for (let i = 0; i < 2 * count; i++) {
      recordsToAdd.push({
        orgId: employee.orgId,
        employeeId: employee._id,
        statusId: activeStatus._id,
        createdAt: getISTDateAndTime(),
        updatedAt: getISTDateAndTime(),
      });
    }

    try {
      if (recordsToAdd.length > 0) {
        await (type === "CL" ? CLSchema : ODSchema).insertMany(recordsToAdd);

        logger.info(`Successfully added ${count} ${type}(s) to employee ${employeeCode}`);
        return res.status(200).json({
          status: true,
          message: `Successfully added ${count} ${type}(s) to employee ${employeeCode}`,
          data: {
            employeeCode,
            addedCount: count,
            type,
            recordsCreated: recordsToAdd.length,
          },
        });
      }
    } catch (err) {
      console.error(`Error inserting ${type} records:`, err);
      return res.status(500).json({
        status: false,
        message: `Failed to add ${type} records`,
        error: err.message,
      });
    }

    return res.status(400).json({
      status: false,
      message: "No records to add",
    });
  } catch (error) {
    console.error("Error in addClsOrOdsToEmployees:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const removeClsOrOdsFromEmployees = async (req, res) => {
  try {
    const { employeeCode, count, type } = req.body;

    if (!employeeCode || !count || !type) {
      return res.status(400).json({
        status: false,
        message: "employeeCode, count, and type are required",
      });
    }

    if (!["CL", "OD"].includes(type)) {
      return res.status(400).json({
        status: false,
        message: "type must be either 'CL' or 'OD'",
      });
    }

    if (count <= 0) {
      return res.status(400).json({
        status: false,
        message: "count must be greater than 0",
      });
    }

    const employee = await employeeSchema.findOne({
      employeeCode: employeeCode,
    });

    if (!employee) {
      return res.status(400).json({
        status: false,
        message: `Employee with code ${employeeCode} not found`,
      });
    }

    const [activeStatus, inActiveStatus] = await Promise.all([
      statusTypesSchema.findOne(
        { statusType: "ACTIVE", orgId: employee.orgId },
        { _id: 1 }
      ),
      statusTypesSchema.findOne(
        { statusType: "INACTIVE", orgId: employee.orgId },
        { _id: 1 }
      ),
    ]);

    if (!activeStatus || !inActiveStatus) {
      return res.status(400).json({
        status: false,
        message:
          "Required status types (ACTIVE/INACTIVE) not found for the organization",
      });
    }

    const activeRecords = await (type === "CL" ? CLSchema : ODSchema)
      .find({
        employeeId: employee._id,
        statusId: activeStatus._id,
      })
      .sort({ createdAt: 1 })
      .limit(count * 2);

    if (!activeRecords || activeRecords.length === 0) {
      return res.status(400).json({
        status: false,
        message: `No active ${type} records found for employee ${employeeCode}`,
      });
    }

    if (activeRecords.length < count * 2) {
      return res.status(400).json({
        status: false,
        message: `Employee ${employeeCode} only has ${
          activeRecords.length / 2
        } active ${type}(s), but you requested to remove ${count}`,
      });
    }

    const updatePromises = activeRecords.map((record) =>
      (type === "CL" ? CLSchema : ODSchema).updateOne(
        { _id: record._id },
        {
          $set: {
            statusId: inActiveStatus._id,
            updatedAt: getISTDateAndTime(),
          },
        }
      )
    );

    const results = await Promise.all(updatePromises);

    const successfulUpdates = results.filter(
      (result) => result.modifiedCount > 0
    ).length;

    logger.info(`Successfully removed ${successfulUpdates / 2} ${type}(s) from employee ${employeeCode}`);
    return res.status(200).json({
      status: true,
      message: `Successfully removed ${
        successfulUpdates / 2
      } ${type}(s) from employee ${employeeCode}`,
      data: {
        employeeCode,
        removedCount: successfulUpdates / 2,
        type,
        recordsUpdated: successfulUpdates,
      },
    });
  } catch (error) {
    console.error("Error in removeClsOrOdsFromEmployees:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// const addTwoCLsToAllEmployees = async (orgId, activeStatusId) => {
//   try {
//     if (!orgId || !activeStatusId) {
//       console.error("orgId or activeStatusId is missing");
//       return { status: false, message: "orgId or activeStatusId is missing." };
//     }
//     if (typeof orgId === "string") {
//       orgId = objectId(orgId);
//     }

//     if (typeof activeStatusId === "string") {
//       activeStatusId = objectId(activeStatusId);
//     }

//     const allEmployees = await employeeSchema.find({ orgId }, { _id: 1 });

//     const startOfMonth = new Date(
//       new Date().getFullYear(),
//       new Date().getMonth(),
//       1
//     );

//     for (const emp of allEmployees) {
//       const recordsToAdd = [];
//       for (let i = 0; i < 2; i++) {
//         recordsToAdd.push({
//           orgId,
//           employeeId: emp._id,
//           statusId: activeStatusId,
//         });
//       }
//       if (recordsToAdd.length > 0) {
//         await CLSchema.insertMany(recordsToAdd);
//       }
//     }
//   } catch (error) {
//     console.error("Error in addTwoCLsToAllEmployees:", error);
//     return { status: false, message: "Error in adding CLs." };
//   }

//   return { status: true, message: "Successfully added CLs." };
// };

// setTimeout(async () => {
//   try {
//     console.log("Initial CL addition on server start");
//     const [orgId, activeStatusId] = await Promise.all([
//       organizationSchema.findOne({ name: "Technical Hub" }, { _id: 1 }),
//       statusTypesSchema.findOne({ statusType: "ACTIVE" }, { _id: 1 }),
//     ]);

//     if (!orgId || !activeStatusId) {
//       console.error("Organization or ACTIVE status not found");
//       return;
//     }

//     // await addTwoCLsToAllEmployees(orgId._id, activeStatusId._id);

//     console.log("Initial CL addition completed");
//   } catch (error) {
//     console.error("Error in initial CL addition:", error);
//   }
// }, 5000);

module.exports = {
  getEmployeeClsAndOds,
  getAllCLBalance,
  getAllODBalance,
  assignOdsToEmployees,
  getOdAndClSummary,
  getClAndOdDateOfAnyEmployee,
  addClsOrOdsToEmployees,
  removeClsOrOdsFromEmployees,
};
