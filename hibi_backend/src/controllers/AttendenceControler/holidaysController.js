const holidaySchema = require("../../models/AttendenceSchemaManagement/holidaysSchema");
const logger = require("../../utils/logger");

const {
  getISTDateAndTime,
  changeGTMtoIST,
} = require("../../utils/timeFunction");
const XLSX = require("xlsx");

// Add Holidays with array of holidays
const addHolidays = async (req, res) => {
  try {
    const { holidaysArray } = req.body;

    if (
      !holidaysArray ||
      !Array.isArray(holidaysArray) ||
      holidaysArray.length === 0
    ) {
      return res.status(400).json({ message: "Invalid holiday data" });
    }

    const allowedFields = ["name", "shortCode", "fromDate", "toDate"];
    let errors = [];
    let newHolidays = [];

    for (let index = 0; index < holidaysArray.length; index++) {
      const rowNumber = index + 1;
      const holiday = holidaysArray[index];

      // Extra fields check
      const extraFields = Object.keys(holiday).filter(
        (f) => !allowedFields.includes(f)
      );
      if (extraFields.length > 0) {
        errors.push(
          `Holiday ${rowNumber}: Unwanted fields found -> ${extraFields.join(
            ", "
          )}`
        );
        continue;
      }

      const { name, shortCode, fromDate, toDate } = holiday;

      if (!name || !shortCode || !fromDate || !toDate) {
        errors.push(`Holiday ${rowNumber}: All fields are required`);
        continue;
      }

      const parsedFromDate = new Date(fromDate);
      const parsedToDate = new Date(toDate);

      if (isNaN(parsedFromDate) || isNaN(parsedToDate)) {
        errors.push(`Holiday ${rowNumber}: Invalid date format`);
        continue;
      }

      if (parsedFromDate > parsedToDate) {
        errors.push(
          `Holiday ${rowNumber}: fromDate cannot be greater than toDate`
        );
        continue;
      }

      const fromDateStart = new Date(parsedFromDate);
      fromDateStart.setUTCHours(0, 0, 0, 0);
      const toDateEnd = new Date(parsedToDate);
      toDateEnd.setUTCHours(23, 59, 59, 999);

      // // Consider year when checking name uniqueness
      // const year = fromDateStart.getUTCFullYear();
      // const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      // const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      // const existingByName = await holidaySchema.findOne({
      //   orgId: req?.user?.orgId,
      //   name: name.trim().toUpperCase(),
      //   $or: [
      //     { fromDate: { $gte: yearStart, $lte: yearEnd } },
      //     { toDate: { $gte: yearStart, $lte: yearEnd } },
      //     { fromDate: { $lte: yearStart }, toDate: { $gte: yearEnd } },
      //   ],
      // });

      // if (existingByName) {
      //   return res.status(400).json({ message: "Holiday name already exists" });
      // }

      const existingByDate = await holidaySchema.findOne({
        orgId: req?.user?.orgId,
        fromDate: { $lte: toDateEnd },
        toDate: { $gte: fromDateStart },
      });

      if (existingByDate) {
        return res
          .status(400)
          .json({ message: "Holiday dates overlap with an existing holiday" });
      }

      newHolidays.push(
        new holidaySchema({
          orgId: req?.user?.orgId,
          name: name.trim().toUpperCase(),
          shortCode,
          fromDate: fromDateStart,
          toDate: toDateEnd,
          createdBy: req?.user?._id,
          createdAt: getISTDateAndTime(),
        })
      );
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    await holidaySchema.insertMany(newHolidays);

    logger.info(
      `${newHolidays.length} holidays added by user ${req.user.firstName} ${req.user.lastName}`
    );
    res.status(201).json({ message: "Holidays added successfully" });
  } catch (error) {
    console.error("Error adding holidays:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload Holidays from Excel
// const uploadHolidays = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const fileName = req.file.originalname.toLowerCase();
//     if (
//       !(
//         fileName.endsWith(".xlsx") ||
//         fileName.endsWith(".xls") ||
//         fileName.endsWith(".csv")
//       )
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Only Excel/CSV files are allowed" });
//     }

//     const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     if (!data || data.length === 0) {
//       return res.status(400).json({ message: "File is empty" });
//     }

//     let errors = [];
//     let validHolidays = [];

//     for (let index = 0; index < data.length; index++) {
//       const holiday = data[index];
//       const allowedFields = ["name", "shortCode", "fromDate", "toDate"];
//       const extraFields = Object.keys(holiday).filter(
//         (f) => !allowedFields.includes(f)
//       );
//       if (extraFields.length > 0) {
//         errors.push(
//           `Holiday ${index + 1}: Unwanted fields found -> ${extraFields.join(
//             ", "
//           )}`
//         );
//         continue;
//       }

//       const { name, shortCode, fromDate, toDate } = holiday;

//       if (!name || !shortCode || !fromDate || !toDate) {
//         errors.push(`Row ${index + 1}: Missing required fields`);
//         continue;
//       }

//       const parsedFromDate = new Date(fromDate);
//       const parsedToDate = new Date(toDate);

//       if (isNaN(parsedFromDate) || isNaN(parsedToDate)) {
//         errors.push(`Row ${index + 1}: Invalid date format`);
//         continue;
//       }

//       if (parsedFromDate > parsedToDate) {
//         errors.push(`Row ${index + 1}: FromDate cannot be greater than ToDate`);
//         continue;
//       }

//       const fromDateSatart = new Date(parsedFromDate);
//       fromDateSatart.setUTCHours(0, 0, 0, 0);
//       const toDateEnd = new Date(parsedToDate);
//       toDateEnd.setUTCHours(23, 59, 59, 999);

//       const existingHoliday = await holidaySchema.findOne({
//         orgId: req?.user?.orgId,
//         name: name.trim().toUpperCase(),
//         $or: [
//           {
//             fromDate: { $lte: toDateEnd },
//             toDate: { $gte: fromDateSatart },
//           },
//         ],
//       });

//       if (existingHoliday) {
//         errors.push(
//           `Row ${index + 1}: Duplicate holiday entry already exists in DB`
//         );
//         continue;
//       }

//       validHolidays.push({
//         orgId: req?.user?.orgId,
//         name,
//         shortCode,
//         fromDate: fromDateSatart,
//         toDate: toDateEnd,
//         createdBy: req?.user?._id,
//         createdAt: getISTDateAndTime(),
//       });
//     }
//     if (errors.length > 0) {
//       return res.status(400).json({ message: "Validation failed", errors });
//     }

//     await holidaySchema.insertMany(validHolidays);

//     res.status(201).json({ message: "Holidays added successfully" });
//   } catch (error) {
//     console.error("Error uploading holidays:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const uploadHolidays = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = req.file.originalname.toLowerCase();
    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls") &&
      !fileName.endsWith(".csv")
    ) {
      return res
        .status(400)
        .json({ message: "Only Excel/CSV files are allowed" });
    }

    // Read Excel with proper date parsing
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
      dateNF: "yyyy-mm-dd",
    });

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "File is empty" });
    }

    let errors = [];
    let validHolidays = [];

    for (let index = 0; index < data.length; index++) {
      const holidayRaw = data[index];

      // Normalize keys: remove spaces, lowercase
      const holiday = {};
      for (const key in holidayRaw) {
        holiday[key.trim().replace(/\s+/g, "").toLowerCase()] = holidayRaw[key];
      }

      const { name, shortcode, fromdate, todate } = holiday;

      if (!name || !shortcode || !fromdate || !todate) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        continue;
      }

      const fromDateStart = changeGTMtoIST(new Date(fromdate));
      fromDateStart.setUTCHours(0, 0, 0, 0);
      const toDateEnd = changeGTMtoIST(new Date(todate));
      toDateEnd.setUTCHours(23, 59, 59, 999);

      if (isNaN(fromDateStart) || isNaN(toDateEnd)) {
        errors.push(`Row ${index + 1}: Invalid date format`);
        continue;
      }

      if (fromDateStart > toDateEnd) {
        errors.push(`Row ${index + 1}: FromDate cannot be greater than ToDate`);
        continue;
      }

      // 1️⃣ Check name uniqueness
      const existingByName = await holidaySchema.findOne({
        orgId: req?.user?.orgId,
        name: name.trim().toUpperCase(),
      });
      if (existingByName) {
        errors.push(`Row ${index + 1}: Holiday name already exists`);
        continue;
      }

      // 2️⃣ Check date overlap
      const existingByDate = await holidaySchema.findOne({
        orgId: req?.user?.orgId,
        fromDate: { $lte: toDateEnd },
        toDate: { $gte: fromDateStart },
      });
      if (existingByDate) {
        errors.push(
          `Row ${index + 1}: Holiday dates overlap with an existing holiday`
        );
        continue;
      }

      validHolidays.push({
        orgId: req?.user?.orgId,
        name: name.trim().toUpperCase(),
        shortCode: shortcode,
        fromDate: fromDateStart,
        toDate: toDateEnd,
        createdBy: req?.user?._id,
        createdAt: getISTDateAndTime(),
      });
    }

    if (validHolidays.length > 0) {
      await holidaySchema.insertMany(validHolidays);
    }

    logger.info(
      `${validHolidays.length} holidays uploaded by user ${req.user.firstName} ${req.user.lastName}`
    );
    return res.status(errors.length > 0 ? 207 : 201).json({
      message:
        errors.length > 0
          ? "Holidays added with some errors"
          : "Holidays added successfully",
      inserted: validHolidays.length,
      errors,
    });
  } catch (error) {
    console.error("Error uploading holidays:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Holiday
const updateHoliday = async (req, res) => {
  try {
    const { holidayId, name, shortCode, fromDate, toDate } = req.body;
    const employeeId = req?.user?.employeeId;

    if (!holidayId) {
      return res.status(400).json({ message: "Holiday ID is required" });
    }

    const holiday = await holidaySchema.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    const updatedName = name ? name.trim() : holiday.name;
    const updatedShortCode = shortCode ? shortCode.trim() : holiday.shortCode;

    let updatedFromDate = holiday.fromDate;
    let updatedToDate = holiday.toDate;

    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (isNaN(parsedFromDate)) {
        return res.status(400).json({ message: "Invalid fromDate format" });
      }
      parsedFromDate.setUTCHours(0, 0, 0, 0);
      updatedFromDate = parsedFromDate;
    }

    if (toDate) {
      const parsedToDate = new Date(toDate);
      if (isNaN(parsedToDate)) {
        return res.status(400).json({ message: "Invalid toDate format" });
      }
      parsedToDate.setUTCHours(23, 59, 59, 999);
      updatedToDate = parsedToDate;
    }

    if (updatedFromDate > updatedToDate) {
      return res
        .status(400)
        .json({ message: "fromDate cannot be greater than toDate" });
    }

    const existingByName = await holidaySchema.findOne({
      orgId: req?.user?.orgId,
      name: updatedName.toUpperCase(),
      _id: { $ne: holidayId },
    });
    if (existingByName) {
      return res.status(400).json({ message: "Holiday name already exists" });
    }

    const existingByDate = await holidaySchema.findOne({
      orgId: req?.user?.orgId,
      _id: { $ne: holidayId },
      fromDate: { $lte: updatedToDate },
      toDate: { $gte: updatedFromDate },
    });
    if (existingByDate) {
      return res
        .status(400)
        .json({ message: "Holiday dates overlap with an existing holiday" });
    }

    holiday.name = updatedName.toUpperCase();
    holiday.shortCode = updatedShortCode;
    holiday.fromDate = updatedFromDate;
    holiday.toDate = updatedToDate;
    holiday.updatedBy = employeeId;
    holiday.updatedAt = getISTDateAndTime();

    await holiday.save();

    logger.info(
      `Holiday '${holiday.name}' updated by user ${req.user.firstName} ${req.user.lastName}`
    );
    res.status(200).json({ message: "Holiday updated successfully" });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Holidays
const getHolidays = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);
    const holidays = await holidaySchema.aggregate([
      {
        $match: {
          orgId: req?.user?.orgId,
          fromDate: { $gte: fromDateStart },
          toDate: { $lte: toDateEnd },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          shortCode: 1,
          fromDate: 1,
          toDate: 1,
        },
      },
    ]);
    res
      .status(200)
      .json({ message: "Holidays fetched successfully", data: holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Holiday Template
const getHolidayTemplate = async (req, res) => {
  try {
    const holidayHeader = ["Name", "Short Code", "From Date", "To Date"];

    const exampleRow = {
      Name: "New Year",
      "Short Code": "PH",
      "From Date": "2023-01-01",
      "To Date": "2023-01-01",
    };

    const worksheet = XLSX.utils.json_to_sheet([exampleRow], {
      header: holidayHeader,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HolidaysTemplate");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=holiday_template.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error generating holiday template:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Holiday
const deleteHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    if (!holidayId) {
      return res.status(400).json({ message: "Holiday ID is required" });
    }

    const holiday = await holidaySchema.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    if (holiday.orgId.toString() !== req?.user?.orgId?.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this holiday" });
    }

    if (holiday.fromDate <= getISTDateAndTime()) {
      return res.status(400).json({
        message: "Cannot delete holidays that have started or passed",
      });
    }

    await holidaySchema.findByIdAndDelete(holidayId);

    logger.info(
      `Holiday '${holiday.name}' deleted by user ${req.user.firstName} ${req.user.lastName}`
    );
    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addHolidays,
  uploadHolidays,
  updateHoliday,
  getHolidays,
  getHolidayTemplate,
  deleteHoliday,
};
