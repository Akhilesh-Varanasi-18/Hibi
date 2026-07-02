/**
 * frsAttendanceCron.js
 *
 * Cron job that polls frs.toriiminds.com (eTimeTrackLite SOAP API)
 * every minute and syncs TORII face scanner attendance into Hibi's
 * AttendancePunches collection.
 *
 * The existing processAttendencePunches cron then converts these
 * raw punches into DailyAttendance records (in/out time, status, etc.)
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const { getTodaysPunchesFromRestAPI, getPunchesFromRestAPI } = require('./frsService');
const AttendancePunches = require('../models/AttendenceSchemaManagement/attendencePunchesSchema');
const DailyAttendance = require('../models/AttendenceSchemaManagement/dailyAttendenceSchema');
const AttendenceStatusTypes = require('../models/AttendenceSchemaManagement/attendenceStatusTypesSchema');
const Employee = require('../models/EmployeeSchemaManagement/employeeSchema');
const Shift = require('../models/EmployeeSchemaManagement/shiftSchema');

let isRunning = false; // Prevent overlapping cron runs

// Lazy-load to avoid circular dependency at startup
function getPunchProcessor() {
    try {
        const ctrl = require('../controllers/AttendenceControler/attendencePunchesController');
        return ctrl.attendencePunchProcessor || null;
    } catch (err) {
        console.error('[frsCron] Could not load attendencePunchProcessor:', err.message);
        return null;
    }
}

function getDateStringsInRange(fromDate, toDate) {
    const dates = [];
    const start = new Date(`${fromDate}T00:00:00.000Z`);
    const end = new Date(`${toDate}T00:00:00.000Z`);

    for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
}

async function saveFRSPunches(punches) {
    let newCount = 0;
    let skipCount = 0;
    let employeeMissingCount = 0;

    for (const punch of punches) {
        try {
            const employee = await Employee.findOne({ employeeCode: punch.employeeCode })
                .select('_id employeeCode orgId')
                .lean();

            if (!employee) {
                employeeMissingCount++;
                continue;
            }

            const sourceId = `FRS-${punch.employeeCode}-${punch.punchTime.getTime()}`;
            const existing = await AttendancePunches.findOne({ sourceId }).lean();
            if (existing) {
                skipCount++;
                continue;
            }

            await AttendancePunches.create({
                employeeId: employee._id,
                employeeCode: punch.employeeCode,
                punchTime: punch.punchTime,
                source: 'FRS_DEVICE',
                sourceId,
            });

            newCount++;
        } catch (err) {
            console.error(`[frsCron] Error saving punch for ${punch.employeeCode}:`, err.message);
        }
    }

    return { newCount, skipCount, employeeMissingCount };
}

async function getOrgIdsFromFRSPunches(dateStr, orgIdFilter) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const dayPunches = await AttendancePunches.find({
        punchTime: { $gte: startOfDay, $lte: endOfDay },
        source: 'FRS_DEVICE',
    }).select('employeeId').lean();

    const employeeIds = [
        ...new Set(dayPunches.map((p) => p.employeeId?.toString()).filter(Boolean)),
    ];

    const employeeQuery = { _id: { $in: employeeIds } };
    if (orgIdFilter) {
        employeeQuery.orgId = new mongoose.Types.ObjectId(orgIdFilter);
    }

    const punchEmployees = await Employee.find(employeeQuery).select('orgId').lean();
    return [...new Set(punchEmployees.map((employee) => employee.orgId?.toString()).filter(Boolean))];
}

async function runAttendanceFinalizer(orgId, dateStr) {
    const processor = getPunchProcessor();
    if (!processor) {
        return { processed: false, message: 'Attendance processor unavailable' };
    }

    const mockReq = {
        body: { fromDate: dateStr, toDate: dateStr },
        user: { orgId },
    };
    const mockRes = {
        status: (code) => ({
            json: (data) => console.log(`[frsCron] Org ${orgId} status ${code}:`, data.message || data.error || ''),
        }),
    };

    await processor(mockReq, mockRes);
    return { processed: true };
}

async function upsertDailyAttendanceFromFRSPunches(orgId, dateStr) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    const punches = await AttendancePunches.find({
        punchTime: { $gte: startOfDay, $lte: endOfDay },
        source: 'FRS_DEVICE',
    }).sort({ employeeId: 1, punchTime: 1 }).lean();

    const punchedEmployeeIds = [
        ...new Set(punches.map((punch) => punch.employeeId?.toString()).filter(Boolean)),
    ];

    if (punchedEmployeeIds.length === 0) {
        console.error(`[frsCron] No employeeIds found on today's FRS punches for org ${orgId}`);
        return { created: 0, updated: 0, skipped: punches.length };
    }

    const employees = await Employee.find({
        _id: { $in: punchedEmployeeIds },
        orgId: orgObjectId,
    }).select('_id orgId shiftId employeeCode').lean();

    const fallbackShift = await Shift.findOne({ orgId: orgObjectId })
        .select('_id name')
        .lean();

    if (!employees.length) {
        console.error(`[frsCron] No employees matched ${punchedEmployeeIds.length} punched employeeIds for org ${orgId}`);
        return { created: 0, updated: 0, skipped: punches.length };
    }

    if (!fallbackShift) {
        console.warn(`[frsCron] No fallback shift found for org ${orgId}; employees without shiftId will be skipped`);
    }

    const employeeById = new Map(employees.map((employee) => [employee._id.toString(), employee]));

    const [presentStatus, secondHalfStatus] = await Promise.all([
        AttendenceStatusTypes.findOne({ orgId: orgObjectId, shortName: 'P' }).select('_id').lean(),
        AttendenceStatusTypes.findOne({ orgId: orgObjectId, shortName: 'SH' }).select('_id').lean(),
    ]);

    const defaultStatusId = presentStatus?._id || secondHalfStatus?._id;
    if (!defaultStatusId) {
        console.error(`[frsCron] Cannot create daily attendance: P/SH status not found for org ${orgId}`);
        return { created: 0, updated: 0, skipped: punches.length };
    }

    const punchesByEmployee = new Map();
    for (const punch of punches) {
        const key = punch.employeeId?.toString();
        if (!key) continue;
        if (!punchesByEmployee.has(key)) punchesByEmployee.set(key, []);
        punchesByEmployee.get(key).push(punch);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [employeeId, employeePunches] of punchesByEmployee.entries()) {
        const employee = employeeById.get(employeeId);
        if (!employee || employeePunches.length === 0) {
            skipped++;
            continue;
        }

        const shiftId = employee.shiftId || fallbackShift?._id;
        if (!shiftId) {
            console.warn(`[frsCron] Employee ${employee.employeeCode || employeeId} has no shiftId and no fallback shift; skipping`);
            skipped++;
            continue;
        }

        if (!employee.shiftId && fallbackShift) {
            console.warn(`[frsCron] Employee ${employee.employeeCode || employeeId} has no shiftId; using fallback shift ${fallbackShift.name || fallbackShift._id}`);
        }

        const firstPunch = employeePunches[0].punchTime;
        const lastPunchCandidate = employeePunches[employeePunches.length - 1].punchTime;
        const logOutTime =
            lastPunchCandidate.getTime() - firstPunch.getTime() >= 60 * 1000
                ? lastPunchCandidate
                : null;

        const existingAttendance = await DailyAttendance.findOne({
            orgId,
            employeeId,
            $or: [
                { logInTime: { $gte: startOfDay, $lte: endOfDay } },
                { logOutTime: { $gte: startOfDay, $lte: endOfDay } },
            ],
        });

        if (existingAttendance) {
            let changed = false;
            if (!existingAttendance.logInTime || firstPunch < existingAttendance.logInTime) {
                existingAttendance.logInTime = firstPunch;
                changed = true;
            }
            if (logOutTime && (!existingAttendance.logOutTime || logOutTime > existingAttendance.logOutTime)) {
                existingAttendance.logOutTime = logOutTime;
                changed = true;
            }
            if (changed) {
                existingAttendance.statusId = logOutTime ? presentStatus?._id || defaultStatusId : existingAttendance.statusId || defaultStatusId;
                existingAttendance.updatedAt = new Date();
                await existingAttendance.save();
                updated++;
            }
            continue;
        }

        await DailyAttendance.create({
            orgId,
            employeeId,
            shiftId,
            logInTime: firstPunch,
            logOutTime,
            statusId: logOutTime ? presentStatus?._id || defaultStatusId : defaultStatusId,
        });
        created++;
    }

    return { created, updated, skipped };
}

async function backfillFRSAttendance(fromDate, toDate, orgIdFilter) {
    const rangeStart = new Date(`${fromDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${toDate}T23:59:59.999Z`);
    const punches = await getPunchesFromRestAPI(rangeStart, rangeEnd);
    const saveResult = await saveFRSPunches(punches);
    const dateResults = [];

    for (const dateStr of getDateStringsInRange(fromDate, toDate)) {
        const orgIds = await getOrgIdsFromFRSPunches(dateStr, orgIdFilter);
        const orgResults = [];

        for (const orgId of orgIds) {
            const dailyResult = await upsertDailyAttendanceFromFRSPunches(orgId, dateStr);
            await runAttendanceFinalizer(orgId, dateStr);
            orgResults.push({
                orgId,
                dailyAttendance: dailyResult,
            });
        }

        dateResults.push({
            date: dateStr,
            orgsProcessed: orgResults.length,
            orgResults,
        });
    }

    return {
        fromDate,
        toDate,
        punchesFetched: punches.length,
        punchesSaved: saveResult,
        dates: dateResults,
    };
}

/**
 * Sync FRS punches to Hibi AttendancePunches collection
 */
