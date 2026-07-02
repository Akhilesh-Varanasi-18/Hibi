const paySlipSchema = require("../models/paySlipSchema");
const Employee = require("../models/EmployeeSchemaManagement/employeeSchema");
const { uploadToS3 } = require("../utils/s3Upload");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const employeeSchema = require("../models/EmployeeSchemaManagement/employeeSchema");
const logger = require("../utils/logger");

// Upload Pay Slip by CSV/Excel
const uploadPaySlipsData = async (req, res) => {
  try {
    const orgId = req?.user?.orgId;
    const userId = req?.user?._id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message:
          "No file uploaded. Please attach a CSV/XLSX file in form-data with field name 'excelFile' or similar.",
      });
    }

    // Parse the uploaded file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file is empty or contains only headers.",
      });
    }

    const errors = [];
    const processed = [];

    const excelDuplicateMap = new Map();
    const excelDuplicates = [];

    const employeeCodes = new Set();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowIndex = i + 2;

      const employeeCode =
        row.employeeCode || row.EmployeeCode || row.employeecode || null;
      const month = row.month || Number(row.Month) || null;
      const year = row.year || Number(row.Year) || null;

      function toNumber(val) {
        if (val === null || val === undefined || val === "") return 0;
        const n = Number(String(val).replace(/,/g, "").trim());
        return Number.isNaN(n) ? null : n;
      }

      const totalEarnings = toNumber(
        row.totalEarnings ||
          row.totalEarning ||
          row.total_earnings ||
          row.TotalEarnings
      );
      const totalDeductions = toNumber(
        row.totalDeductions ||
          row.totalDeduction ||
          row.total_deductions ||
          row.TotalDeductions
      );
      const netSalary = toNumber(
        row.netSalary || row.net_salary || row.NetSalary
      );

      let rowError = "";
      if (!employeeCode)
        rowError +=
          "Missing employee identifier (employeeCode or personalEmail). ";
      if (!month || month < 1 || month > 12)
        rowError += `Invalid month: ${month}. `;
      if (!year) rowError += `Invalid year: ${year}. `;
      if (totalEarnings === null)
        rowError += `Invalid totalEarnings: ${row.totalEarnings}. `;
      if (totalDeductions === null)
        rowError += `Invalid totalDeductions: ${row.totalDeductions}. `;
      if (netSalary === null)
        rowError += `Invalid netSalary: ${row.netSalary}. `;

      if (rowError) {
        errors.push({ row: rowIndex, error: rowError, data: row });
        continue;
      }

      if (employeeCode && month && year) {
        const key = `${String(employeeCode)
          .trim()
          .toUpperCase()}_${month}_${year}`;
        if (excelDuplicateMap.has(key)) {
          excelDuplicates.push({
            row: rowIndex,
            duplicateWith: excelDuplicateMap.get(key),
            employeeCode: String(employeeCode).trim().toUpperCase(),
            month,
            year,
          });
          continue;
        } else {
          excelDuplicateMap.set(key, rowIndex);
        }
      }

      const employeeData = await employeeSchema
        .findOne({
          orgId,
          employeeCode: String(employeeCode).trim().toUpperCase(),
        })
        .select("_id");
      if (!employeeData) {
        errors.push({
          row: rowIndex,
          error: "Employee not found in organization with provided identifier",
          data: row,
        });
        continue;
      }

      const normalized = {
        // _raw: row,
        employeeCode: employeeCode
          ? String(employeeCode).trim().toUpperCase()
          : null,
        month: Number(month),
        year: Number(year),
        totalEarnings,
        totalDeductions,
        netSalary,
        basicSalary: toNumber(
          row.basicSalary || row.basic_salary || row.BasicSalary
        ),
        da: toNumber(row.da || row.DA),
        houseRentAllowance: toNumber(
          row.houseRentAllowance || row.hra || row.HRA
        ),
        earningsOthers: toNumber(row.earningsOthers || row.earnings_other),
        lossOfPay: toNumber(row.lossOfPay || row.loss_of_pay),
        professionalTax: toNumber(row.professionalTax || row.professional_tax),
        epf: toNumber(row.epf),
        groupInsurance: toNumber(row.groupInsurance),
        canteen: toNumber(row.canteen),
        advance: toNumber(row.advance),
        tds: toNumber(row.tds),
        contribution: toNumber(row.contribution),
        esi: toNumber(row.esi),
        others: toNumber(row.others),
      };

      if (normalized.employeeCode) employeeCodes.add(normalized.employeeCode);

      processed.push(normalized);
    }

    // If there are Excel duplicates, return error
    if (excelDuplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "File contains duplicate entries for same employee, month and year",
        duplicates: excelDuplicates,
      });
    }

    console.log("This is Excel Duplicates", excelDuplicates);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "File contains invalid rows",
        errors,
        preview: processed.slice(0, 5),
      });
    }

    const query = { orgId };
    const orConditions = [];
    if (employeeCodes.size > 0)
      orConditions.push({ employeeCode: { $in: Array.from(employeeCodes) } });
    if (orConditions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid employee identifiers found after preprocessing.",
      });
    }

    query.$or = orConditions;

    const employees = await employeeSchema
      .find(query)
      .select("employeeCode _id");
    const empByCode = {};
    employees.forEach((e) => {
      if (e.employeeCode)
        empByCode[String(e.employeeCode).toUpperCase()] = e._id;
    });

    const notFound = [];
    // Prepare paySlip documents and check for monthly duplicates
    const paySlipDocs = [];
    const duplicateChecks = [];

    for (const row of processed) {
      const empId = (row.employeeCode && empByCode[row.employeeCode]) || null;
      if (!empId) {
        notFound.push({
          data: row._raw,
          error: "Employee not found in organization with provided identifier",
        });
        continue;
      }

      // Check duplicate for same employeeId, month and year
      duplicateChecks.push({
        employeeId: empId,
        month: row.month,
        year: row.year,
      });

      paySlipDocs.push({
        orgId: new mongoose.Types.ObjectId(orgId),
        employeeId: empId,
        basicSalary: row.basicSalary || 0,
        da: row.da || 0,
        houseRentAllowance: row.houseRentAllowance || 0,
        earningsOthers: row.earningsOthers || 0,
        lossOfPay: row.lossOfPay || 0,
        professionalTax: row.professionalTax || 0,
        epf: row.epf || 0,
        groupInsurance: row.groupInsurance || 0,
        canteen: row.canteen || 0,
        advance: row.advance || 0,
        tds: row.tds || 0,
        contribution: row.contribution || 0,
        esi: row.esi || 0,
        others: row.others || 0,
        totalEarnings: row.totalEarnings,
        totalDeductions: row.totalDeductions,
        netSalary: row.netSalary,
        month: row.month,
        year: row.year,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    if (notFound.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some employees were not found in organization",
        notFound,
        preview: paySlipDocs.slice(0, 5),
      });
    }

    // Check for existing payslips for same employee+month+year
    const duplicatesQuery = duplicateChecks.map((c) => ({
      employeeId: c.employeeId,
      month: c.month,
      year: c.year,
    }));
    const existing = await paySlipSchema
      .find({ $or: duplicatesQuery })
      .select("employeeId month year");
    if (existing.length > 0) {
      const dupList = await Promise.all(
        existing.map(async (d) => ({
          employeeId: await Employee.findById(d.employeeId, {
            employeeCode: 1,
            firstName: 1,
            lastName: 1,
          }),
          month: d.month,
          year: d.year,
        }))
      );
      return res.status(400).json({
        success: false,
        message:
          "Payslip(s) already exist for some employee(s) for the given month/year",
        duplicates: dupList,
      });
    }

    // Upload original file to S3
    let fileUrl = null;
    try {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname || `payslips_${Date.now()}.xlsx`,
        req.file.mimetype || "application/octet-stream",
        "payslip-uploads"
      );
      fileUrl = uploadResult.fileUrl;
    } catch (uploadErr) {
      console.warn(
        "Warning: failed to upload payslip file to S3, continuing with DB insert:",
        uploadErr.message || uploadErr
      );
    }

    // Bulk insert
    const inserted = await paySlipSchema.insertMany(paySlipDocs, {
      ordered: false,
    });

    logger.info(`${inserted.length} pay slips inserted by user ${req.user.firstName} ${req.user.lastName}`);
    res.json({
      success: true,
      message: `Inserted ${inserted.length} pay slips`,
      insertedCount: inserted.length,
      fileUrl,
    });
  } catch (error) {
    console.error("Error uploading pay slips data:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get payslip(s) for the authenticated employee.
 * Accepts either:
 * - single object: { month: Number, year: Number }
 * - array body: [{ month: Number, year: Number }, ...]
 * - or { periods: [...] }
 *
 * Returns: { success: true, employee: {...}, results: [{ month, year, paySlip|null }, ...] }
 */
const getPaySlipData = async (req, res) => {
  try {
    const { periodList } = req.body;
    const employeeId = req?.user?._id;

    if (!periodList || periodList.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters. Provide an array of {month,year} or month & year.",
      });
    }

    const invalid = periodList.filter(
      (p) => !p || typeof p.month !== "number" || typeof p.year !== "number"
    );
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "One or more periods are invalid. Each item must have numeric month and year.",
        invalid,
      });
    }

    const employeeAgg = await employeeSchema.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(employeeId) } },
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
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      {
        $unwind: {
          path: "$departmentInfo",
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
        $lookup: {
          from: "organizations",
          localField: "orgId",
          foreignField: "_id",
          as: "orgInfo",
        },
      },
      {
        $unwind: {
          path: "$orgInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          employeeName: {
            $concat: ["$firstName", " ", "$lastName"],
          },
          orgName: "$orgInfo.name",
          orgAdress: "$orgInfo.address",
          orglogo: "$orgInfo.orgLogo",
          orgstamp: "$orgInfo.orgStamp",
          employeeCode: 1,
          pfNumber: 1,
          esicNumber: 1,
          designation: "$designationInfo.title",
          department: "$departmentInfo.name",
          accountNumber: "$bankDetailsInfo.accountNumber",
          bankName: "$bankDetailsInfo.bankName",
        },
      },
    ]);

    if (!employeeAgg || employeeAgg.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee data not found" });
    }

    const employeeData = employeeAgg[0];

    const orQueries = periodList.map((p) => ({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      month: p.month,
      year: p.year,
    }));

    const payslips = await paySlipSchema
      .find(
        { $or: orQueries },
        {
          __v: 0,
          orgId: 0,
          createdAt: 0,
          updatedAt: 0,
          createdBy: 0,
          updatedBy: 0,
        }
      )
      .lean();

    const payslipMap = {};
    for (const p of payslips) {
      payslipMap[`${p.month}_${p.year}`] = p;
    }

    const results = periodList.map((p) => {
      const key = `${p.month}_${p.year}`;
      return { month: p.month, year: p.year, paySlip: payslipMap[key] || null };
    });

    return res.json({ success: true, employee: employeeData, results });
  } catch (error) {
    console.error("Error fetching pay slip data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getPaySlipTemplate = async (req, res) => {
  try {
    const template = [
      {
        employeeCode: "0000",
        basicSalary: 50000,
        da: 10000,
        houseRentAllowance: 15000,
        earningsOthers: 5000,
        lossOfPay: 0,
        professionalTax: 200,
        epf: 1800,
        groupInsurance: 250,
        canteen: 300,
        advance: 0,
        tds: 1500,
        contribution: 0,
        esi: 0,
        others: 0,
        totalEarnings: 80000,
        totalDeductions: 3850,
        netSalary: 76150,
        month: 1,
        year: 2024,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PaySlipTemplate");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=payslip_template.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating pay slip template:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  uploadPaySlipsData,
  getPaySlipData,
  getPaySlipTemplate,
};
