const dailyWorkReportSchema = require('../../models/AttendenceSchemaManagement/dailyWorkReportSchema');
const logger = require("../../utils/logger");

const { getISTDateAndTime } = require("../../utils/timeFunction");

// Function to add work report
const addWorkReport = async (req, res) => {
    try {
        //! if employee has attended that day, then only he can add work report, else he can't
        const employeeId = req?.user?._id;
        const { from, to, work } = req.body;

        const currentDate = getISTDateAndTime().toISOString().split('T')[0];
        // Convert 'from' and 'to' to ISO Date objects using current date
        const fromTime = new Date(`${currentDate}T${from}:00.000Z`);
        const toTime = new Date(`${currentDate}T${to}:00.000Z`);

        // Find if a report already exists for this employee and date
        let report = await dailyWorkReportSchema.findOne({ employeeId, date: currentDate });

        if (report) {
            // If report exists, push new work entry
            report.workReports.push({ from: fromTime, to: toTime, work });
            report.updatedBy = employeeId;
            report.updatedAt = getISTDateAndTime();
            await report.save();
        } else {
            // If not, create a new report
            report = new dailyWorkReportSchema({
                employeeId,
                date: currentDate,
                workReports: [{ from: fromTime, to: toTime, work }],
                createdBy: employeeId,
                updatedBy: employeeId,
            });
            await report.save();
        }

        logger.info(`Work report for date '${currentDate}' added by user ${req.user.firstName} ${req.user.lastName}`);
        return res.status(200).json({ message: "Work report added successfully" });
    } catch (error) {
        console.error("Error in addWorkReport:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


// Function to get the work reports
const getTodayWorkReports = async (req, res) => {
    try {
        const employeeId = req?.user?._id;
        const currentDate = getISTDateAndTime().toISOString().split('T')[0];

        // Find the report for the current date
        const report = await dailyWorkReportSchema.findOne({ employeeId, date: currentDate });

        if (report) {
            return res.status(200).json({ workReports: report.workReports });
        } else {
            return res.status(404).json({ message: "No work report found for today" });
        }
    } catch (error) {
        console.error("Error in getWorkReports:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    addWorkReport,  // add work report

    getTodayWorkReports, // get today's work reports
};