async function syncFRSAttendance() {
    if (isRunning) {
        console.log('[frsCron] Previous sync still running, skipping...');
        return;
    }
    isRunning = true;

    try {
        console.log('[frsCron] Starting FRS attendance sync...');
        const punches = await getTodaysPunchesFromRestAPI();

        if (!punches || punches.length === 0) {
            console.log('[frsCron] No punches fetched from FRS');
            isRunning = false;
            return;
        }

        let newCount = 0;
        let skipCount = 0;

        for (const punch of punches) {
            try {
                // 1. Find the Hibi employee by employeeCode
                const employee = await Employee.findOne({ employeeCode: punch.employeeCode })
                    .select('_id employeeCode orgId')
                    .lean();

                if (!employee) {
                    // This employee code is not in Hibi — skip silently
                    continue;
                }

                // 2. Use punchTime as the unique source ID (emp + time)
                const sourceId = `FRS-${punch.employeeCode}-${punch.punchTime.getTime()}`;

                // 3. Check for duplicate (same sourceId = same punch already saved)
                const existing = await AttendancePunches.findOne({ sourceId }).lean();
                if (existing) {
                    skipCount++;
                    continue;
                }

                // 4. Save new punch
                await AttendancePunches.create({
                    employeeId: employee._id,
                    employeeCode: punch.employeeCode,
                    punchTime: punch.punchTime,
                    source: 'FRS_DEVICE',
                    sourceId: sourceId,
                });

                newCount++;
            } catch (err) {
                console.error(`[frsCron] Error saving punch for ${punch.employeeCode}:`, err.message);
            }
        }

        console.log(`[frsCron] Sync done — New: ${newCount}, Skipped (duplicate): ${skipCount}, Total fetched: ${punches.length}`);

        // If punches exist, ensure daily attendance is built and finalized.
        if (newCount > 0 || skipCount > 0) {
            console.log('[frsCron] FRS punches available — building daily attendance...');
            const processor = getPunchProcessor();
            if (processor) {
                try {
                    // Collect unique orgIds from today's FRS punches via their employees
                    const todayStr = new Date().toISOString().split('T')[0];
                    const startOfToday = new Date(todayStr + 'T00:00:00.000Z');
                    const endOfToday = new Date(todayStr + 'T23:59:59.999Z');

                    const todayPunches = await AttendancePunches.find({
                        punchTime: { $gte: startOfToday, $lte: endOfToday },
                        source: 'FRS_DEVICE',
                    }).select('employeeId').lean();

                    const employeeIds = [
                        ...new Set(todayPunches.map((p) => p.employeeId?.toString()).filter(Boolean)),
                    ];
                    const punchEmployees = await Employee.find({ _id: { $in: employeeIds } })
                        .select('orgId')
                        .lean();

                    const orgIdSet = new Set();
                    for (const employee of punchEmployees) {
                        if (employee.orgId) {
                            orgIdSet.add(employee.orgId.toString());
                        }
                    }

                    if (orgIdSet.size === 0) {
                        console.error('[frsCron] Cannot process: No orgIds found from today\'s punches');
                        return;
                    }

                    console.log(`[frsCron] Processing attendance for ${orgIdSet.size} org(s):`, [...orgIdSet]);

                    // Run the processor once per org so each org's shifts/statuses are used correctly
                    for (const orgId of orgIdSet) {
                        try {
                            const dailyResult = await upsertDailyAttendanceFromFRSPunches(orgId, todayStr);
                            console.log(
                                `[frsCron] Daily attendance upsert for org ${orgId} — Created: ${dailyResult.created}, Updated: ${dailyResult.updated}, Skipped: ${dailyResult.skipped}`
                            );

                            const mockReq = {
                                body: { fromDate: todayStr, toDate: todayStr },
                                user: { orgId }
                            };
                            const mockRes = {
                                status: (code) => ({
                                    json: (data) => console.log(`[frsCron] Org ${orgId} status ${code}:`, data.message || data.error || '')
                                })
                            };
                            await processor(mockReq, mockRes);
                            console.log(`[frsCron] Processing done for org ${orgId}`);
                        } catch (procErr) {
                            console.error(`[frsCron] Processing error for org ${orgId}:`, procErr.message);
                        }
                    }
                } catch (procErr) {
                    console.error('[frsCron] Attendance processing error:', procErr.message);
                }
            }
        }
    } catch (err) {
        console.error('[frsCron] Sync failed:', err.message);
    } finally {
        isRunning = false;
    }
}

/**
 * Start the FRS cron — runs every minute
 */
function startFRSCron() {
    console.log('[frsCron] FRS attendance sync cron started (every minute)');

    // Run immediately on startup
    syncFRSAttendance();

    // Then run every minute
    cron.schedule('* * * * *', () => {
        syncFRSAttendance();
    });
}

module.exports = {
    startFRSCron,
    syncFRSAttendance,
    backfillFRSAttendance,
    upsertDailyAttendanceFromFRSPunches,
};
