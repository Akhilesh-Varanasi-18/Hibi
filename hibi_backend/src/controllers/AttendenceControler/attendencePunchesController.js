const attendancePunchesSchema = require("../../models/AttendenceSchemaManagement/attendencePunchesSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const dailyAttendanceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const attendenceStatusTypesSchema = require("../../models/AttendenceSchemaManagement/attendenceStatusTypesSchema");
const permissionRequestSchema = require("../../models/PermissionSchemaManagement/permissionRequestSchema");
const dailyAttendenceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");
const rolesSchema = require("../../models/EmployeeSchemaManagement/rolesSchema");
const organizationSchema = require("../../models/organizationSchema");
const statusTypesSchema = require("../../models/statusSchema");
const teamSchema = require("../../models/teamSchema");
const workFromHomeSchema = require("../../models/PermissionSchemaManagement/workFromHomeSchema");
const logger = require("../../utils/logger");
const { getHolidays } = require("./attendenceReportController");
const { getSundays } = require("./attendenceReportController");

const { getISTDateAndTime } = require("../../utils/timeFunction");
const { default: axios, all } = require("axios");
const cron = require("node-cron");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

process.env.TZ = "Asia/Kolkata";

const https = require("https");
const firebaseMessageingTockenSchema = require("../../models/firebaseMessageingTockenSchema");
const {
  sendNotificationtoTokens,
} = require("../FirebaseNotifications/firebaseMessageingTockenController");
const {
  getNotificationToken,
} = require("../LeaveContollerManagement/leaveRequestController");
const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const holidaysSchema = require("../../models/AttendenceSchemaManagement/holidaysSchema");
const statusSchema = require("../../models/statusSchema");
const { backfillFRSAttendance } = require("../../utils/frsAttendanceCron");

const agent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
});

const changeGTMtoIST = (date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const res = new Date(date.getTime() + istOffset);
  return res;
};

const addAttendancePunchsToDB = async (attendanceObject) => {
  try {
    const { employeeCode, punchTime, sourceId } = attendanceObject;

    const attendancePunches = new attendancePunchesSchema({
      employeeCode,
      punchTime,
      source: "FRS Device",
      sourceId,
    });

    await attendancePunches.save();

    logger.info(
      `Attendance punch for employee '${employeeCode}' at '${punchTime}' added to DB`
    );
    return {
      success: true,
      message: "Attendance punch added successfully",
      data: attendancePunches,
    };
  } catch (error) {
    console.error("Error adding attendance punch:", error);
  }
};

// const getAttendancePunches = async () => {
//   try {
//     const { data } = await axios.get("http://node.technicalhub.io:4001/api/get-attendancelogs");

//     // Collect unique keys for fast lookup
//     const punchKeys = data.map(
//       punch =>
//         `${punch.after.EmployeeCode}_${punch.after.Serialnumber}_${changeGTMtoIST(new Date(punch.after.timestamp)).toISOString()}`
//     );

//     // Prepare query to fetch all existing punches in one go
//     const punchQueries = data.map(punch => ({
//       employeeCode: punch.after.EmployeeCode,
//       sourceId: punch.after.Serialnumber,
//       punchTime: changeGTMtoIST(new Date(punch.after.timestamp)),
//     }));

//     // Find all existing punches in a single query
//     const existingPunches = await attendancePunchesSchema.find({
//       $or: punchQueries,
//     }).lean();

//     // Create a Set of existing punch keys for fast lookup
//     const existingPunchSet = new Set(
//       existingPunches.map(
//         punch =>
//           `${punch.employeeCode}_${punch.sourceId}_${new Date(punch.punchTime).toISOString()}`
//       )
//     );

//     // Filter out punches that already exist
//     const attendanceData = data
//       .map(punch => {
//         const punchTime = changeGTMtoIST(new Date(punch.after.timestamp));
//         const key = `${punch.after.EmployeeCode}_${punch.after.Serialnumber}_${punchTime.toISOString()}`;
//         if (!existingPunchSet.has(key)) {
//           return {
//             employeeCode: punch.after.EmployeeCode,
//             punchTime,
//             source: "FRS Device",
//             sourceId: punch.after.Serialnumber,
//           };
//         }
//         return null;
//       })
//       .filter(Boolean);

//     if (attendanceData.length > 0) {
//       await attendancePunchesSchema.insertMany(attendanceData);
//     }
//   } catch (err) {
//     console.error("Error While Getting the Attendence Data from the api", err);
//   }
// };

// const getAttendancePunches = async () => {
//   try {
//     const { data } = await axios.get("http://node.technicalhub.io:4001/api/get-attendancelogs");

//     const attendanceData = (await Promise.all(
//       data.map(async (punch) => {
//         const employee = await employeeSchema.findOne({
//           employeeCode: punch.after.EmployeeCode,
//         });
//         if (!employee) return null;

//         return {
//           employeeId: employeeData._id,
//           employeeCode: punch.after.EmployeeCode,
//           punchTime: changeGTMtoIST(new Date(punch.after.timestamp)),
//           source: "FRS",
//           sourceId: punch.after.Serialnumber,
//         };
//       })
//     )).filter(Boolean);

//     for (const punch of attendanceData) {
//       const punchDate = new Date(punch.punchTime);

//       const startOfDay = new Date(punchDate);
//       startOfDay.setUTCHours(0, 0, 0, 0);

//       const endOfDay = new Date(punchDate);
//       endOfDay.setUTCHours(23, 59, 59, 999);

//       const alreadyExists = await attendencePunchesSchema.findOne({
//         employeeId: new ObjectId(punch.employeeId),
//         sourceId: punch.sourceId,
//         inTime: { $gte: startOfDay, $lte: endOfDay },
//       });

//       if (!alreadyExists) {
//         await addAttendancePunchsToDB(punch);
//       } else {
//         if (!alreadyExists.outTime || punch.punchTime > alreadyExists.outTime) {
//           alreadyExists.outTime = punch.punchTime;
//           alreadyExists.updatedAt = getISTDateAndTime();
//           await alreadyExists.save();
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching attendance punches:", error.message, error.stack);
//   }
// };

// Fetch attendance punches from the Temp device api
const getAttendancePunchesFromTempDevice = async () => {
  try {
    const { data } = await axios.get(
      "http://node.technicalhub.io:4001/api/get-attendancelogs"
    );

    for (const punch of data) {
      try {
        // if (punch.after.EmployeeCode !== "2A91A61D1") continue;

        // Calculate punchTime from API
        const punchTime = changeGTMtoIST(new Date(punch.after.timestamp));
        const date = punchTime.toISOString().split("T")[0];

        const startOfDay = new Date(date + "T00:00:00.000Z");
        const endOfDay = new Date(date + "T23:59:59.999Z");
        // console.log("this is the punch Time ", punchTime, " for the employee ", punch.after.EmployeeCode," and start ",startOfDay, " and end ", endOfDay );

        let punchTimeFromDb = null;
        const lastPunch = await attendancePunchesSchema
          .findOne({
            employeeCode: punch.after.EmployeeCode,
            sourceId: punch.after.Serialnumber,
            punchTime: { $gte: startOfDay, $lte: endOfDay },
          })
          .sort({ punchTime: -1 });

        if (lastPunch) {
          punchTimeFromDb = lastPunch.punchTime;
        }

        // Skip if this punch is within 1 minutes of the last punch for this employee/device on the same date
        if (punchTimeFromDb && punchTime - punchTimeFromDb < 1 * 60 * 1000) {
          continue;
        }
        ``;

        const employee = await employeeSchema.aggregate([
          {
            $match: {
              employeeCode: punch.after.EmployeeCode,
              // orgId: new ObjectId('68b2b6357fe4f98ee17a2101'),
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
            $unwind: "$shiftInfo",
          },
          {
            $project: {
              _id: 0,
              orgId: 1,
              shiftId: "$shiftInfo._id",
              employeeId: "$_id",
              shiftStart: "$shiftInfo.startTime",
              shiftEnd: "$shiftInfo.endTime",
              shiftBreak: "$shiftInfo.breakTime",
              shiftGracePeriod: "$shiftInfo.gracePeriodMin",
            },
          },
        ]);

        if (!employee || employee.length === 0) continue;

        const punchData = {
          punchId: punch._id,
          orgId: employee[0]?.orgId,
          employeeId: employee[0]?.employeeId,
          employeeCode: punch.after.EmployeeCode,
          punchTime: punchTime,
          source: "FRS",
          sourceId: punch.after.Serialnumber,
        };

        const alreadyExists = await attendancePunchesSchema.findOne({
          employeeCode: punchData.employeeCode,
          sourceId: punchData.sourceId,
          orgId: punchData.orgId,
          punchTime: punchData.punchTime,
        });

        if (!alreadyExists) {
          // console.log("Saving to the DB");
          await addAttendancePunchsToDB(punchData);
        }

        const employeeData = employee[0];

        if (!employeeData) {
          // console.log("No employee data found");
          return null;
        }

        // Convert grace period from minutes to milliseconds
        const gracePeriodMs = employeeData.shiftGracePeriod * 60 * 1000;

        // Create base shift times for the date
        const shiftStartBase = new Date(
          `${date}T${employeeData.shiftStart}:00.000Z`
        );
        const shiftBreakBase = new Date(
          `${date}T${employeeData.shiftBreak}:00.000Z`
        );
        const shiftEndBase = new Date(
          `${date}T${employeeData.shiftEnd}:00.000Z`
        );

        // Calculate actual shift times with grace period
        const shiftStart = new Date(shiftStartBase.getTime() - gracePeriodMs);
        const shiftBreak = new Date(shiftBreakBase.getTime()); // Break time doesn't change
        const shiftEnd = new Date(shiftEndBase.getTime() - gracePeriodMs);

        // Calculate entry and exit time windows
        const firstHalfLastTimeForEntry = new Date(
          shiftStartBase.getTime() + gracePeriodMs
        );
        const firstHalfStartTimeForExit = new Date(
          shiftBreakBase.getTime() - gracePeriodMs
        );
        const secondHalfLastTimeForEntry = new Date(
          shiftBreakBase.getTime() + gracePeriodMs
        );
        const secondHalfStartTimeForExit = new Date(
          shiftEndBase.getTime() - gracePeriodMs
        );

        const firstHalfStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "FH",
        });
        const secondHalfStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "SH",
        });
        const fullDayStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "FD",
        });
        const presentStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "P",
        });

        if (punchTime >= shiftStart && punchTime <= shiftEnd) {
          // console.log("Punch time is within shift hours");
          // console.log("Shift Start", shiftStart, " and ShiftEnd ", shiftEnd);
          const alreadyExists = await dailyAttendanceSchema.aggregate([
            {
              $match: {
                orgId: punchData.orgId,
                employeeId: punchData.employeeId,
                logInTime: {
                  $gte: shiftStart,
                  $lte: shiftEnd,
                },
              },
            },
          ]);
          // console.log("Already exists:", alreadyExists);

          // This is the Log in Section
          // this is the condition of the 1st record of the employee on the day that need to store to the daily Attendence
          if (!alreadyExists || alreadyExists.length === 0) {
            // console.log("No existing attendance found");
            // if the punch is within the shiftstart and break time which is the 1st half section
            // condition for login in 1st half
            if (
              punchTime <= shiftBreak &&
              punchTime <= firstHalfLastTimeForEntry
            ) {
              // add the punch to the daily attendence with 1st Half present, and 2nd half absent(by Default)
              const newDailyAttendencePunch = new dailyAttendanceSchema({
                orgId: employeeData.orgId,
                employeeId: employeeData.employeeId,
                shiftId: employeeData.shiftId,
                logInTime: punchTime,
                statusId: secondHalfStatusId._id,
              });
              await newDailyAttendencePunch.save();
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with 2nd half",
                secondHalfStatusId.shortName,
                " it is a 1st half valid one"
              );
            }

            // condition for login in 2st half
            else if (
              punchTime > shiftBreak &&
              punchTime <= secondHalfLastTimeForEntry
            ) {
              // add the punch to the daily attendence with 2nd half present and 1st half absent
              const newDailyAttendencePunch = new dailyAttendanceSchema({
                orgId: employeeData.orgId,
                employeeId: employeeData.employeeId,
                shiftId: employeeData.shiftId,
                logInTime: punchTime,
                statusId: fullDayStatusId._id,
              });
              await newDailyAttendencePunch.save();
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with full day",
                fullDayStatusId.shortName,
                " it is a 2nd half valid one"
              );
            }

            // condition for login in 1st half with Permission
            else if (
              punchTime < shiftBreak &&
              punchTime > firstHalfLastTimeForEntry
            ) {
              // check the permissions for the mrng Late Entry
              console.log(
                "Comming for The late entry permissions check in 1st Half"
              );

              const lateEntryPermissionsExistfor1stHalf =
                await permissionRequestSchema.aggregate([
                  {
                    $match: {
                      date: {
                        $gte: startOfDay,
                        $lte: endOfDay,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "statustypes",
                      localField: "statusId",
                      foreignField: "_id",
                      as: "statusDetails",
                    },
                  },
                  {
                    $unwind: "$statusDetails",
                  },
                  {
                    $lookup: {
                      from: "permissiontypes",
                      localField: "permissionTypeId",
                      foreignField: "_id",
                      as: "permissionTypeInfo",
                    },
                  },
                  {
                    $unwind: "$permissionTypeInfo",
                  },
                  {
                    $match: {
                      employeeId: new ObjectId(employeeData.employeeId),
                      "statusDetails.statusType": "ACCEPTED",
                      "permissionTypeInfo.permissionType": "LATEIN",
                      isFirstHalf: true,
                    },
                  },
                  {
                    $project: {
                      totalHours: 1,
                    },
                  },
                ]);

              const permissionMs =
                lateEntryPermissionsExistfor1stHalf[0]?.totalHours *
                60 *
                60 *
                1000;
              const permittedLastEntry = new Date(
                firstHalfLastTimeForEntry.getTime() + permissionMs
              );
              if (
                lateEntryPermissionsExistfor1stHalf &&
                lateEntryPermissionsExistfor1stHalf.length > 0 &&
                punchTime <= permittedLastEntry
              ) {
                console.log("Late entry permission granted for 1st half");
                // Grant attendance for the 1st half and make the intime as the shift Start time and afetrnoon as absent(by default) and add the permission Id
                const newDailyAttendencePunch = new dailyAttendanceSchema({
                  orgId: employeeData.orgId,
                  employeeId: employeeData.employeeId,
                  shiftId: employeeData.shiftId,
                  logInTime: shiftStart,
                  statusId: secondHalfStatusId._id,
                  permissionRequestId:
                    lateEntryPermissionsExistfor1stHalf[0]._id,
                  lateIn: true,
                });

                await newDailyAttendencePunch.save();
                console.log(
                  "A new punch is created to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with 2nd half ",
                  secondHalfStatusId.shortName,
                  " it is a 1st half permission one"
                );
              } else {
                console.log("Late entry permission denied for 1st half");
                // add the attendance record with 1st half absent and inTime as the punch Time  and afternoon absent (by default)
                const newDailyAttendencePunch = new dailyAttendanceSchema({
                  orgId: employeeData.orgId,
                  employeeId: employeeData.employeeId,
                  shiftId: employeeData.shiftId,
                  logInTime: punchTime,
                  statusId: firstHalfStatusId._id,
                  lateIn: true,
                });
                await newDailyAttendencePunch.save();
                console.log(
                  "A new punch is created to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with full day",
                  firstHalfStatusId.shortName,
                  " it is a 1st half invalid one"
                );
              }
            }

            //condition for login in 2nd half with permission
            else if (
              punchTime > shiftBreak &&
              punchTime > secondHalfLastTimeForEntry
            ) {
              // check for the permissions

              const lateEntryPermissionsExistfor2ndHalf =
                await permissionRequestSchema.aggregate([
                  {
                    $match: {
                      date: {
                        $gte: startOfDay,
                        $lte: endOfDay,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "statustypes",
                      localField: "statusId",
                      foreignField: "_id",
                      as: "statusDetails",
                    },
                  },
                  {
                    $unwind: "$statusDetails",
                  },
                  {
                    $lookup: {
                      from: "permissiontypes",
                      localField: "permissionTypeId",
                      foreignField: "_id",
                      as: "permissionTypeInfo",
                    },
                  },
                  {
                    $unwind: "$permissionTypeInfo",
                  },
                  {
                    $match: {
                      employeeId: new ObjectId(employeeData.employeeId),
                      "statusDetails.statusType": "ACCEPTED",
                      "permissionTypeInfo.permissionType": "LATEIN",
                      isFirstHalf: false,
                    },
                  },
                  {
                    $project: {
                      totalHours: 1,
                    },
                  },
                ]);
              const newDailyAttendancePunch = new dailyAttendanceSchema({
                orgId: employeeData.orgId,
                employeeId: employeeData.employeeId,
                shiftId: employeeData.shiftId,
                logInTime: punchTime,
                statusId: fullDayStatusId._id,
                lateIn: true,
              });

              const permissionMs =
                lateEntryPermissionsExistfor2ndHalf[0]?.totalHours *
                60 *
                60 *
                1000;
              const permittedStartEntry = new Date(
                secondHalfStartTimeForExit.getTime() - permissionMs
              );

              if (
                lateEntryPermissionsExistfor2ndHalf &&
                lateEntryPermissionsExistfor2ndHalf.length > 0 &&
                punchTime <= permittedStartEntry
              ) {
                // add the inTime as the shift breakTime and full day as absent
                newDailyAttendancePunch.logInTime = shiftBreak;
                newDailyAttendancePunch.permissions.push(
                  lateEntryPermissionsExistfor2ndHalf[0]._id
                );
                console.log(
                  "A new punch is created to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with full day ",
                  fullDayStatusId.shortName,
                  " it is a 2nd half permission one"
                );
              } else {
                console.log(
                  "A new punch is created to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with full day ",
                  fullDayStatusId.shortName,
                  " it is a 2nd half invalid one"
                );
              }
              await newDailyAttendancePunch.save();
            }
          }
          // This is the log Out Section
          // if (alreadyExists && alreadyExists[0] && (punchTime - alreadyExists[0].logInTime > 5 * 60 * 1000))
          else {
            console.log("Processing log out");

            // Find the existing attendance record for the employee
            const existingAttendance = await dailyAttendanceSchema.findOne({
              employeeId: employeeData.employeeId,
              shiftId: employeeData.shiftId,
              logInTime: { $gte: shiftStart, $lte: punchTime },
            });

            // console.log("Existing attendance found:", existingAttendance);
            // Determine the new status ID based on existing attendance
            // let newStatusId = presentStatusId._id;
            // if (existingAttendance && existingAttendance.statusId && existingAttendance.statusId.toString().equals(firstHalfStatusId._id.toString())) {
            //   console.log("Existing attendance found with first half status, don't change");
            //   newStatusId = firstHalfStatusId._id;
            // }
            // condition for logout in 1st half
            // console.log("Testing");
            if (
              punchTime < shiftBreak &&
              punchTime > firstHalfStartTimeForExit
            ) {
              // console.log("Comming for logout in 1st half in Time");
              // update the logout with the punchTime
              // Find the existing attendance record for the employee
              existingAttendance.logOutTime = punchTime;
              existingAttendance.earlyOut &&
                (existingAttendance.earlyOut = false);
              // existingAttendance.statusId = newStatusId;
              await existingAttendance.save();
              console.log(
                "The punch is updated to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with no change ",
                " it is a 1st half valid out"
              );

              // console.log(
              //   "Updating log out time for existing attendance:",
              //   existingAttendance
              // );
            }
            // condition for logout in 1st half with permission
            else if (
              punchTime < shiftBreak &&
              punchTime < firstHalfStartTimeForExit &&
              punchTime > firstHalfLastTimeForEntry
            ) {
              // check for the permissions for the 1st half early out

              existingAttendance.earlyOut = true;

              const earlyOutPermissionsExistfor1stHalf =
                await permissionRequestSchema.aggregate([
                  {
                    $match: {
                      date: {
                        $gte: startOfDay,
                        $lte: endOfDay,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "statustypes",
                      localField: "statusId",
                      foreignField: "_id",
                      as: "statusDetails",
                    },
                  },
                  {
                    $unwind: "$statusDetails",
                  },
                  {
                    $lookup: {
                      from: "permissiontypes",
                      localField: "permissionTypeId",
                      foreignField: "_id",
                      as: "permissionTypeInfo",
                    },
                  },
                  {
                    $unwind: "$permissionTypeInfo",
                  },
                  {
                    $match: {
                      employeeId: new ObjectId(employeeData.employeeId),
                      "statusDetails.statusType": "ACCEPTED",
                      "permissionTypeInfo.permissionType": "EARLYOUT",
                      isFirstHalf: true,
                    },
                  },
                  {
                    $project: {
                      totalHours: 1,
                    },
                  },
                ]);

              const permissionMs =
                earlyOutPermissionsExistfor1stHalf[0]?.totalHours *
                60 *
                60 *
                1000;
              const permittedStartExit = new Date(
                firstHalfStartTimeForExit.getTime() - permissionMs
              );

              if (
                earlyOutPermissionsExistfor1stHalf &&
                earlyOutPermissionsExistfor1stHalf.length > 0 &&
                punchTime >= permittedStartExit
              ) {
                // update the logout with the breakTime and add the permission request Id also
                existingAttendance.logOutTime = shiftBreak;
                existingAttendance.permissionRequestId =
                  earlyOutPermissionsExistfor1stHalf[0]._id;
                await existingAttendance.save();
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with no change",
                  " it is a 1st half permission out"
                );
              } else {
                // update the logout time as punch Time make the 1st half as absent
                existingAttendance.logOutTime = punchTime;
                existingAttendance.statusId = fullDayStatusId._id;
                await existingAttendance.save();
                console.log(
                  "A new punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with full day",
                  fullDayStatusId.shortName,
                  " it is a 1st half invalid out"
                );
              }
            }

            // condition for logout in 2nd half
            else if (
              punchTime > shiftBreak &&
              punchTime >= secondHalfStartTimeForExit
            ) {
              // update the logout time with punch time and make the 2nd half as the present
              existingAttendance.logOutTime = punchTime;
              existingAttendance.earlyOut &&
                (existingAttendance.earlyOut = false);
              if (
                existingAttendance.statusId.toString() ===
                secondHalfStatusId._id.toString()
              ) {
                existingAttendance.statusId = presentStatusId._id;
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with status present",
                  presentStatusId.shortName,
                  " it is a 2nd half valid out"
                );
              } else {
                if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
                  existingAttendance.statusId = fullDayStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FULLDAY ",
                    fullDayStatusId.shortName,
                    " it is a 2nd half invalid out"
                  );
                } else {
                  existingAttendance.statusId = firstHalfStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FIRST HALF ",
                    firstHalfStatusId.shortName,
                    " it is a 2nd half valid out, but mrng Abscent"
                  );
                }
              }
              await existingAttendance.save();
            }

            // condition for logout in 2nd half with permission
            else if (
              punchTime > shiftBreak &&
              punchTime < secondHalfStartTimeForExit &&
              punchTime > secondHalfLastTimeForEntry
            ) {
              // check for the permissions
              console.log("Checking for early out permissions");
              // console.log(" Punch Time ",punchTime, " secondHalfLastTimeForEntry ",secondHalfLastTimeForEntry," secondHalfStartTimeForExit ", secondHalfStartTimeForExit);

              existingAttendance.earlyOut = true;
              const earlyOutPermissionsExistfor2ndHalf =
                await permissionRequestSchema.aggregate([
                  {
                    $match: {
                      date: {
                        $gte: startOfDay,
                        $lte: endOfDay,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "statustypes",
                      localField: "statusId",
                      foreignField: "_id",
                      as: "statusDetails",
                    },
                  },
                  {
                    $unwind: "$statusDetails",
                  },
                  {
                    $lookup: {
                      from: "permissiontypes",
                      localField: "permissionTypeId",
                      foreignField: "_id",
                      as: "permissionTypeInfo",
                    },
                  },
                  {
                    $unwind: "$permissionTypeInfo",
                  },
                  {
                    $match: {
                      employeeId: new ObjectId(employeeData.employeeId),
                      "statusDetails.statusType": "ACCEPTED",
                      "permissionTypeInfo.permissionType": "EARLYOUT",
                      isFirstHalf: false,
                    },
                  },
                  {
                    $project: {
                      totalHours: 1,
                    },
                  },
                ]);

              const permissionMs =
                earlyOutPermissionsExistfor2ndHalf[0]?.totalHours *
                60 *
                60 *
                1000;
              const permittedStartEntry = new Date(
                secondHalfStartTimeForExit.getTime() - permissionMs
              );

              if (
                earlyOutPermissionsExistfor2ndHalf &&
                earlyOutPermissionsExistfor2ndHalf.length > 0 &&
                punchTime >= permittedStartEntry
              ) {
                // update the logout with the shiftEnd time and add the permission request Id also and make the 2nd half as the present
                existingAttendance.logOutTime = shiftEndBase;
                existingAttendance.permissionRequestId =
                  earlyOutPermissionsExistfor2ndHalf[0]._id;
                if (
                  existingAttendance.statusId.toString() ===
                  secondHalfStatusId._id.toString()
                ) {
                  existingAttendance.statusId = presentStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status present",
                    presentStatusId.shortName,
                    " it is a 2nd half permission out"
                  );
                } else {
                  if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
                    existingAttendance.statusId = fullDayStatusId._id;
                    console.log(
                      "A punch is updated to the ",
                      punchData.employeeCode,
                      " at ",
                      punchTime,
                      " with status FULLDAY ",
                      fullDayStatusId.shortName,
                      " it is a 2nd half invalid ans no permission out"
                    );
                  } else {
                    existingAttendance.statusId = firstHalfStatusId._id;
                    console.log(
                      "A punch is updated to the ",
                      punchData.employeeCode,
                      " at ",
                      punchTime,
                      " with status FIRST HALF ",
                      firstHalfStatusId.shortName,
                      " it is a 2nd half permission out, but mrng Abscent"
                    );
                  }
                }
              } else {
                // just update the logout time with punch time
                existingAttendance.logOutTime = punchTime;
                if (
                  existingAttendance.statusId.toString() ===
                  secondHalfStatusId._id.toString()
                ) {
                  existingAttendance.statusId = secondHalfStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status SECOND HALF ",
                    secondHalfStatusId.shortName,
                    " it is a 2nd half valid out"
                  );
                } else {
                  // if(existingAttendance.inTime > secondHalfLastTimeForEntry){
                  //   existingAttendance.statusId = fullDayStatusId._id;
                  // }
                  // else{
                  //   existingAttendance.statusId = firstHalfStatusId._id;
                  // }
                  existingAttendance.statusId = fullDayStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FULLDAY ",
                    fullDayStatusId.shortName,
                    " it is a 2nd half invalid out "
                  );
                }
                await existingAttendance.save();
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching attendance punches:", error.message);
      }
    }
  } catch (error) {
    console.error("Error fetching attendance punches:", error.message);
  }
};

// Fetch attendance punches from the main device api
// const getAttendancePunchesFromMainDevice = async (date) => {
//   try {
//     const todayDate = new Date().toISOString().split("T")[0];
//     // console.log("Calling the api");
//     const attendenceDeviceIp =
//       process.env.NODE_ENV !== "staging"
//         ? "https://210.212.210.89/office/hrmsapifordatewise.php"
//         : "https://172.7.67.49/office/hrmsapifordatewise.php";
//     const apiData = await axios.post(
//       // "https://office.technicalhub.io/hrmsapifordatewise.php",
//       // "https://210.212.210.89/office/hrmsapifordatewise.php",
//       attendenceDeviceIp,
//       // "https://210.212.210.89/office/hrmsapifordatewise.php",
//       {
//         date: date || todayDate,
//       },
//       {
//         httpsAgent: agent,
//       }
//     );
//     // console.log(`Total punches from Device: for date - ${date} - length - ${apiData.data.data.length}`);

//     // console.log("This is the api data ", apiData.data.data);
//     const data = apiData.data.data;
//     // console.log("This is first Punch from APi",data[0]);

//     const OrganizationId = await organizationSchema
//       .findOne({ name: "Technical Hub" })
//       .select("_id")
//       .lean();

//     // console.log("Organization ID:", OrganizationId);

//     if (!OrganizationId || !OrganizationId._id) {
//       console.error("No Organization found");
//       return;
//     }

//     for (const punch of data) {
//       try {
//         // if (punch.Employee_id !== "2A91A61D1") continue;
//         // if (punch.Employee_id !== "5104" && punch.Employee_id !== "5176") continue;
//         // if (punch.Employee_id !== "6230") continue;
//         // console.log("This is the punch data ", punch);
//         // break
//         // if (punch.Employee_id == "6230") {
//         //   console.log(punch);
//         // }

//         // Calculate punchTime from API
//         // const punchTime = changeGTMtoIST(new Date(punch.after.timestamp));
//         const punchTime = changeGTMtoIST(new Date(punch.LogDate));
//         const date = punchTime.toISOString().split("T")[0];

//         const startOfDay = new Date(date + "T00:00:00.000Z");
//         const endOfDay = new Date(date + "T23:59:59.999Z");
//         // console.log("this is the punch Time ", punchTime, " for the employee ", punch.after.EmployeeCode," and start ",startOfDay, " and end ", endOfDay );

//         let punchTimeFromDb = null;
//         const lastPunch = await attendancePunchesSchema
//           .findOne({
//             // employeeCode: punch.after.EmployeeCode,
//             employeeCode: punch.Employee_id,
//             sourceId: punch.DeviceId,
//             punchTime: { $gte: startOfDay, $lte: endOfDay },
//           })
//           .sort({ punchTime: -1 });

//         // console.log("This is last Punch", lastPunch);

//         if (lastPunch) {
//           punchTimeFromDb = lastPunch.punchTime;
//         }

//         // console.log("Last punch time from DB:", lastPunch);

//         // console.log("This punchTime from DB",punch.Employee_id,  punchTimeFromDb);
//         // console.log("This punchTime from API", punchTime);

//         // console.log("Processing punch for employee:", punch.Employee_id, " at ", punchTime);

//         // Skip if this punch is within 1 minutes of the last punch for this employee/device on the same date
//         if (punchTimeFromDb && punchTime - punchTimeFromDb < 60 * 1000) {
//           // console.log("The punch is skipping", punch);
//           continue;
//         }

//         // console.log("Processing punch for employee:", punch.Employee_id, " at ", punchTime);
//         // console.log("Processing punch for employee:", punch.Employee_id);

//         const employee = await employeeSchema.aggregate([
//           {
//             $match: {
//               employeeCode: punch.Employee_id,
//               orgId: OrganizationId._id,
//             },
//           },
//           {
//             $lookup: {
//               from: "shifts",
//               localField: "shiftId",
//               foreignField: "_id",
//               as: "shiftInfo",
//             },
//           },
//           {
//             $unwind: "$shiftInfo",
//           },
//           {
//             $project: {
//               _id: 0,
//               orgId: 1,
//               shiftId: "$shiftInfo._id",
//               employeeId: "$_id",
//               shiftStart: "$shiftInfo.startTime",
//               shiftEnd: "$shiftInfo.endTime",
//               shiftBreak: "$shiftInfo.breakTime",
//               shiftGracePeriod: "$shiftInfo.gracePeriodMin",
//             },
//           },
//         ]);

//         // console.log("This is the employee data from DB", employee);

//         if (!employee || employee.length === 0) {
//           // console.warn("No employee data found for ", punch.Employee_id);
//           continue;
//         }

//         const punchData = {
//           punchId: punch._id,
//           employeeId: employee[0]?.employeeId,
//           employeeCode: punch.Employee_id,
//           punchTime: punchTime,
//           source: "FRS",
//           sourceId: punch.DeviceId,
//         };

//         const alreadyExistsPunch = await attendancePunchesSchema.findOne({
//           employeeCode: punchData.employeeCode,
//           sourceId: punchData.sourceId,
//           punchTime: punchData.punchTime,
//         });

//         // console.log("This is alreadyExists", alreadyExists);

//         if (!alreadyExistsPunch) {
//           // console.log("Saving to the DB");
//           await addAttendancePunchsToDB(punchData);
//         }

//         // console.log("This is after saving ot db");

//         const employeeData = employee[0];

//         // if (!employeeData) {
//         //   console.warn("No employee data found for ", punchData.employeeId);
//         //   return null;
//         // }

//         // Convert grace period from minutes to milliseconds
//         const gracePeriodMs = employeeData.shiftGracePeriod * 60 * 1000;

//         // Create base shift times for the date
//         const shiftStartBase = new Date(
//           `${date}T${employeeData.shiftStart}:00.000Z`
//         );
//         const shiftBreakBase = new Date(
//           `${date}T${employeeData.shiftBreak}:00.000Z`
//         );
//         const shiftEndBase = new Date(
//           `${date}T${employeeData.shiftEnd}:00.000Z`
//         );

//         // Calculate actual shift times with grace period
//         const shiftStart = new Date(shiftStartBase.getTime() - 90 * 60 * 1000);
//         const shiftBreak = new Date(shiftBreakBase.getTime()); // Break time doesn't change
//         const shiftEnd = new Date(shiftEndBase.getTime() + 90 * 60 * 1000);

//         // Calculate entry and exit time windows
//         const firstHalfLastTimeForEntry = new Date(
//           shiftStartBase.getTime() + gracePeriodMs
//         );
//         const firstHalfStartTimeForExit = new Date(
//           shiftBreakBase.getTime() - gracePeriodMs
//         );
//         const secondHalfLastTimeForEntry = new Date(
//           shiftBreakBase.getTime() + gracePeriodMs
//         );
//         const secondHalfStartTimeForExit = new Date(
//           shiftEndBase.getTime() - gracePeriodMs
//         );

//         const firstHalfStatusId = await attendenceStatusTypesSchema.findOne({
//           shortName: "FH",
//         });
//         const secondHalfStatusId = await attendenceStatusTypesSchema.findOne({
//           shortName: "SH",
//         });
//         const fullDayStatusId = await attendenceStatusTypesSchema.findOne({
//           shortName: "FD",
//         });
//         const presentStatusId = await attendenceStatusTypesSchema.findOne({
//           shortName: "P",
//         });

//         if (
//           !firstHalfStatusId ||
//           !secondHalfStatusId ||
//           !fullDayStatusId ||
//           !presentStatusId
//         ) {
//           // console.log(firstHalfStatusId, secondHalfStatusId, fullDayStatusId, presentStatusId);
//           console.error("One or more status types not found in DB");
//           return;
//         }

//         // console.log("This is punchTime ", punchTime);
//         // console.log("strat", shiftStart, " end ", shiftEnd);
//         // if (punchTime >= shiftStart && punchTime <= shiftEnd) {
//         // console.log("Punch time is within shift hours");
//         // console.log("Shift Start", shiftStart, " and ShiftEnd ", shiftEnd);
//         const alreadyExists = await dailyAttendanceSchema.aggregate([
//           {
//             $match: {
//               employeeId: punchData.employeeId,
//               logInTime: {
//                 $gte: startOfDay,
//                 $lte: endOfDay,
//               },
//             },
//           },
//         ]);
//         // console.log("Already exists:", alreadyExists);

//         // This is the Log in Section
//         // this is the condition of the 1st record of the employee on the day that need to store to the daily Attendence
//         if (!alreadyExists || alreadyExists.length === 0) {
//           // console.log("No existing attendance found");
//           // if the punch is within the shiftstart and break time which is the 1st half section
//           // condition for login in 1st half
//           if (
//             punchTime <= shiftBreak &&
//             punchTime <= firstHalfLastTimeForEntry
//           ) {
//             // add the punch to the daily attendence with 1st Half present, and 2nd half absent(by Default)
//             const newDailyAttendencePunch = new dailyAttendanceSchema({
//               orgId: employeeData.orgId,
//               employeeId: employeeData.employeeId,
//               shiftId: employeeData.shiftId,
//               logInTime: punchTime,
//               statusId: secondHalfStatusId._id,
//             });
//             await newDailyAttendencePunch.save();
//             console.log(
//               "A new punch is created to the ",
//               punchData.employeeCode,
//               " at ",
//               punchTime,
//               " with 2nd half",
//               secondHalfStatusId.shortName,
//               " it is a 1st half valid one"
//             );
//           }

//           // condition for login in 2st half
//           else if (
//             punchTime > shiftBreak &&
//             punchTime <= secondHalfLastTimeForEntry
//           ) {
//             // add the punch to the daily attendence with 2nd half present and 1st half absent
//             const newDailyAttendencePunch = new dailyAttendanceSchema({
//               orgId: employeeData.orgId,
//               employeeId: employeeData.employeeId,
//               shiftId: employeeData.shiftId,
//               logInTime: punchTime,
//               statusId: fullDayStatusId._id,
//             });
//             await newDailyAttendencePunch.save();
//             console.log(
//               "A new punch is created to the ",
//               punchData.employeeCode,
//               " at ",
//               punchTime,
//               " with full day",
//               fullDayStatusId.shortName,
//               " it is a 2nd half valid one"
//             );
//           }

//           // condition for login in 1st half with Permission
//           else if (
//             punchTime < shiftBreak &&
//             punchTime > firstHalfLastTimeForEntry
//           ) {
//             // check the permissions for the mrng Late Entry
//             console.log(
//               "Comming for The late entry permissions check in 1st Half"
//             );

//             const lateEntryPermissionsExistfor1stHalf =
//               await permissionRequestSchema.aggregate([
//                 {
//                   $match: {
//                     date: {
//                       $gte: startOfDay,
//                       $lte: endOfDay,
//                     },
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "statustypes",
//                     localField: "statusId",
//                     foreignField: "_id",
//                     as: "statusDetails",
//                   },
//                 },
//                 {
//                   $unwind: "$statusDetails",
//                 },
//                 {
//                   $lookup: {
//                     from: "permissiontypes",
//                     localField: "permissionTypeId",
//                     foreignField: "_id",
//                     as: "permissionTypeInfo",
//                   },
//                 },
//                 {
//                   $unwind: "$permissionTypeInfo",
//                 },
//                 {
//                   $match: {
//                     employeeId: new ObjectId(employeeData.employeeId),
//                     "statusDetails.statusType": "ACCEPTED",
//                     "permissionTypeInfo.permissionType": "LATEIN",
//                     isFirstHalf: true,
//                   },
//                 },
//                 {
//                   $project: {
//                     totalHours: 1,
//                   },
//                 },
//               ]);

//             const permissionMs =
//               lateEntryPermissionsExistfor1stHalf[0]?.totalHours *
//               60 *
//               60 *
//               1000;
//             const permittedLastEntry = new Date(
//               firstHalfLastTimeForEntry.getTime() + permissionMs
//             );
//             if (
//               lateEntryPermissionsExistfor1stHalf &&
//               lateEntryPermissionsExistfor1stHalf.length > 0 &&
//               punchTime <= permittedLastEntry
//             ) {
//               console.log("Late entry permission granted for 1st half");
//               // Grant attendance for the 1st half and make the intime as the shift Start time and afetrnoon as absent(by default) and add the permission Id
//               const newDailyAttendencePunch = new dailyAttendanceSchema({
//                 orgId: employeeData.orgId,
//                 employeeId: employeeData.employeeId,
//                 shiftId: employeeData.shiftId,
//                 logInTime: shiftStartBase,
//                 statusId: secondHalfStatusId._id,
//                 permissionRequestId: lateEntryPermissionsExistfor1stHalf[0]._id,
//                 lateIn: true,
//               });

//               await newDailyAttendencePunch.save();
//               console.log(
//                 "A new punch is created to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with 2nd half ",
//                 secondHalfStatusId.shortName,
//                 " it is a 1st half permission one"
//               );
//             } else {
//               console.log("Late entry permission denied for 1st half");
//               // add the attendance record with 1st half absent and inTime as the punch Time  and afternoon absent (by default)
//               const newDailyAttendencePunch = new dailyAttendanceSchema({
//                 orgId: employeeData.orgId,
//                 employeeId: employeeData.employeeId,
//                 shiftId: employeeData.shiftId,
//                 logInTime: punchTime,
//                 statusId: firstHalfStatusId._id,
//                 lateIn: true,
//               });
//               await newDailyAttendencePunch.save();
//               console.log(
//                 "A new punch is created to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with full day",
//                 firstHalfStatusId.shortName,
//                 " it is a 1st half invalid one"
//               );
//             }
//           }

//           //condition for login in 2nd half with permission
//           else if (
//             punchTime > shiftBreak &&
//             punchTime > secondHalfLastTimeForEntry
//           ) {
//             const allowTime = new Date(
//               secondHalfStartTimeForExit.getTime() - gracePeriodMs
//             );

//             console.warn("This is the allow time ", allowTime);

//             // if (punchTime >= allowTime) {
//             //   // it is the logout condition and we need to assume like the employee forgot the 1st punch on that day
//             //   const newDailyAttendancePunch = new dailyAttendanceSchema({
//             //     orgId: employeeData.orgId,
//             //     employeeId: employeeData.employeeId,
//             //     shiftId: employeeData.shiftId,
//             //     logInTime: null,
//             //     logOutTime: punchTime,
//             //     statusId: firstHalfStatusId._id,
//             //   });
//             //   await newDailyAttendancePunch.save();
//             // } else {
//             const lateEntryPermissionsExistfor2ndHalf =
//               await permissionRequestSchema.aggregate([
//                 {
//                   $match: {
//                     date: {
//                       $gte: startOfDay,
//                       $lte: endOfDay,
//                     },
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "statustypes",
//                     localField: "statusId",
//                     foreignField: "_id",
//                     as: "statusDetails",
//                   },
//                 },
//                 {
//                   $unwind: "$statusDetails",
//                 },
//                 {
//                   $lookup: {
//                     from: "permissiontypes",
//                     localField: "permissionTypeId",
//                     foreignField: "_id",
//                     as: "permissionTypeInfo",
//                   },
//                 },
//                 {
//                   $unwind: "$permissionTypeInfo",
//                 },
//                 {
//                   $match: {
//                     employeeId: new ObjectId(employeeData.employeeId),
//                     "statusDetails.statusType": "ACCEPTED",
//                     "permissionTypeInfo.permissionType": "LATEIN",
//                     isFirstHalf: false,
//                   },
//                 },
//                 {
//                   $project: {
//                     totalHours: 1,
//                   },
//                 },
//               ]);

//             const newDailyAttendancePunch = new dailyAttendanceSchema({
//               orgId: employeeData.orgId,
//               employeeId: employeeData.employeeId,
//               shiftId: employeeData.shiftId,
//               logInTime: punchTime,
//               statusId: fullDayStatusId._id,
//               lateIn: true,
//             });

//             const permissionMs =
//               lateEntryPermissionsExistfor2ndHalf[0]?.totalHours *
//               60 *
//               60 *
//               1000;
//             const permittedStartEntry = new Date(
//               secondHalfStartTimeForExit.getTime() - permissionMs
//             );

//             if (
//               lateEntryPermissionsExistfor2ndHalf &&
//               lateEntryPermissionsExistfor2ndHalf.length > 0 &&
//               punchTime <= permittedStartEntry
//             ) {
//               // add the inTime as the shift breakTime and full day as absent
//               newDailyAttendancePunch.logInTime = breakTime;
//               // newDailyAttendancePunch.logOutTime = secondHalfStartTimeForExit;
//               newDailyAttendancePunch.permissions.push(
//                 lateEntryPermissionsExistfor2ndHalf[0]._id
//               );
//               console.log(
//                 "A new punch is created to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with full day ",
//                 fullDayStatusId.shortName,
//                 " it is a 2nd half permission one"
//               );
//             } else {
//               console.log(
//                 "A new punch is created to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with full day ",
//                 fullDayStatusId.shortName,
//                 " it is a 2nd half invalid one"
//               );
//             }
//             await newDailyAttendancePunch.save();
//           }
//         } else if (
//           punchTime > secondHalfLastTimeForEntry &&
//           punchTime < secondHalfStartTimeForExit
//         ) {
//           console.log("Punch time does not fit any login conditions", punchData);
//         }
//         // }
//         // This is the log Out Section
//         // if (alreadyExists && alreadyExists[0] && (punchTime - alreadyExists[0].logInTime > 5 * 60 * 1000))
//         else {
//           console.log(
//             "Processing log out for ",
//             punchData.employeeCode,
//             " at ",
//             punchTime
//           );

//           // Find the existing attendance record for the employee
//           const existingAttendance = await dailyAttendanceSchema.findOne({
//             employeeId: employeeData.employeeId,
//             shiftId: employeeData.shiftId,
//             logInTime: { $gte: startOfDay, $lte: punchTime },
//           });

//           // console.log("Existing attendance found:", existingAttendance);
//           // Determine the new status ID based on existing attendance
//           // let newStatusId = presentStatusId._id;
//           // if (existingAttendance && existingAttendance.statusId && existingAttendance.statusId.toString().equals(firstHalfStatusId._id.toString())) {
//           //   console.log("Existing attendance found with first half status, don't change");
//           //   newStatusId = firstHalfStatusId._id;
//           // }
//           // condition for logout in 1st half
//           // console.log("Testing");
//           if (punchTime < shiftBreak && punchTime > firstHalfStartTimeForExit) {
//             // console.log("Comming for logout in 1st half in Time");
//             // update the logout with the punchTime
//             // Find the existing attendance record for the employee
//             existingAttendance.logOutTime = punchTime;
//             existingAttendance.earlyOut &&
//               (existingAttendance.earlyOut = false);
//             // existingAttendance.statusId = newStatusId;
//             await existingAttendance.save();
//             console.log(
//               "The punch is updated to the ",
//               punchData.employeeCode,
//               " at ",
//               punchTime,
//               " with no change ",
//               " it is a 1st half valid out"
//             );

//             // console.log(
//             //   "Updating log out time for existing attendance:",
//             //   existingAttendance
//             // );
//           }
//           // condition for logout in 1st half with permission
//           else if (
//             punchTime < shiftBreak &&
//             punchTime < firstHalfStartTimeForExit &&
//             punchTime > firstHalfLastTimeForEntry
//           ) {
//             // check for the permissions for the 1st half early out

//             existingAttendance.earlyOut = true;

//             const earlyOutPermissionsExistfor1stHalf =
//               await permissionRequestSchema.aggregate([
//                 {
//                   $match: {
//                     date: {
//                       $gte: startOfDay,
//                       $lte: endOfDay,
//                     },
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "statustypes",
//                     localField: "statusId",
//                     foreignField: "_id",
//                     as: "statusDetails",
//                   },
//                 },
//                 {
//                   $unwind: "$statusDetails",
//                 },
//                 {
//                   $lookup: {
//                     from: "permissiontypes",
//                     localField: "permissionTypeId",
//                     foreignField: "_id",
//                     as: "permissionTypeInfo",
//                   },
//                 },
//                 {
//                   $unwind: "$permissionTypeInfo",
//                 },
//                 {
//                   $match: {
//                     employeeId: new ObjectId(employeeData.employeeId),
//                     "statusDetails.statusType": "ACCEPTED",
//                     "permissionTypeInfo.permissionType": "EARLYOUT",
//                     isFirstHalf: true,
//                   },
//                 },
//                 {
//                   $project: {
//                     totalHours: 1,
//                   },
//                 },
//               ]);

//             const permissionMs =
//               earlyOutPermissionsExistfor1stHalf[0]?.totalHours *
//               60 *
//               60 *
//               1000;
//             const permittedStartExit = new Date(
//               firstHalfStartTimeForExit.getTime() - permissionMs
//             );

//             if (
//               earlyOutPermissionsExistfor1stHalf &&
//               earlyOutPermissionsExistfor1stHalf.length > 0 &&
//               punchTime >= permittedStartExit
//             ) {
//               // update the logout with the breakTime and add the permission request Id also
//               existingAttendance.logOutTime = shiftBreak;
//               existingAttendance.permissionRequestId =
//                 earlyOutPermissionsExistfor1stHalf[0]._id;
//               await existingAttendance.save();
//               console.log(
//                 "A punch is updated to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with no change",
//                 " it is a 1st half permission out"
//               );
//             } else {
//               // update the logout time as punch Time make the 1st half as absent
//               existingAttendance.logOutTime = punchTime;
//               existingAttendance.statusId = fullDayStatusId._id;
//               await existingAttendance.save();
//               console.log(
//                 "A new punch is updated to the ",
//                 punchData.employeeCode,
//                 " at ",
//                 punchTime,
//                 " with full day",
//                 fullDayStatusId.shortName,
//                 " it is a 1st half invalid out"
//               );
//             }
//           }

//           // condition for logout in 2nd half
//           else if (
//             punchTime > shiftBreak &&
//             punchTime >= secondHalfStartTimeForExit
//           ) {
//             // update the logout time with punch time and make the 2nd half as the present
//             existingAttendance.logOutTime = punchTime;
//             existingAttendance.earlyOut &&
//               (existingAttendance.earlyOut = false);

//             if (
//               existingAttendance.statusId.toString() !==
//               presentStatusId._id.toString()
//             ) {
//               if (
//                 existingAttendance.statusId.toString() ===
//                 secondHalfStatusId._id.toString()
//               ) {
//                 existingAttendance.statusId = presentStatusId._id;
//                 console.log(
//                   "A punch is updated to the ",
//                   punchData.employeeCode,
//                   " at ",
//                   punchTime,
//                   " with status present",
//                   presentStatusId.shortName,
//                   " it is a 2nd half valid out"
//                 );
//               } else {
//                 if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
//                   existingAttendance.statusId = fullDayStatusId._id;
//                   console.log(
//                     "A punch is updated to the ",
//                     punchData.employeeCode,
//                     " at ",
//                     punchTime,
//                     " with status FULLDAY ",
//                     fullDayStatusId.shortName,
//                     " it is a 2nd half invalid out"
//                   );
//                 } else {
//                   existingAttendance.statusId = firstHalfStatusId._id;
//                   console.log(
//                     "A punch is updated to the ",
//                     punchData.employeeCode,
//                     " at ",
//                     punchTime,
//                     " with status FIRST HALF ",
//                     firstHalfStatusId.shortName,
//                     " it is a 2nd half valid out, but mrng Abscent"
//                   );
//                 }
//               }
//             }
//             await existingAttendance.save();
//           }

//           // condition for logout in 2nd half with permission
//           else if (
//             punchTime > shiftBreak &&
//             punchTime < secondHalfStartTimeForExit &&
//             punchTime > secondHalfLastTimeForEntry
//           ) {
//             // check for the permissions
//             console.log("Checking for early out permissions");
//             // console.log(" Punch Time ",punchTime, " secondHalfLastTimeForEntry ",secondHalfLastTimeForEntry," secondHalfStartTimeForExit ", secondHalfStartTimeForExit);

//             existingAttendance.earlyOut = true;
//             const earlyOutPermissionsExistfor2ndHalf =
//               await permissionRequestSchema.aggregate([
//                 {
//                   $match: {
//                     date: {
//                       $gte: startOfDay,
//                       $lte: endOfDay,
//                     },
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "statustypes",
//                     localField: "statusId",
//                     foreignField: "_id",
//                     as: "statusDetails",
//                   },
//                 },
//                 {
//                   $unwind: "$statusDetails",
//                 },
//                 {
//                   $lookup: {
//                     from: "permissiontypes",
//                     localField: "permissionTypeId",
//                     foreignField: "_id",
//                     as: "permissionTypeInfo",
//                   },
//                 },
//                 {
//                   $unwind: "$permissionTypeInfo",
//                 },
//                 {
//                   $match: {
//                     employeeId: new ObjectId(employeeData.employeeId),
//                     "statusDetails.statusType": "ACCEPTED",
//                     "permissionTypeInfo.permissionType": "EARLYOUT",
//                     isFirstHalf: false,
//                   },
//                 },
//                 {
//                   $project: {
//                     totalHours: 1,
//                   },
//                 },
//               ]);

//             const permissionMs =
//               earlyOutPermissionsExistfor2ndHalf[0]?.totalHours *
//               60 *
//               60 *
//               1000;
//             const permittedStartEntry = new Date(
//               secondHalfStartTimeForExit.getTime() - permissionMs
//             );

//             if (
//               earlyOutPermissionsExistfor2ndHalf &&
//               earlyOutPermissionsExistfor2ndHalf.length > 0 &&
//               punchTime >= permittedStartEntry
//             ) {
//               // update the logout with the shiftEnd time and add the permission request Id also and make the 2nd half as the present
//               existingAttendance.logOutTime = shiftEndBase;
//               existingAttendance.permissionRequestId =
//                 earlyOutPermissionsExistfor2ndHalf[0]._id;
//               if (
//                 existingAttendance.statusId.toString() ===
//                 secondHalfStatusId._id.toString()
//               ) {
//                 existingAttendance.statusId = presentStatusId._id;
//                 console.log(
//                   "A punch is updated to the ",
//                   punchData.employeeCode,
//                   " at ",
//                   punchTime,
//                   " with status present",
//                   presentStatusId.shortName,
//                   " it is a 2nd half permission out"
//                 );
//               } else {
//                 if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
//                   existingAttendance.statusId = fullDayStatusId._id;
//                   console.log(
//                     "A punch is updated to the ",
//                     punchData.employeeCode,
//                     " at ",
//                     punchTime,
//                     " with status FULLDAY ",
//                     fullDayStatusId.shortName,
//                     " it is a 2nd half invalid ans no permission out"
//                   );
//                 } else {
//                   existingAttendance.statusId = firstHalfStatusId._id;
//                   console.log(
//                     "A punch is updated to the ",
//                     punchData.employeeCode,
//                     " at ",
//                     punchTime,
//                     " with status FIRST HALF ",
//                     firstHalfStatusId.shortName,
//                     " it is a 2nd half permission out, but mrng Abscent"
//                   );
//                 }
//               }
//             } else {
//               // just update the logout time with punch time
//               existingAttendance.logOutTime = punchTime;
//               if (
//                 existingAttendance.statusId.toString() ===
//                 secondHalfStatusId._id.toString()
//               ) {
//                 existingAttendance.statusId = secondHalfStatusId._id;
//                 console.log(
//                   "A punch is updated to the ",
//                   punchData.employeeCode,
//                   " at ",
//                   punchTime,
//                   " with status SECOND HALF ",
//                   secondHalfStatusId.shortName,
//                   " it is a 2nd half valid out"
//                 );
//               } else {
//                 // if(existingAttendance.inTime > secondHalfLastTimeForEntry){
//                 //   existingAttendance.statusId = fullDayStatusId._id;
//                 // }
//                 // else{
//                 //   existingAttendance.statusId = firstHalfStatusId._id;
//                 // }
//                 existingAttendance.statusId = fullDayStatusId._id;
//                 console.log(
//                   "A punch is updated to the ",
//                   punchData.employeeCode,
//                   " at ",
//                   punchTime,
//                   " with status FULLDAY ",
//                   fullDayStatusId.shortName,
//                   " it is a 2nd half invalid out "
//                 );
//               }
//               await existingAttendance.save();
//             }
//           }
//         }
//         // }
//         // else{

//         //   console.log("This is out of Shift");
//         // }
//       } catch (error) {
//         console.log("This is the error", error);
//         console.error("Error fetching attendance punches:", error.message);
//       }
//     }
//   } catch (error) {
//     console.log("This is the error", error);
//     console.error("Error fetching attendance punches:", error.message);
//   }
// };

// Fetch attendance punches from the main device api

const getAttendancePunchesFromMainDevice = async (
  date,
  orgId,
  attendenceDeviceIp
) => {
  try {
    // const todayDate = new Date().toISOString().split("T")[0];
    // console.log("Calling the api with the date ", date);

    const apiData = await axios.post(
      // "https://office.technicalhub.io/hrmsapifordatewise.php",
      // "https://210.212.210.89/office/hrmsapifordatewise.php",
      attendenceDeviceIp,

      // "https://210.212.210.89/office/hrmsapifordatewise.php",
      {
        date: date,
        serialno: "NCD8244900467",
      },
      {
        httpsAgent: agent,
      }
    );
    console.log(
      "Total punches from Device on ",
      date,
      ":",
      apiData.data.data.length
    );

    // console.log("This is the api data ", apiData?.data?.data?.length);
    const data = apiData.data.data;
    // console.log("This is first Punch from APi",data[0]);

    // console.log("Organization ID:", OrganizationId);

    for (const punch of data) {
      try {
        // if (punch.Employee_id.length < 4) {
        //   console.log(
        //     "This is EmployeeId with less than 4 length",
        //     punch.Employee_id
        //   );
        //   const prefixZeros = "0".repeat(4 - punch.Employee_id.length);
        //   punch.Employee_id = prefixZeros + punch.Employee_id;
        //   console.log("This is Employee ID after change ", punch.Employee_id);
        // }
        // if (punch.Employee_id !== "2A91A61D1") continue;
        // if (punch.Employee_id !== "5104" && punch.Employee_id !== "5176") continue;
        // if (punch.Employee_id !== "5104") continue;
        // console.log("This is the punch data ", punch);
        // break
        // if (punch.Employee_id == "4348") {
        //   console.log(punch);
        // }

        // Calculate punchTime from API
        // const punchTime = changeGTMtoIST(new Date(punch.after.timestamp));
        const punchTime = changeGTMtoIST(new Date(punch.LogDate));
        const date = punchTime.toISOString().split("T")[0];

        const startOfDay = new Date(date + "T00:00:00.000Z");
        const endOfDay = new Date(date + "T23:59:59.999Z");
        // console.log("this is the punch Time ", punchTime, " for the employee ", punch.after.EmployeeCode," and start ",startOfDay, " and end ", endOfDay );

        let punchTimeFromDb = null;
        const lastPunch = await attendancePunchesSchema
          .findOne({
            // employeeCode: punch.after.EmployeeCode,
            employeeCode: punch.Employee_id,
            sourceId: punch.DeviceId,
            punchTime: { $gte: startOfDay, $lte: endOfDay },
          })
          .sort({ punchTime: -1 });

        // console.log("This is last Punch", lastPunch);

        if (lastPunch) {
          punchTimeFromDb = lastPunch.punchTime;
        }

        // console.log("This punchTime from DB", punchTimeFromDb);
        // console.log("This punchTime from API", punchTime);

        // Skip if this punch is within 1 minutes of the last punch for this employee/device on the same date
        if (punchTimeFromDb && punchTime - punchTimeFromDb < 1 * 60 * 1000) {
          // console.log("The punch is skipping", punch);
          continue;
        }

        const employee = await employeeSchema.aggregate([
          {
            $match: {
              employeeCode: punch.Employee_id,
              orgId: orgId,
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
            $unwind: "$shiftInfo",
          },
          {
            $project: {
              _id: 0,
              orgId: 1,
              shiftId: "$shiftInfo._id",
              employeeId: "$_id",
              shiftStart: "$shiftInfo.startTime",
              shiftEnd: "$shiftInfo.endTime",
              shiftBreakStart: "$shiftInfo.breakTimeStart",
              shiftBreakEnd: "$shiftInfo.breakTimeEnd",
              shiftGracePeriod: "$shiftInfo.gracePeriodMin",
            },
          },
        ]);

        if (!employee || employee.length === 0) {
          // console.warn("No employee data found for ", punch.Employee_id);
          continue;
        }

        const punchData = {
          punchId: punch._id,
          employeeId: employee[0]?.employeeId,
          employeeCode: punch.Employee_id,
          punchTime: punchTime,
          source: "FRS",
          sourceId: punch.DeviceId,
        };

        const alreadyExistsPunch = await attendancePunchesSchema.findOne({
          employeeCode: punchData.employeeCode,
          sourceId: punchData.sourceId,
          punchTime: punchData.punchTime,
        });

        // console.log("This is alreadyExists", alreadyExists);

        if (!alreadyExistsPunch) {
          // console.log("Saving to the DB");
          await addAttendancePunchsToDB(punchData);
        }

        // console.log("This is after saving ot db");

        const employeeData = employee[0];

        // if (!employeeData) {
        //   console.warn("No employee data found for ", punchData.employeeId);
        //   return null;
        // }

        // Convert grace period from minutes to milliseconds
        const gracePeriodMs = employeeData.shiftGracePeriod * 60 * 1000;

        // Create base shift times for the date
        const shiftStartBase = new Date(
          `${date}T${employeeData.shiftStart}:00.000Z`
        );
        const shiftBreakStartBase = new Date(
          `${date}T${employeeData.shiftBreakStart}:00.000Z`
        );
        const shiftBreakEndBase = new Date(
          `${date}T${employeeData.shiftBreakEnd}:00.000Z`
        );
        const shiftEndBase = new Date(
          `${date}T${employeeData.shiftEnd}:00.000Z`
        );

        // Calculate actual shift times with grace period
        const shiftStart = new Date(shiftStartBase.getTime() - 90 * 60 * 1000);
        const shiftBreakStart = new Date(shiftBreakStartBase.getTime());
        const shiftBreakEnd = new Date(shiftBreakEndBase.getTime());
        const shiftEnd = new Date(shiftEndBase.getTime() + 90 * 60 * 1000);

        // Calculate entry and exit time windows
        const firstHalfLastTimeForEntry = new Date(
          shiftStartBase.getTime() + gracePeriodMs
        );
        const firstHalfStartTimeForExit = new Date(
          shiftBreakStartBase.getTime() - gracePeriodMs
        );
        const secondHalfLastTimeForEntry = new Date(
          shiftBreakEndBase.getTime() + gracePeriodMs
        );
        const secondHalfStartTimeForExit = new Date(
          shiftEndBase.getTime() - gracePeriodMs
        );

        const firstHalfStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "FH",
        });
        const secondHalfStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "SH",
        });
        const fullDayStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "FD",
        });
        const presentStatusId = await attendenceStatusTypesSchema.findOne({
          shortName: "P",
        });

        if (
          !firstHalfStatusId ||
          !secondHalfStatusId ||
          !fullDayStatusId ||
          !presentStatusId
        ) {
          // console.log(firstHalfStatusId, secondHalfStatusId, fullDayStatusId, presentStatusId);
          console.error("One or more status types not found in DB");
          return;
        }

        // console.log("This is punchTime ", punchTime);
        // console.log("strat", shiftStart, " end ", shiftEnd);
        // if (punchTime >= shiftStart && punchTime <= shiftEnd) {
        // console.log("Punch time is within shift hours");
        // console.log("Shift Start", shiftStart, " and ShiftEnd ", shiftEnd);
        const alreadyExists = await dailyAttendanceSchema.aggregate([
          {
            $match: {
              employeeId: punchData.employeeId,
              logInTime: {
                $gte: startOfDay,
                $lte: endOfDay,
              },
            },
          },
        ]);
        // console.log("Already exists:", alreadyExists);

        // This is the Log in Section
        // this is the condition of the 1st record of the employee on the day that need to store to the daily Attendence
        if (!alreadyExists || alreadyExists.length === 0) {
          // console.log("No existing attendance found");
          // if the punch is within the shiftstart and break time which is the 1st half section
          // condition for login in 1st half
          if (punchTime <= firstHalfLastTimeForEntry) {
            // add the punch to the daily attendence with 1st Half present, and 2nd half absent(by Default)
            const newDailyAttendencePunch = new dailyAttendanceSchema({
              orgId: employeeData.orgId,
              employeeId: employeeData.employeeId,
              shiftId: employeeData.shiftId,
              logInTime: punchTime,
              statusId: secondHalfStatusId._id,
            });
            await newDailyAttendencePunch.save();
            console.log(
              "A new punch is created to the ",
              punchData.employeeCode,
              " at ",
              punchTime,
              " with 2nd half",
              secondHalfStatusId.shortName,
              " it is a 1st half valid one"
            );
          }

          // condition for login in 1st half with Permission
          else if (
            punchTime < shiftBreakStart
            // &&
            // punchTime > firstHalfLastTimeForEntry
          ) {
            // check the permissions for the mrng Late Entry
            console.log(
              "Comming for The late entry permissions check in 1st Half"
            );

            const lateEntryPermissionsExistfor1stHalf =
              await permissionRequestSchema.aggregate([
                {
                  $match: {
                    date: {
                      $gte: startOfDay,
                      $lte: endOfDay,
                    },
                  },
                },
                {
                  $lookup: {
                    from: "statustypes",
                    localField: "statusId",
                    foreignField: "_id",
                    as: "statusDetails",
                  },
                },
                {
                  $unwind: "$statusDetails",
                },
                {
                  $lookup: {
                    from: "permissiontypes",
                    localField: "permissionTypeId",
                    foreignField: "_id",
                    as: "permissionTypeInfo",
                  },
                },
                {
                  $unwind: "$permissionTypeInfo",
                },
                {
                  $match: {
                    employeeId: new ObjectId(employeeData.employeeId),
                    "statusDetails.statusType": "ACCEPTED",
                    "permissionTypeInfo.permissionType": "LATEIN",
                    isFirstHalf: true,
                  },
                },
                {
                  $project: {
                    totalHours: 1,
                  },
                },
              ]);

            const permissionMs =
              lateEntryPermissionsExistfor1stHalf[0]?.totalHours *
              60 *
              60 *
              1000;
            const permittedLastEntry = new Date(
              firstHalfLastTimeForEntry.getTime() + permissionMs
            );
            if (
              lateEntryPermissionsExistfor1stHalf &&
              lateEntryPermissionsExistfor1stHalf.length > 0 &&
              punchTime <= permittedLastEntry
            ) {
              console.log("Late entry permission granted for 1st half");
              // Grant attendance for the 1st half and make the intime as the shift Start time and afetrnoon as absent(by default) and add the permission Id
              const newDailyAttendencePunch = new dailyAttendanceSchema({
                orgId: employeeData.orgId,
                employeeId: employeeData.employeeId,
                shiftId: employeeData.shiftId,
                logInTime: shiftStartBase,
                statusId: secondHalfStatusId._id,
                permissionRequestId: lateEntryPermissionsExistfor1stHalf[0]._id,
                lateIn: true,
              });

              await newDailyAttendencePunch.save();
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with 2nd half ",
                secondHalfStatusId.shortName,
                " it is a 1st half permission one"
              );
            } else {
              console.log("Late entry permission denied for 1st half");
              // add the attendance record with 1st half absent and inTime as the punch Time  and afternoon absent (by default)
              const newDailyAttendencePunch = new dailyAttendanceSchema({
                orgId: employeeData.orgId,
                employeeId: employeeData.employeeId,
                shiftId: employeeData.shiftId,
                logInTime: punchTime,
                statusId: firstHalfStatusId._id,
                lateIn: true,
              });
              await newDailyAttendencePunch.save();
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with full day",
                firstHalfStatusId.shortName,
                " it is a 1st half invalid one"
              );
            }
          }

          // condition for login in 2nd half
          else if (
            punchTime > shiftBreakStart &&
            punchTime <= secondHalfLastTimeForEntry
          ) {
            // add the punch to the daily attendence with 2nd half present and 1st half absent
            const newDailyAttendencePunch = new dailyAttendanceSchema({
              orgId: employeeData.orgId,
              employeeId: employeeData.employeeId,
              shiftId: employeeData.shiftId,
              logInTime: punchTime,
              statusId: fullDayStatusId._id,
            });
            await newDailyAttendencePunch.save();
            console.log(
              "A new punch is created to the ",
              punchData.employeeCode,
              " at ",
              punchTime,
              " with full day",
              fullDayStatusId.shortName,
              " it is a 2nd half valid one"
            );
          }

          //condition for login in 2nd half with permission
          else if (punchTime > secondHalfLastTimeForEntry) {
            // check for the permissions

            const lateEntryPermissionsExistfor2ndHalf =
              await permissionRequestSchema.aggregate([
                {
                  $match: {
                    date: {
                      $gte: startOfDay,
                      $lte: endOfDay,
                    },
                  },
                },
                {
                  $lookup: {
                    from: "statustypes",
                    localField: "statusId",
                    foreignField: "_id",
                    as: "statusDetails",
                  },
                },
                {
                  $unwind: "$statusDetails",
                },
                {
                  $lookup: {
                    from: "permissiontypes",
                    localField: "permissionTypeId",
                    foreignField: "_id",
                    as: "permissionTypeInfo",
                  },
                },
                {
                  $unwind: "$permissionTypeInfo",
                },
                {
                  $match: {
                    employeeId: new ObjectId(employeeData.employeeId),
                    "statusDetails.statusType": "ACCEPTED",
                    "permissionTypeInfo.permissionType": "LATEIN",
                    isFirstHalf: false,
                  },
                },
                {
                  $project: {
                    totalHours: 1,
                  },
                },
              ]);
            const newDailyAttendancePunch = new dailyAttendanceSchema({
              orgId: employeeData.orgId,
              employeeId: employeeData.employeeId,
              shiftId: employeeData.shiftId,
              logInTime: punchTime,
              statusId: fullDayStatusId._id,
              lateIn: true,
            });

            const permissionMs =
              lateEntryPermissionsExistfor2ndHalf[0]?.totalHours *
              60 *
              60 *
              1000;
            const permittedStartEntry = new Date(
              secondHalfStartTimeForExit.getTime() + permissionMs
            );

            if (
              lateEntryPermissionsExistfor2ndHalf &&
              lateEntryPermissionsExistfor2ndHalf.length > 0 &&
              punchTime <= permittedStartEntry
            ) {
              // add the inTime as the shift breakTime and full day as absent
              newDailyAttendancePunch.logInTime = shiftBreakEnd;
              // newDailyAttendancePunch.logOutTime = secondHalfStartTimeForExit;
              newDailyAttendancePunch.permissions.push(
                lateEntryPermissionsExistfor2ndHalf[0]._id
              );
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with full day ",
                fullDayStatusId.shortName,
                " it is a 2nd half permission one"
              );
            } else {
              console.log(
                "A new punch is created to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with full day ",
                fullDayStatusId.shortName,
                " it is a 2nd half invalid one"
              );
            }
            await newDailyAttendancePunch.save();
          }
        }
        // This is the log Out Section
        // if (alreadyExists && alreadyExists[0] && (punchTime - alreadyExists[0].logInTime > 5 * 60 * 1000))
        else {
          console.log(
            "Processing log out for ",
            punchData.employeeCode,
            " at ",
            punchTime
          );

          // Find the existing attendance record for the employee
          const existingAttendance = await dailyAttendanceSchema.findOne({
            employeeId: employeeData.employeeId,
            shiftId: employeeData.shiftId,
            logInTime: { $gte: startOfDay, $lte: punchTime },
          });

          // console.log("Existing attendance found:", existingAttendance);
          // Determine the new status ID based on existing attendance
          // let newStatusId = presentStatusId._id;
          // if (existingAttendance && existingAttendance.statusId && existingAttendance.statusId.toString().equals(firstHalfStatusId._id.toString())) {
          //   console.log("Existing attendance found with first half status, don't change");
          //   newStatusId = firstHalfStatusId._id;
          // }
          // condition for logout in 1st half
          // console.log("Testing");
          if (
            punchTime < shiftBreakEnd &&
            punchTime > firstHalfStartTimeForExit
          ) {
            // console.log("Comming for logout in 1st half in Time");
            // update the logout with the punchTime
            // Find the existing attendance record for the employee
            existingAttendance.logOutTime = punchTime;
            existingAttendance.earlyOut &&
              (existingAttendance.earlyOut = false);
            // existingAttendance.statusId = newStatusId;
            await existingAttendance.save();
            console.log(
              "The punch is updated to the ",
              punchData.employeeCode,
              " at ",
              punchTime,
              " with no change ",
              " it is a 1st half valid out"
            );

            // console.log(
            //   "Updating log out time for existing attendance:",
            //   existingAttendance
            // );
          }
          // condition for logout in 1st half with permission
          else if (
            // punchTime < shiftBreakEnd &&
            punchTime < firstHalfStartTimeForExit &&
            punchTime > firstHalfLastTimeForEntry
          ) {
            // check for the permissions for the 1st half early out

            existingAttendance.earlyOut = true;

            const earlyOutPermissionsExistfor1stHalf =
              await permissionRequestSchema.aggregate([
                {
                  $match: {
                    date: {
                      $gte: startOfDay,
                      $lte: endOfDay,
                    },
                  },
                },
                {
                  $lookup: {
                    from: "statustypes",
                    localField: "statusId",
                    foreignField: "_id",
                    as: "statusDetails",
                  },
                },
                {
                  $unwind: "$statusDetails",
                },
                {
                  $lookup: {
                    from: "permissiontypes",
                    localField: "permissionTypeId",
                    foreignField: "_id",
                    as: "permissionTypeInfo",
                  },
                },
                {
                  $unwind: "$permissionTypeInfo",
                },
                {
                  $match: {
                    employeeId: new ObjectId(employeeData.employeeId),
                    "statusDetails.statusType": "ACCEPTED",
                    "permissionTypeInfo.permissionType": "EARLYOUT",
                    isFirstHalf: true,
                  },
                },
                {
                  $project: {
                    totalHours: 1,
                  },
                },
              ]);

            const permissionMs =
              earlyOutPermissionsExistfor1stHalf[0]?.totalHours *
              60 *
              60 *
              1000;
            const permittedStartExit = new Date(
              firstHalfStartTimeForExit.getTime() - permissionMs
            );

            if (
              earlyOutPermissionsExistfor1stHalf &&
              earlyOutPermissionsExistfor1stHalf.length > 0 &&
              punchTime >= permittedStartExit
            ) {
              // update the logout with the breakTime and add the permission request Id also
              existingAttendance.logOutTime = shiftBreakStart;
              existingAttendance.permissionRequestId =
                earlyOutPermissionsExistfor1stHalf[0]._id;
              await existingAttendance.save();
              console.log(
                "A punch is updated to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with no change",
                " it is a 1st half permission out"
              );
            } else {
              // update the logout time as punch Time make the 1st half as absent
              existingAttendance.logOutTime = punchTime;
              existingAttendance.statusId = fullDayStatusId._id;
              await existingAttendance.save();
              console.log(
                "A new punch is updated to the ",
                punchData.employeeCode,
                " at ",
                punchTime,
                " with full day",
                fullDayStatusId.shortName,
                " it is a 1st half invalid out"
              );
            }
          }

          // condition for logout in 2nd half
          else if (
            punchTime > shiftBreakEnd &&
            punchTime >= secondHalfStartTimeForExit
          ) {
            // update the logout time with punch time and make the 2nd half as the present
            existingAttendance.logOutTime = punchTime;
            existingAttendance.earlyOut &&
              (existingAttendance.earlyOut = false);

            if (
              existingAttendance.statusId.toString() !==
              presentStatusId._id.toString()
            ) {
              if (
                existingAttendance.statusId.toString() ===
                secondHalfStatusId._id.toString()
              ) {
                existingAttendance.statusId = presentStatusId._id;
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with status present",
                  presentStatusId.shortName,
                  " it is a 2nd half valid out"
                );
              } else {
                if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
                  existingAttendance.statusId = fullDayStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FULLDAY ",
                    fullDayStatusId.shortName,
                    " it is a 2nd half invalid out"
                  );
                } else {
                  existingAttendance.statusId = firstHalfStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FIRST HALF ",
                    firstHalfStatusId.shortName,
                    " it is a 2nd half valid out, but mrng Abscent"
                  );
                }
              }
            }
            await existingAttendance.save();
          }

          // condition for logout in 2nd half with permission
          else if (
            // punchTime > shiftBreakEnd &&
            punchTime > secondHalfLastTimeForEntry &&
            punchTime < secondHalfStartTimeForExit
          ) {
            // check for the permissions
            console.log("Checking for early out permissions");
            // console.log(" Punch Time ",punchTime, " secondHalfLastTimeForEntry ",secondHalfLastTimeForEntry," secondHalfStartTimeForExit ", secondHalfStartTimeForExit);

            existingAttendance.earlyOut = true;
            const earlyOutPermissionsExistfor2ndHalf =
              await permissionRequestSchema.aggregate([
                {
                  $match: {
                    date: {
                      $gte: startOfDay,
                      $lte: endOfDay,
                    },
                  },
                },
                {
                  $lookup: {
                    from: "statustypes",
                    localField: "statusId",
                    foreignField: "_id",
                    as: "statusDetails",
                  },
                },
                {
                  $unwind: "$statusDetails",
                },
                {
                  $lookup: {
                    from: "permissiontypes",
                    localField: "permissionTypeId",
                    foreignField: "_id",
                    as: "permissionTypeInfo",
                  },
                },
                {
                  $unwind: "$permissionTypeInfo",
                },
                {
                  $match: {
                    employeeId: new ObjectId(employeeData.employeeId),
                    "statusDetails.statusType": "ACCEPTED",
                    "permissionTypeInfo.permissionType": "EARLYOUT",
                    isFirstHalf: false,
                  },
                },
                {
                  $project: {
                    totalHours: 1,
                  },
                },
              ]);

            const permissionMs =
              earlyOutPermissionsExistfor2ndHalf[0]?.totalHours *
              60 *
              60 *
              1000;
            const permittedStartEntry = new Date(
              secondHalfStartTimeForExit.getTime() - permissionMs
            );

            if (
              earlyOutPermissionsExistfor2ndHalf &&
              earlyOutPermissionsExistfor2ndHalf.length > 0 &&
              punchTime >= permittedStartEntry
            ) {
              // update the logout with the shiftEnd time and add the permission request Id also and make the 2nd half as the present
              existingAttendance.logOutTime = shiftEndBase;
              existingAttendance.permissionRequestId =
                earlyOutPermissionsExistfor2ndHalf[0]._id;
              if (
                existingAttendance.statusId.toString() ===
                secondHalfStatusId._id.toString()
              ) {
                existingAttendance.statusId = presentStatusId._id;
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with status present",
                  presentStatusId.shortName,
                  " it is a 2nd half permission out"
                );
              } else {
                if (existingAttendance.inTime > secondHalfLastTimeForEntry) {
                  existingAttendance.statusId = fullDayStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FULLDAY ",
                    fullDayStatusId.shortName,
                    " it is a 2nd half invalid ans no permission out"
                  );
                } else {
                  existingAttendance.statusId = firstHalfStatusId._id;
                  console.log(
                    "A punch is updated to the ",
                    punchData.employeeCode,
                    " at ",
                    punchTime,
                    " with status FIRST HALF ",
                    firstHalfStatusId.shortName,
                    " it is a 2nd half permission out, but mrng Abscent"
                  );
                }
              }
            } else {
              // just update the logout time with punch time
              existingAttendance.logOutTime = punchTime;
              if (
                existingAttendance.statusId.toString() ===
                secondHalfStatusId._id.toString()
              ) {
                existingAttendance.statusId = secondHalfStatusId._id;
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with status SECOND HALF ",
                  secondHalfStatusId.shortName,
                  " it is a 2nd half valid out"
                );
              } else {
                // if(existingAttendance.inTime > secondHalfLastTimeForEntry){
                //   existingAttendance.statusId = fullDayStatusId._id;
                // }
                // else{
                //   existingAttendance.statusId = firstHalfStatusId._id;
                // }
                existingAttendance.statusId = fullDayStatusId._id;
                console.log(
                  "A punch is updated to the ",
                  punchData.employeeCode,
                  " at ",
                  punchTime,
                  " with status FULLDAY ",
                  fullDayStatusId.shortName,
                  " it is a 2nd half invalid out "
                );
              }
              await existingAttendance.save();
            }
          }
        }
        // }
        // else{

        //   console.log("This is out of Shift");
        // }
      } catch (error) {
        console.log("This is the error", error);
        console.error("Error fetching attendance punches:", error.message);
      }
    }
  } catch (error) {
    console.log("This is the error", error);
    console.error("Error fetching attendance punches:", error.message);
  }
};

// Fetch attendance logs from the external API and Dump to DB
// const getAttendancePunchess = async () => {
//   try {
//     const { data } = await axios.get("http://node.technicalhub.io:4001/api/get-attendancelogs");

//     const uniqueEmployeeCodes = [...new Set(data.map(punch => punch.after.EmployeeCode))];
//     const employees = await employeeSchema.find({
//       employeeCode: { $in: uniqueEmployeeCodes }
//     }).lean();

//     const employeeMap = new Map();
//     employees.forEach(emp => {
//       employeeMap.set(emp.employeeCode, emp);
//     });

//     const attendanceData = (await Promise.all(
//       data.map(async (punch) => {
//         const employee = employeeMap.get(punch.after.EmployeeCode);
//         if (!employee) return null;

//         return {
//           employeeId: employeeData._id,
//           employeeCode: punch.after.EmployeeCode,
//           punchTime: changeGTMtoIST(new Date(punch.after.timestamp)),
//           source: "FRS",
//           sourceId: punch.after.Serialnumber,
//         };
//       })
//     )).filter(Boolean);

//     for (const punch of attendanceData) {
//       const punchDate = new Date(punch.punchTime);

//       const startOfDay = new Date(punchDate);
//       startOfDay.setUTCHours(0, 0, 0, 0);

//       const endOfDay = new Date(punchDate);
//       endOfDay.setUTCHours(23, 59, 59, 999);

//       const alreadyExists = await attendancePunchesSchema.findOne({
//         employeeId: new ObjectId(punch.employeeId),
//         sourceId: punch.sourceId,
//         inTime: { $gte: startOfDay, $lte: endOfDay },
//       }).lean();

//       if (!alreadyExists) {
//         await addAttendancePunchsToDB(punch);
//       } else {
//         if (!alreadyExists.outTime || punch.punchTime > alreadyExists.outTime) {
//           await attendencePunchesSchema.updateOne(
//             { _id: alreadyExists._id },
//             {
//               $set: {
//                 outTime: punch.punchTime,
//                 updatedAt: getISTDateAndTime()
//               }
//             }
//           );
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching attendance punches:", error.message);
//   }
// };

// const getEmployeeAttendance = async (req, res) => {
//   try {
//     const employeeId = req.user._id;
//     const orgId = req.user.orgId;
//     const { fromDate, toDate } = req.body;

//     if (!employeeId) {
//       return res.status(400).json({ error: "Employee ID is required" });
//     }
//     if (!fromDate || !toDate) {
//       return res.status(400).json({ error: "Required date range is missing" });
//     }

//     const fromDateStart = new Date(fromDate);
//     fromDateStart.setUTCHours(0, 0, 0, 0);
//     const toDateEnd = new Date(toDate);
//     toDateEnd.setUTCHours(23, 59, 59, 999);

//     if (fromDateStart > toDateEnd) {
//       return res.status(400).json({ error: "Invalid date range" });
//     }

//     /** ---------------- Attendance ---------------- */
//     const attendanceRecords = await dailyAttendanceSchema.aggregate([
//       {
//         $match: {
//           employeeId: new ObjectId(employeeId),
//           logInTime: { $gte: fromDateStart, $lte: toDateEnd },
//         },
//       },
//       {
//         $lookup: {
//           from: "attendencestatustypes",
//           localField: "statusId",
//           foreignField: "_id",
//           as: "statusInfo",
//         },
//       },
//       { $unwind: "$statusInfo" },
//       {
//         $lookup: {
//           from: "employees",
//           localField: "employeeId",
//           foreignField: "_id",
//           as: "employeeInfo",
//         },
//       },
//       { $unwind: "$employeeInfo" },
//       {
//         $project: {
//           date: "$logInTime",
//           logInTime: 1,
//           logOutTime: 1,
//           lateIn: 1,
//           earlyOut: 1,
//           employeeName: {
//             $concat: ["$employeeInfo.firstName", " ", "$employeeInfo.lastName"],
//           },
//           status: "$statusInfo.name",
//           shortCode: "$statusInfo.shortName",
//           type: { $literal: "Attendance" },
//         },
//       },
//     ]);

//     /** ---------------- Holidays ---------------- */
//     const holidays = await holidaysSchema.aggregate([
//       {
//         $match: {
//           orgId: new ObjectId(orgId),
//           fromDate: { $lte: toDateEnd },
//           toDate: { $gte: fromDateStart },
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           dates: {
//             $map: {
//               input: {
//                 $range: [
//                   0,
//                   {
//                     $add: [
//                       {
//                         $toInt: {
//                           $divide: [
//                             { $subtract: ["$toDate", "$fromDate"] },
//                             86400000,
//                           ],
//                         },
//                       },
//                       1,
//                     ],
//                   },
//                 ],
//               },
//               as: "i",
//               in: {
//                 $dateToString: {
//                   format: "%Y-%m-%d",
//                   date: {
//                     $add: ["$fromDate", { $multiply: ["$$i", 86400000] }],
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           dates: {
//             $filter: {
//               input: "$dates",
//               as: "d",
//               cond: {
//                 $and: [
//                   {
//                     $gte: [
//                       "$$d",
//                       {
//                         $dateToString: {
//                           format: "%Y-%m-%d",
//                           date: fromDateStart,
//                         },
//                       },
//                     ],
//                   },
//                   {
//                     $lte: [
//                       "$$d",
//                       {
//                         $dateToString: { format: "%Y-%m-%d", date: toDateEnd },
//                       },
//                     ],
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       { $unwind: "$dates" },
//       {
//         $project: {
//           name: 1,
//           date: "$dates",
//           status: "HOLIDAY",
//           shortCode: "H",
//           type: { $literal: "Holiday" },
//         },
//       },
//     ]);

//     /** ---------------- Sundays ---------------- */
//     const sundays = [];
//     let d = new Date(fromDateStart);
//     while (d <= toDateEnd) {
//       if (d.getDay() === 0) {
//         sundays.push({
//           date: d.toISOString().split("T")[0],
//           name: "SUNDAY",
//           status: "WEEK OFF",
//           shortCode: "WO",
//           type: "Sunday",
//         });
//       }
//       d.setDate(d.getDate() + 1);
//     }

//     /** ---------------- Accepted Status ---------------- */
//     const acceptedStatus = await statusSchema.findOne({
//       orgId: new ObjectId(orgId),
//       statusType: "ACCEPTED",
//     });

//     /** ---------------- Leaves ---------------- */
//   const expandedLeaves = await leaveRequestSchema.aggregate([
//   {
//     $match: {
//       employeeId: new ObjectId(employeeId),
//       startDate: { $lte: toDateEnd },
//       endDate: { $gte: fromDateStart },
//       statusId: acceptedStatus?._id,
//     },
//   },
//   {
//     $lookup: {
//       from: "leavetypes",
//       localField: "leaveTypeId",
//       foreignField: "_id",
//       as: "leaveTypeDetails",
//     },
//   },
//   { $unwind: "$leaveTypeDetails" },
//   {
//     $project: {
//       leaveReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       leaveType: "$leaveTypeDetails.leaveType",
//       shortCode: "$leaveTypeDetails.shortCode",
//       startDate: 1,
//       endDate: 1,
//     },
//   },
//   {
//     $project: {
//       leaveReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       leaveType: 1,
//       shortCode: 1,
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
//                         { $subtract: ["$endDate", "$startDate"] },
//                         86400000
//                       ]
//                     }
//                   },
//                   1
//                 ]
//               }
//             ]
//           },
//           as: "i",
//           in: {
//             $dateToString: {
//               format: "%Y-%m-%d",
//               date: { $add: ["$startDate", { $multiply: ["$$i", 86400000] }] }
//             }
//           }
//         }
//       }
//     }
//   },
//   { $unwind: "$dates" },
//   {
//     $project: {
//       date: "$dates",
//       leaveReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       leaveType: 1,
//       shortCode: 1,
//       status: { $literal: "ON LEAVE" },
//       type: { $literal: "Leave" },
//     },
//   },
// ]);

//     /** ---------------- WFH ---------------- */
//    const expandedWfhRequests = await workFromHomeSchema.aggregate([
//   {
//     $match: {
//       employeeId: new ObjectId(employeeId),
//       startDate: { $lte: toDateEnd },
//       endDate: { $gte: fromDateStart },
//       statusId: acceptedStatus?._id,
//     },
//   },
//   {
//     $project: {
//       wfhReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       startDate: 1,
//       endDate: 1,
//       shortCode: { $literal: "WFH" },
//     },
//   },
//   {
//     $project: {
//       wfhReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       shortCode: 1,
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
//                         { $subtract: ["$endDate", "$startDate"] },
//                         86400000
//                       ]
//                     }
//                   },
//                   1
//                 ]
//               }
//             ]
//           },
//           as: "i",
//           in: {
//             $dateToString: {
//               format: "%Y-%m-%d",
//               date: { $add: ["$startDate", { $multiply: ["$$i", 86400000] }] }
//             }
//           }
//         }
//       }
//     }
//   },
//   { $unwind: "$dates" },
//   {
//     $project: {
//       date: "$dates",
//       wfhReason: 1,
//       isHalfDay: 1,
//       halfDayPeriod: 1,
//       shortCode: 1,
//       status: { $literal: "ON WFH" },
//       type: { $literal: "WFH" },
//     },
//   },
// ]);

//     /** ---------------- Merge All ---------------- */
//     const dateMap = new Map();

//     // Attendance
//     for (const record of attendanceRecords) {
//       const key = record.date.toISOString().split("T")[0];
//       dateMap.set(key, { ...record, date: key });
//     }

//     // Leaves
//     for (const leave of expandedLeaves) {
//       if (!dateMap.has(leave.date)) {
//         dateMap.set(leave.date, leave);
//       }
//     }

//     // WFH
//     for (const wfh of expandedWfhRequests) {
//       if (!dateMap.has(wfh.date)) {
//         dateMap.set(wfh.date, wfh);
//       }
//     }

//     // Holidays
//     for (const holiday of holidays) {
//       if (!dateMap.has(holiday.date)) {
//         dateMap.set(holiday.date, holiday);
//       }
//     }

//     // Sundays
//     for (const sunday of sundays) {
//       if (!dateMap.has(sunday.date)) {
//         dateMap.set(sunday.date, sunday);
//       }
//     }

//     // Fill absent
//     let currentDay = new Date(fromDateStart);
//     while (currentDay <= toDateEnd) {
//       const key = currentDay.toISOString().split("T")[0];
//       if (!dateMap.has(key)) {
//         dateMap.set(key, {
//           date: key,
//           status: "ABSENT",
//           shortCode: "AB",
//           type: "Absent",
//         });
//       }
//       currentDay.setDate(currentDay.getDate() + 1);
//     }

//     const allRecords = Array.from(dateMap.values()).sort(
//       (a, b) => new Date(a.date) - new Date(b.date)
//     );

//     res.status(200).json({
//       message:
//         "Attendance, holidays, Sundays, leaves, WFH, and absents fetched successfully",
//       data: allRecords,
//     });
//   } catch (error) {
//     console.error("Error fetching employee attendance:", error);
//     res.status(500).json({
//       message: "Error while fetching employee attendance",
//       error: error.message,
//     });
//   }
// };

const getEmployeeAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const orgId = req.user.orgId;
    const { fromDate, toDate } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    console.log("From data and to date", fromDate, toDate);

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    console.log("From date Start and to date end", fromDateStart, toDateEnd);

    if (fromDateStart > toDateEnd) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const sundays = [];
    let d = new Date(fromDateStart);
    while (d <= toDateEnd) {
      if (d.getDay() === 0) {
        sundays.push({
          date: d.toISOString().split("T")[0],
          name: "SUNDAY",
          status: "WEEK OFF",
          shortCode: "WO",
          type: "Sunday",
        });
      }
      d.setDate(d.getDate() + 1);
    }

    const [attendanceRecords, holidays, acceptedStatus] = await Promise.all([
      // Attendance
      dailyAttendanceSchema.aggregate([
        {
          $match: {
            employeeId: new ObjectId(employeeId),
            $or: [
              { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
              { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
            ],
          },
        },

        {
          $lookup: {
            from: "attendencestatustypes",
            localField: "statusId",
            foreignField: "_id",
            as: "statusInfo",
          },
        },
        { $unwind: "$statusInfo" },
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
            from: "thumbrequests",
            localField: "thumbId",
            foreignField: "_id",
            as: "thumbInfo",
          },
        },
        {
          $unwind: {
            path: "$thumbInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            permissionId: { $first: "$permissions" },
          },
        },
        {
          $lookup: {
            from: "permissionrequests",
            localField: "permissionId",
            foreignField: "_id",
            as: "permissionInfo",
          },
        },
        {
          $unwind: {
            path: "$permissionInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            permissionPeriod: {
              $cond: {
                if: {
                  $eq: ["$permissionsInfo.isFirstHalf", true],
                },
                then: "IN",
                else: "OUT",
              },
            },
          },
        },
        {
          $project: {
            date: {
              $ifNull: ["$logInTime", "$logOutTime"],
            },
            logInTime: 1,
            logOutTime: 1,
            lateIn: 1,
            earlyOut: 1,
            employeeName: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
            status: "$statusInfo.name",
            thumbPeriod: "$thumbInfo.punchType",
            permissionPeriod: 1,
            shortCode: "$statusInfo.shortName",
            type: { $literal: "Attendance" },
          },
        },
      ]),

      // Holidays
      await holidaysSchema.aggregate([
        {
          $match: {
            orgId: new ObjectId(orgId),
            fromDate: { $lte: toDateEnd },
            toDate: { $gte: fromDateStart },
          },
        },
        {
          $project: {
            name: 1,
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
        {
          $project: {
            name: 1,
            dates: {
              $filter: {
                input: "$dates",
                as: "d",
                cond: {
                  $and: [
                    {
                      $gte: [
                        "$$d",
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: fromDateStart,
                          },
                        },
                      ],
                    },
                    {
                      $lte: [
                        "$$d",
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: toDateEnd,
                          },
                        },
                      ],
                    },
                  ],
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
            status: "HOLIDAY",
            shortCode: "H",
            type: { $literal: "Holiday" },
          },
        },
      ]),

      // Accepted Status
      statusSchema.findOne({
        orgId: new ObjectId(orgId),
        statusType: "ACCEPTED",
      }),
    ]);

    // console.log("attendance", attendanceRecords);

    const [expandedLeaves, expandedWfhRequests] = await Promise.all([
      // Leaves
      leaveRequestSchema.aggregate([
        {
          $match: {
            employeeId: new ObjectId(employeeId),
            startDate: { $lte: toDateEnd },
            endDate: { $gte: fromDateStart },
            statusId: acceptedStatus?._id,
          },
        },
        {
          $lookup: {
            from: "leavetypes",
            localField: "leaveTypeId",
            foreignField: "_id",
            as: "leaveTypeDetails",
          },
        },
        { $unwind: "$leaveTypeDetails" },
        {
          $project: {
            leaveReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            leaveType: "$leaveTypeDetails.leaveType",
            shortCode: "$leaveTypeDetails.shortCode",
            startDate: 1,
            endDate: 1,
          },
        },
        {
          $project: {
            leaveReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            leaveType: 1,
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
                              { $subtract: ["$endDate", "$startDate"] },
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
                      $add: ["$startDate", { $multiply: ["$$i", 86400000] }],
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
            date: "$dates",
            leaveReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            leaveType: 1,
            shortCode: 1,
            status: { $literal: "ON LEAVE" },
            type: { $literal: "Leave" },
          },
        },
      ]),

      // WFH
      workFromHomeSchema.aggregate([
        {
          $match: {
            employeeId: new ObjectId(employeeId),
            startDate: { $lte: toDateEnd },
            endDate: { $gte: fromDateStart },
            statusId: acceptedStatus?._id,
          },
        },
        {
          $project: {
            wfhReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            startDate: 1,
            endDate: 1,
            shortCode: { $literal: "WFH" },
          },
        },
        {
          $project: {
            wfhReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
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
                              { $subtract: ["$endDate", "$startDate"] },
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
                      $add: ["$startDate", { $multiply: ["$$i", 86400000] }],
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
            date: "$dates",
            wfhReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            shortCode: 1,
            status: { $literal: "WORK FROM HOME" },
            type: { $literal: "WFH" },
          },
        },
      ]),
    ]);

    const dateMap = new Map();

    [
      ...attendanceRecords,
      ...expandedLeaves,
      ...expandedWfhRequests,
      ...holidays,
      ...sundays,
    ].forEach((record) => {
      // console.log("Record Date", record.date);
      const key =
        record.date instanceof Date
          ? record.date.toISOString().split("T")[0]
          : record.date;
      // console.log(key);
      // if(key === "2025-09-10"){
      //   console.log("Key is 2025-09-10");
      //   dateMap.get(key);
      // }
      if (!dateMap.has(key)) {
        dateMap.set(key, { ...record, date: key });
      }
    });

    let currentDay = new Date(fromDateStart);
    while (currentDay <= toDateEnd) {
      const key = currentDay.toISOString().split("T")[0];

      if (!dateMap.has(key)) {
        dateMap.set(key, {
          date: key,
          status: "ABSENT",
          shortCode: "AB",
          type: "Absent",
        });
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const allRecords = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      message:
        "Attendance, holidays, Sundays, leaves, WFH, and absents fetched successfully",
      data: allRecords,
    });
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    res.status(500).json({
      message: "Error while fetching employee attendance",
      error: error.message,
    });
  }
};

// const getAllEmployeeAttendence = async (req, res) => {
//   try {
//     const { fromDate, toDate, statusId, employeeId, teamId, roleId } = req.body;
//     const orgId = req?.user?.orgId;
//     // console.log("from Date", fromDate, " toDate ", toDate);

//     // Validate input
//     if (!orgId) {
//       return res.status(400).json({ error: "Organization ID is required" });
//     }

//     // Validate date range
//     if (!fromDate || !toDate) {
//       return res.status(400).json({ error: "Required date range is missing" });
//     }

//     const fromDateStart = new Date(fromDate);
//     fromDateStart.setUTCHours(0, 0, 0, 0);

//     const toDateEnd = new Date(toDate);
//     toDateEnd.setUTCHours(23, 59, 59, 999);
//     // console.log("from Date Start", fromDateStart, " toDate End ", toDateEnd);

//     // console.log(fromDateStart, toDateEnd, req.user.firstName);
//     // Ensure toDateEnd is set to 23:59:59.999 in IST (Indian Standard Time)
//     // toDateEnd.setTime(toDateEnd.getTime());

//     if (fromDateStart > toDateEnd) {
//       return res.status(400).json({ error: "Invalid date range" });
//     }

//     const matchStage1 = {
//       logInTime: {
//         $gte: fromDateStart,
//         $lte: toDateEnd,
//       },
//     };

//     const matchStage2 = {
//       "employeeInfo.orgId": orgId,
//     };

//     const [adminId, generalId] = await privilegeSchema
//       .find({ orgId: orgId, name: { $in: ["ADMIN", "GENERAL"] } })
//       .select("_id name");

//     if (generalId._id.toString() === req?.user?.privilegeId.toString()) {
//       return res
//         .status(403)
//         .json({ error: "You are not authorized to access this data" });
//     }

//     const privilegeId = req?.user?.privilegeId;
//     // console.log("Admin Id", adminId, " Privilege Id ", privilegeId);
//     // console.log("User Info", req?.user);

//     if (adminId._id.toString() === privilegeId.toString()) {
//       if (req?.user?.teamId) {
//         matchStage2["employeeInfo.teamId"] = new ObjectId(req?.user?.teamId);
//       } else {
//         return res.status(200).json({
//           message: "You dont have any team to get Data",
//           "No.of Records": 0,
//         });
//       }
//       // console.log("This is the Team Id", req?.user?.teamId);
//       matchStage2["employeeInfo.teamId"] = new ObjectId(req?.user?.teamId);
//     }

//     if (statusId) {
//       const statusData = await attendenceStatusTypesSchema.findOne({
//         _id: new ObjectId(statusId),
//       });

//       if (!statusData) {
//         return res.status(404).json({ error: "Status not found" });
//       }

//       matchStage2.statusId = new ObjectId(statusId);
//     }

//     if (employeeId) {
//       const employeeData = await employeeSchema.findOne({
//         _id: new ObjectId(employeeId),
//       });

//       if (!employeeData) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       matchStage2["employeeInfo._id"] = new ObjectId(employeeId);
//     }

//     if (teamId) {
//       const teamData = await teamSchema.findOne({
//         _id: new ObjectId(teamId),
//       });

//       if (!teamData) {
//         return res.status(404).json({ error: "Team not found" });
//       }

//       matchStage2["employeeInfo.teamId"] = new ObjectId(teamId);
//     }

//     if (roleId) {
//       const roleData = await rolesSchema.findOne({
//         _id: new ObjectId(roleId),
//       });

//       if (!roleData) {
//         return res.status(404).json({ error: "Role not found" });
//       }

//       matchStage2["employeeInfo.roleId"] = new ObjectId(roleId);
//     }

//     const attendenceData = await dailyAttendanceSchema.aggregate([
//       {
//         $match: matchStage1,
//       },
//       {
//         $lookup: {
//           from: "attendencestatustypes",
//           localField: "statusId",
//           foreignField: "_id",
//           as: "statusInfo",
//         },
//       },
//       {
//         $unwind: "$statusInfo",
//       },
//       {
//         $lookup: {
//           from: "employees",
//           localField: "employeeId",
//           foreignField: "_id",
//           as: "employeeInfo",
//         },
//       },
//       {
//         $unwind: "$employeeInfo",
//       },
//       {
//         $lookup: {
//           from: "roles",
//           localField: "employeeInfo.roleId",
//           foreignField: "_id",
//           as: "roleInfo",
//         },
//       },
//       {
//         $unwind: "$roleInfo",
//       },
//       {
//         $match: matchStage2,
//       },
//       {
//         $project: {
//           logInTime: 1,
//           logOutTime: 1,
//           lateIn: 1,
//           earlyOut: 1,
//           totalHours: 1,
//           halfDay: 1,
//           // isFinalized: 1,
//           finalizedAt: 1,
//           employeeName: {
//             $concat: ["$employeeInfo.firstName", " ", "$employeeInfo.lastName"],
//           },
//           role: "$roleInfo.name",

//           status: "$statusInfo.name",
//         },
//       },
//     ]);

//     //  console.log("This is comming..")
//     // console.log(matchStage1, matchStage2);

//     return res.status(200).json({
//       message: "All Employee Attendance fetched successfully",
//       "No.of Records": attendenceData.length,
//       data: attendenceData,
//     });
//   } catch (error) {
//     console.log("Error While getting the All Employee Attendence", error);
//     return res.status(500).json({
//       message:
//         "Internal Server Error WHile getting the All Employee Attendence",
//       error: error.message,
//     });
//   }
// };

const getAllEmployeeAttendence = async (req, res) => {
  try {
    const { fromDate, toDate, statusId, employeeId, teamId, roleId } = req.body;
    const orgId = req?.user?.orgId;

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    if (fromDateStart > toDateEnd) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    // Match stage for attendance
    const matchStage1 = {
      $or: [
        { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
        { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
      ],
    };

    const matchStage2 = { "employeeInfo.orgId": orgId };

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

    const [
      absentStatusId,
      presentStatusId,
      fullDayStatusId,
      secondHalfStatusId,
      firstHalfStatusId,
    ] = await Promise.all([
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "AB" },
        { _id: 1 }
      ),
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "P" },
        { _id: 1 }
      ),
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "FD" },
        { _id: 1 }
      ),
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "SH" },
        { _id: 1 }
      ),
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "FH" },
        { _id: 1 }
      ),
      attendenceStatusTypesSchema.findOne(
        { orgId: new ObjectId(orgId), shortName: "WFH" },
        { _id: 1 }
      ),
    ]);

    if (
      !absentStatusId ||
      !presentStatusId ||
      !fullDayStatusId ||
      !secondHalfStatusId ||
      !firstHalfStatusId
    ) {
      return res
        .status(400)
        .json({ error: "One or more attendance status not found" });
    }
    // console.log("Absent Status Id", absentStatusId);

    // if (statusId && statusId.toString() !== absentStatusId._id.toString()) {
    //   matchStage2.statusId = new ObjectId(statusId);
    // }
    if (employeeId) {
      const employee = await employeeSchema.findOne(
        { _id: new ObjectId(employeeId) },
        { teamId: 1 }
      );
      if (!employee) {
        return res.status(400).json({ message: "Empoyee not found" });
      }

      if (req?.user?.teamId) {
        if (req?.user?.teamId !== employee.teamId.toString()) {
          return res
            .status(403)
            .json({ error: "You are not authorized to access this data" });
        }
      }

      if (
        privilegeId.toString() !== superAdminDoc._id.toString() &&
        req?.user?.teamId?.toString() !== employee.teamId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "You are not authorized to access this data" });
      }

      matchStage2["employeeInfo._id"] = new ObjectId(employeeId);
    }
    if (teamId) {
      if (req?.user?.teamId) {
        // console.log("USER", req.user);
        // console.log("Team", teamId, typeof teamId);
        // console.log("User Team", req.user.teamId, typeof req.user.teamId);
        // console.log("check", req.user.teamId.toString() === teamId.toString());
        if (
          req?.user?.teamId.toString() !== teamId.toString() &&
          req?.user?.privilegeId.toString() !== superAdminDoc._id.toString()
        ) {
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

    const [attendanceRecords, holidays, acceptedStatus] = await Promise.all([
      // Attendence
      dailyAttendanceSchema.aggregate([
        { $match: matchStage1 },

        {
          $lookup: {
            from: "attendencestatustypes",
            localField: "statusId",
            foreignField: "_id",
            as: "statusInfo",
          },
        },
        { $unwind: "$statusInfo" },
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
            from: "roles",
            localField: "employeeInfo.roleId",
            foreignField: "_id",
            as: "roleInfo",
          },
        },
        { $unwind: "$roleInfo" },
        {
          $lookup: {
            from: "thumbrequests",
            localField: "thumbId",
            foreignField: "_id",
            as: "thumbInfo",
          },
        },
        {
          $unwind: {
            path: "$thumbInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            permissionId: { $first: "$permissions" },
          },
        },
        {
          $lookup: {
            from: "permissionrequests",
            localField: "permissionId",
            foreignField: "_id",
            as: "permissionInfo",
          },
        },
        {
          $unwind: {
            path: "$permissionInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            permissionPeriod: {
              $cond: {
                if: {
                  $eq: ["$permissionsInfo.isFirstHalf", true],
                },
                then: "IN",
                else: "OUT",
              },
            },
          },
        },
        { $match: matchStage2 },
        {
          $project: {
            date: {
              $ifNull: ["$logInTime", "$logOutTime"],
            },
            logInTime: 1,
            logOutTime: 1,
            lateIn: 1,
            earlyOut: 1,
            totalHours: 1,
            halfDay: 1,
            finalizedAt: 1,
            employeeName: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
            role: "$roleInfo.name",
            employeeId: "$employeeInfo._id",
            status: "$statusInfo.name",
            thumbPeriod: "$thumbInfo.punchType",
            permissionPeriod: 1,
            shortCode: "$statusInfo.shortName",
            type: { $literal: "Attendance" },
          },
        },
      ]),

      // Holidays
      holidaysSchema.aggregate([
        {
          $match: {
            orgId: new ObjectId(orgId),
            fromDate: { $lte: toDateEnd },
            toDate: { $gte: fromDateStart },
          },
        },
        {
          $project: {
            name: 1,
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
        {
          $project: {
            name: 1,
            dates: {
              $filter: {
                input: "$dates",
                as: "d",
                cond: {
                  $and: [
                    {
                      $gte: [
                        "$$d",
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: fromDateStart,
                          },
                        },
                      ],
                    },
                    {
                      $lte: [
                        "$$d",
                        {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: toDateEnd,
                          },
                        },
                      ],
                    },
                  ],
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
            status: "HOLIDAY",
            shortCode: "H",
            type: { $literal: "Holiday" },
          },
        },
      ]),

      // Accept Status
      statusSchema.findOne({
        orgId: new ObjectId(orgId),
        statusType: "ACCEPTED",
      }),
    ]);

    // Fetch Sundays
    const sundays = [];
    let d = new Date(fromDateStart);
    while (d <= toDateEnd) {
      if (d.getDay() === 0) {
        sundays.push({
          date: d.toISOString().split("T")[0],
          name: "SUNDAY",
          status: "WEEK OFF",
          shortCode: "WO",
          type: "Sunday",
        });
      }
      d.setDate(d.getDate() + 1);
    }

    const [leavesRequests, wfhRequests] = await Promise.all([
      // Leaves
      leaveRequestSchema.aggregate([
        {
          $match: {
            startDate: { $lte: toDateEnd },
            endDate: { $gte: fromDateStart },
            statusId: acceptedStatus?._id,
            orgId: new ObjectId(orgId),
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
            from: "roles",
            localField: "employeeInfo.roleId",
            foreignField: "_id",
            as: "roleInfo",
          },
        },
        { $unwind: "$roleInfo" },
        {
          $match: matchStage2,
        },
        {
          $lookup: {
            from: "leavetypes",
            localField: "leaveTypeId",
            foreignField: "_id",
            as: "leaveTypeDetails",
          },
        },
        {
          $unwind: {
            path: "$leaveTypeDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            startDate: 1,
            endDate: 1,
            leaveReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            employeeId: "$employeeInfo._id",

            employeeCode: "$employeeInfo.employeeCode",
            employeeName: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
            role: "$roleInfo.name",
            status: { $literal: "ON LEAVE" },
            leaveType: "$leaveTypeDetails.leaveType",
            shortCode: "$leaveTypeDetails.shortCode",
            type: { $literal: "Leave" },
          },
        },
      ]),

      // Work From Home
      workFromHomeSchema.aggregate([
        {
          $match: {
            startDate: { $lte: toDateEnd },
            endDate: { $gte: fromDateStart },
            statusId: acceptedStatus?._id,
            orgId: new ObjectId(orgId),
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
            from: "roles",
            localField: "employeeInfo.roleId",
            foreignField: "_id",
            as: "roleInfo",
          },
        },
        { $unwind: "$roleInfo" },
        {
          $match: matchStage2,
        },
        {
          $project: {
            startDate: 1,
            endDate: 1,
            wfhReason: 1,
            isHalfDay: 1,
            halfDayPeriod: 1,
            role: "$roleInfo.name",
            employeeId: "$employeeInfo._id",

            employeeCode: "$employeeInfo.employeeCode",
            employeeName: {
              $concat: [
                "$employeeInfo.firstName",
                " ",
                "$employeeInfo.lastName",
              ],
            },
            status: { $literal: "WORK FROM HOME" },
            shortCode: "WFH",
            type: { $literal: "WFH" },
          },
        },
      ]),
    ]);

    const expandedLeaves = [];
    for (const leave of leavesRequests) {
      let current = new Date(leave.startDate);
      while (current <= leave.endDate) {
        expandedLeaves.push({
          date: current.toISOString().split("T")[0],
          leaveReason: leave.leaveReason,
          isHalfDay: leave.isHalfDay,
          halfDayPeriod: leave.halfDayPeriod,
          leaveType: leave.leaveType,
          shortCode: leave.shortCode,
          status: leave.status,
          role: leave.role,
          employeeName: leave.employeeName,
          employeeCode: leave.employeeCode,
          employeeId: leave.employeeId,

          type: leave.type,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    const expandedwfhs = [];
    for (const wfh of wfhRequests) {
      let current = new Date(wfh.startDate);
      while (current <= wfh.endDate) {
        expandedwfhs.push({
          date: current.toISOString().split("T")[0],
          wfhReason: wfh.wfhReason,
          isHalfDay: wfh.isHalfDay,
          halfDayPeriod: wfh.halfDayPeriod,
          shortCode: wfh.shortCode,
          status: wfh.status,
          role: wfh.role,
          employeeName: wfh.employeeName,
          employeeCode: wfh.employeeCode,
          employeeId: wfh.employeeId,
          type: wfh.type,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    // console.log("This is Leaves", expandedLeaves);
    // console.log("This is WFH", expandedwfhs);

    // Combine all records
    // Key by date + employeeId for per-employee days. Holidays/Sundays are keyed with _ALL
    const dateMap = new Map();

    for (const record of attendanceRecords) {
      const key = new Date(record.date).toISOString().split("T")[0];
      const empKey = record.employeeId
        ? key + "_" + record.employeeId.toString()
        : key + "_UNKNOWN";
      dateMap.set(empKey, {
        ...record,
        date: key,
        employeeId: record.employeeId,
      });
    }

    for (const leave of expandedLeaves) {
      // expandedLeaves already contains employeeName/employeeCode and type; we need employeeId if available
      const empId = leave.employeeId || leave.employeeCode || "UNKNOWN";
      const empKey =
        leave.date +
        "_" +
        (leave.employeeId
          ? leave.employeeId.toString()
          : leave.employeeName || empId);
      if (!dateMap.has(empKey)) dateMap.set(empKey, leave);
    }
    for (const wfh of expandedwfhs) {
      const empId = wfh.employeeId || wfh.employeeCode || "UNKNOWN";
      const empKey =
        wfh.date +
        "_" +
        (wfh.employeeId
          ? wfh.employeeId.toString()
          : wfh.employeeName || empId);
      if (!dateMap.has(empKey)) dateMap.set(empKey, wfh);
    }

    for (const holiday of holidays) {
      if (!dateMap.has(holiday.date + "_ALL"))
        dateMap.set(holiday.date + "_ALL", holiday);
    }

    for (const sunday of sundays) {
      if (!dateMap.has(sunday.date + "_ALL"))
        dateMap.set(sunday.date + "_ALL", sunday);
    }

    // Determine the employee list in scope to fill absents
    // If employeeId filter provided, only that employee. Otherwise fetch employees matching matchStage2 (org/team/role)
    let employeesInScope = [];
    if (employeeId) {
      employeesInScope = await employeeSchema
        .find({ _id: new ObjectId(employeeId) })
        .select("_id firstName lastName employeeCode teamId roleId")
        .lean();
    } else {
      const [activeStatus, ceoRole, cooRole, orgHeadRole] = await Promise.all([
        statusSchema.findOne({
          orgId: new ObjectId(orgId),
          statusType: "ACTIVE",
        }),
        rolesSchema.findOne({ orgId: new ObjectId(orgId), name: "CEO" }),
        rolesSchema.findOne({ orgId: new ObjectId(orgId), name: "COO" }),
        rolesSchema.findOne({
          orgId: new ObjectId(orgId),
          name: "ORGANIZATIONHEAD",
        }),
      ]);
      if (!activeStatus) {
        return res.status(400).json({ error: "Active Status Not Found" });
      }
      // Build a query from matchStage2: it contains employeeInfo.orgId, maybe teamId and roleId
      const empQuery = {
        orgId: new ObjectId(orgId),
        status: activeStatus._id,
        considerAttendence: true,
        // tempPrivilegeId: null,
        // roleId: {
        //   $nin: [ceoRole?._id, cooRole?._id, orgHeadRole?._id].filter(Boolean),
        // },
        // employeeCode: { $ne: "0002" }
      };
      if (matchStage2["employeeInfo.teamId"])
        empQuery.teamId = matchStage2["employeeInfo.teamId"];
      if (matchStage2["employeeInfo.roleId"])
        empQuery.roleId = matchStage2["employeeInfo.roleId"];
      employeesInScope = await employeeSchema
        .find(empQuery)
        .select("_id firstName lastName employeeCode")
        .lean();
    }

    // For each employee, for each date, if no record exists, create ABSENT record
    for (const emp of employeesInScope) {
      let current = new Date(fromDateStart);
      while (current <= toDateEnd) {
        const dateKey = current.toISOString().split("T")[0];
        const empKey = dateKey + "_" + emp._id.toString();
        if (!dateMap.has(empKey) && !dateMap.has(dateKey + "_ALL")) {
          dateMap.set(empKey, {
            date: dateKey,
            status: "ABSENT",
            shortCode: "AB",
            type: "Absent",
            employeeName: (emp.firstName || "") + " " + (emp.lastName || ""),
            employeeId: emp._id,
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    if (statusId && statusId.toString() === absentStatusId._id.toString()) {
      // console.log("Comming for Absent Data")
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "AB") {
          dateMap.delete(key);
        }
      }
      // console.log("Filtered DateMap for Absent Data:", dateMap);
    } else if (
      statusId &&
      statusId.toString() === presentStatusId._id.toString()
    ) {
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "P") {
          dateMap.delete(key);
        }
      }
    } else if (
      statusId &&
      statusId.toString() === firstHalfStatusId._id.toString()
    ) {
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "FH") {
          dateMap.delete(key);
        }
      }
    } else if (
      statusId &&
      statusId.toString() === secondHalfStatusId._id.toString()
    ) {
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "SH") {
          dateMap.delete(key);
        }
      }
    } else if (
      statusId &&
      statusId.toString() === fullDayStatusId._id.toString()
    ) {
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "FD") {
          dateMap.delete(key);
        }
      }
    } else if (
      statusId &&
      statusId.toString() === workFromHomeStatusId._id.toString()
    ) {
      for (const [key, record] of dateMap) {
        if (record.shortCode !== "WFH") {
          dateMap.delete(key);
        }
      }
    }

    const allRecords = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      message:
        "All Employee Attendance, leaves, holidays, Sundays, and absents fetched successfully",
      "No.of Records": allRecords.length,
      data: allRecords,
    });
  } catch (error) {
    console.error("Error fetching all employee attendance:", error);
    res.status(500).json({
      message: "Error while fetching all employee attendance",
      error: error.message,
    });
  }
};

//Function to process attendance punches
const processAttendencePunches = async (orgId, dateStr, sendReminders = false) => {
  try {
    if (!orgId) {
      console.error("Organization ID is required for processing attendance.");
      return;
    }

    console.log(
      "Processing attendance punches for orgId:",
      orgId,
      " on date:",
      dateStr
    );

    const dayStart = dateStr ? new Date(dateStr) : getISTDateAndTime();
    const dayEnd = dateStr ? new Date(dateStr) : getISTDateAndTime();
    dateStr
      ? dayStart.setUTCHours(0, 0, 0, 0)
      : dayStart.setUTCHours(0, 0, 0, 0);
    dateStr
      ? dayEnd.setUTCHours(23, 59, 59, 999)
      : dayEnd.setUTCHours(23, 59, 59, 999);

    console.log("This is DayStart", dayStart, " DayEnd ", dayEnd);

    const [presentStatus, firstHalfStatus, secondHalfStatus] =
      await Promise.all([
        attendenceStatusTypesSchema
          .findOne({ orgId: new ObjectId(orgId), shortName: "P" })
          .lean(),
        attendenceStatusTypesSchema
          .findOne({ orgId: new ObjectId(orgId), shortName: "FH" })
          .lean(),
        attendenceStatusTypesSchema
          .findOne({ orgId: new ObjectId(orgId), shortName: "SH" })
          .lean(),
      ]);

    if (!presentStatus || !firstHalfStatus || !secondHalfStatus) {
      console.error("Attendance status types not found for org:", orgId);
      return;
    }

    const records = await dailyAttendanceSchema.find({
      orgId: new ObjectId(orgId),
      logInTime: { $gte: dayStart, $lte: dayEnd },
    });

    // console.log("Found", records.length, "attendance records to process.", records);

    if (!records || records?.length == 0) {
      console.log("No attendance records found for processing.");
      return;
    }

    // console.log("day start", dayStart, " dayEnd ", dayEnd);
    const onlyDate = dayStart.toISOString().split("T")[0];
    // console.log("Only Date ", onlyDate);
    const title = "Attendance Alert";
    const body = `You have only one Attendence Punch for ${onlyDate} check it once, if applicable apply for a thumb request.`;

    // console.log(body)
    for (const record of records) {
      if (!record.logOutTime) {
        // Only send the "missing punch" nudge when explicitly asked to
        // (end-of-day reminder cron). The every-minute FRS sync also calls
        // this function; without this gate it would re-notify every checked-in
        // employee once per minute all day long.
        if (sendReminders) {
          const token = await getNotificationToken(record.employeeId);
          if (token && token.length > 0) {
            await sendNotificationtoTokens(token, title, body);
          } else {
            console.log("No token found for employeeId:", record.employeeId);
          }
        }
        continue;
      }

      const timeDuration = Number(
        ((record.logOutTime - record.logInTime) / (1000 * 60 * 60)).toFixed(2)
      );

      if (
        timeDuration >= 6 &&
        record.statusId?.toString() !== presentStatus._id.toString()
      ) {
        record.statusId = presentStatus._id;
      }

      const isHalfDay =
        record.statusId?.toString() === firstHalfStatus._id.toString() ||
        record.statusId?.toString() === secondHalfStatus._id.toString();
      record.halfDay = !!isHalfDay;

      record.totalHours = timeDuration;
      // record.isFinalized = true;
      record.finalizedAt = getISTDateAndTime();

      await record.save();
    }
  } catch (err) {
    console.error("Error in processAttendencePunches:", err);
  }
};

// Get present employee count along with absent, leave, permission count
// const getEmployeesStatusCount = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.body;
//     const orgId = req?.user?.orgId;

//     if (!fromDate || !toDate) {
//       return res.status(400).json({ error: "Required date range is missing" });
//     }
//     if (!orgId) {
//       return res.status(400).json({ error: "Organization ID is required" });
//     }

//     const fromDateStart = new Date(fromDate);
//     fromDateStart.setUTCHours(0, 0, 0, 0);
//     const toDateEnd = new Date(toDate);
//     toDateEnd.setUTCHours(23, 59, 59, 999);

//     if (fromDateStart > toDateEnd) {
//       return res.status(400).json({ error: "Invalid date range" });
//     }

//     const totalEmployees = await employeeSchema.countDocuments({ orgId });

//     const acceptedStatusId = await statusTypesSchema
//       .findOne({ orgId, statusType: "ACCEPTED" })
//       .select("_id")
//       .lean();

//     if (!acceptedStatusId) {
//       return res.status(500).json({ error: "ACCEPTED status type not found" });
//     }

//     let dateList = [];
//     let d = new Date(fromDateStart);
//     while (d <= toDateEnd) {
//       dateList.push(new Date(d));
//       d.setDate(d.getDate() + 1);
//     }

//     const holidays = await holidaysSchema.aggregate([
//       {
//         $match: {
//           orgId: new ObjectId(orgId),
//           fromDate: { $lte: toDateEnd },
//           toDate: { $gte: fromDateStart },
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           dates: {
//             $map: {
//               input: {
//                 $range: [
//                   0,
//                   {
//                     $add: [
//                       {
//                         $toInt: {
//                           $divide: [
//                             { $subtract: ["$toDate", "$fromDate"] },
//                             86400000,
//                           ],
//                         },
//                       },
//                       1,
//                     ],
//                   },
//                 ],
//               },
//               as: "i",
//               in: {
//                 $dateToString: {
//                   format: "%Y-%m-%d",
//                   date: {
//                     $add: ["$fromDate", { $multiply: ["$$i", 86400000] }],
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//       { $unwind: "$dates" },
//       {
//         $project: {
//           name: 1,
//           date: "$dates",
//         },
//       },
//     ]);

//     let holidayList = [];
//     holidays.forEach((h) => {
//       if (Array.isArray(h.dates)) {
//         h.dates.forEach((dateStr) => {
//           holidayList.push({ date: new Date(dateStr), name: h.name });
//         });
//       }
//     });

//     const holidayMap = {};
//     holidays.forEach((h) => {
//       holidayMap[h.date.toString().split("T")[0]] = h.name;
//     });

//     const sundaySet = new Set();
//     for (const dateObj of dateList) {
//       if (dateObj.getDay() === 0) {
//         sundaySet.add(dateObj.toString().split("T")[0]);
//       }
//     }

//     // Fetch attendance records considering both logInTime and logOutTime
//     const attendanceRecords = await dailyAttendanceSchema.aggregate([
//       {
//       $match: {
//         orgId: new ObjectId(orgId),
//         $or: [
//         { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
//         { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
//         ],
//       },
//       },
//       {
//       $project: {
//         employeeId: 1,
//         logInDate: {
//         $dateToString: {
//           format: "%Y-%m-%d",
//           date: {
//           $cond: [
//             { $ifNull: ["$logInTime", false] },
//             "$logInTime",
//             "$logOutTime",
//           ],
//           },
//         },
//         },
//       },
//       },
//     ]);

//     const permissionRecords = await permissionRequestSchema.aggregate([
//       {
//         $match: {
//           orgId: new ObjectId(orgId),
//           statusId: acceptedStatusId._id,
//           date: { $gte: fromDateStart, $lte: toDateEnd },
//         },
//       },
//       {
//         $project: {
//           employeeId: 1,
//           dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
//         },
//       },
//     ]);

//     const leaveRecords = await leaveRequestSchema.aggregate([
//       {
//         $match: {
//           orgId: new ObjectId(orgId),
//           statusId: acceptedStatusId._id,
//           date: { $gte: fromDateStart, $lte: toDateEnd },
//         },
//       },
//       {
//         $project: {
//           employeeId: 1,
//           dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
//         },
//       },
//     ]);

//     const attendanceMap = {};
//     attendanceRecords.forEach((rec) => {
//       if (!attendanceMap[rec.logInDate])
//         attendanceMap[rec.logInDate] = new Set();
//       attendanceMap[rec.logInDate].add(rec.employeeId.toString());
//     });

//     const permissionMap = {};
//     permissionRecords.forEach((rec) => {
//       if (!permissionMap[rec.dateStr]) permissionMap[rec.dateStr] = new Set();
//       permissionMap[rec.dateStr].add(rec.employeeId.toString());
//     });

//     const leaveMap = {};
//     leaveRecords.forEach((rec) => {
//       if (!leaveMap[rec.dateStr]) leaveMap[rec.dateStr] = new Set();
//       leaveMap[rec.dateStr].add(rec.employeeId.toString());
//     });

//     const result = dateList.map((dateObj) => {
//       const dateStr = dateObj.toISOString().split("T")[0];

//       if (holidayMap[dateStr]) {
//         return {
//           date: dateStr,
//           totalEmployees,
//           present: 0,
//           absent: 0,
//           permission: 0,
//           leave: 0,
//           holiday: true,
//           holidayName: holidayMap[dateStr],
//           sunday: false,
//         };
//       }
//       if (sundaySet.has(dateStr)) {
//         return {
//           date: dateStr,
//           totalEmployees,
//           present: 0,
//           absent: 0,
//           permission: 0,
//           leave: 0,
//           holiday: false,
//           sunday: true,
//         };
//       }

//       const present = attendanceMap[dateStr]?.size || 0;
//       const permission = permissionMap[dateStr]?.size || 0;
//       const leave = leaveMap[dateStr]?.size || 0;
//       const absent = totalEmployees - (present + permission + leave);

//       return {
//         date: dateStr,
//         totalEmployees,
//         present,
//         absent: absent < 0 ? 0 : absent,
//         permission,
//         leave,
//         holiday: false,
//         sunday: false,
//       };
//     });

//     res.status(200).json({
//       message: "Employees status count fetched successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error fetching employees status count:", error);
//     res.status(500).json({
//       message: "Error while fetching employees status count",
//       error: error.message,
//     });
//   }
// };

// Get present employee count along with absent, leave, permission count
const getEmployeesStatusCount = async (req, res) => {
  try {
    const { fromDate, toDate, team } = req.body;
    const orgId = req?.user?.orgId;
    const privilegeId = req?.user?.privilegeId;

    const teamId = req?.user?.teamId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);

    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    if (fromDateStart > toDateEnd) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const [acceptedStatusId, activeStatusId] = await Promise.all([
      statusTypesSchema
        .findOne({ orgId, statusType: "ACCEPTED" })
        .select("_id")
        .lean(),
      statusTypesSchema
        .findOne({ orgId, statusType: "ACTIVE" })
        .select("_id")
        .lean(),
    ]);

    if (!activeStatusId?._id || !acceptedStatusId?._id) {
      return res
        .status(500)
        .json({ error: "ACTIVE/ACCEPTED status type not found" });
    }

    const privileges = await privilegeSchema
      .find({
        orgId: new ObjectId(orgId),
        name: { $in: ["SUPERADMIN", "ADMIN", "GENERAL"] },
      })
      .select("_id name")
      .lean();

    const privilegeMap = {};
    privileges.forEach((p) => (privilegeMap[p.name] = p._id.toString()));

    if (privilegeId?.toString() === privilegeMap["GENERAL"]) {
      return res
        .status(403)
        .json({ error: "You are not authorized to access this data" });
    }

    // const privilegedRoles = await rolesSchema
    //   .find({
    //     orgId: new ObjectId(orgId),
    //     name: { $in: ["CEO", "COO", "ORGANIZATIONHEAD"] },
    //   })
    //   .select("_id")
    //   .lean();

    // const privilegedRoleIds = privilegedRoles.map((role) => role._id);

    let teamFilter = {
      // status: activeStatusId?._id,
      // considerAttendence: true,
      // tempPrivilegeId: null,
      // roleId: { $nin: privilegedRoleIds },
      // employeeCode: { $ne: "0002" },
    };

    if (privilegeId?.toString() === privilegeMap["SUPERADMIN"]) {
      if (team) {
        const teamExists = await teamSchema.findOne({
          _id: new ObjectId(team),
          orgId,
        });
        if (!teamExists) {
          return res
            .status(400)
            .json({ error: "Your team does not exist, contact superadmin" });
        }
        teamFilter = { teamId: new ObjectId(team) };
      }
    }

    if (privilegeId?.toString() === privilegeMap["ADMIN"]) {
      if (!teamId) {
        return res.status(200).json({
          message: "You don’t have any team to get data",
          "No.of Records": 0,
        });
      }
      const teamExists = await teamSchema.findOne({
        _id: new ObjectId(teamId),
      });

      if (!teamExists) {
        return res
          .status(400)
          .json({ error: "Your team does not exist, contact superadmin" });
      }

      // const testingTeam = await teamSchema.findOne({
      //   teamName: "TEAM PP",
      // });
      // if (
      //   testingTeam &&
      //   testingTeam._id.toString() === teamExists._id.toString()
      // ) {
      //   // this is testing team no need to get data
      //   return res.status(200).json({
      //     message: "No need to consider this testing team for attendance data",
      //     date: [],
      //   });
      // }

      teamFilter = { teamId: new ObjectId(teamId) };
    }

    let employees = await employeeSchema
      .find({
        orgId,
        status: activeStatusId?._id,
        considerAttendence: true,
        ...teamFilter,
      })
      .select("_id firstName lastName employeeCode")
      .lean();

    const attendedEmployeePipeline = [
      {
        $match: {
          orgId: new ObjectId(orgId),
          $or: [
            { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
            { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
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
        $match: {
          "employeeInfo.orgId": new ObjectId(orgId),
          ...(teamFilter.teamId ? { "employeeInfo.teamId": teamFilter.teamId } : {}),
        },
      },
      {
        $group: {
          _id: "$employeeInfo._id",
          firstName: { $first: "$employeeInfo.firstName" },
          lastName: { $first: "$employeeInfo.lastName" },
          employeeCode: { $first: "$employeeInfo.employeeCode" },
        },
      },
    ];

    const attendedEmployees = await dailyAttendanceSchema.aggregate(attendedEmployeePipeline);
    const employeeMap = new Map(employees.map((employee) => [employee._id.toString(), employee]));
    attendedEmployees.forEach((employee) => {
      if (!employeeMap.has(employee._id.toString())) {
        employeeMap.set(employee._id.toString(), employee);
      }
    });
    employees = [...employeeMap.values()];

    const employeeIds = employees.map((e) => e._id);
    const employeeIdStrings = employeeIds.map((id) => id.toString());
    const totalEmployees = employees.length;

    const employeeNameMap = {};
    employees.forEach((emp) => {
      const idStr = emp._id.toString();
      const name = `${(emp.firstName || "").trim()}${
        emp.lastName ? " " + emp.lastName.trim() : ""
      }`.trim();
      employeeNameMap[idStr] = name || emp.employeeCode || "";
    });

    if (totalEmployees === 0) {
      return res.status(200).json({
        message: "No employees found for given criteria",
        data: [],
      });
    }

    let dateList = [];
    let d = new Date(fromDateStart);
    while (d <= toDateEnd) {
      dateList.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    const holidays = await holidaysSchema.aggregate([
      {
        $match: {
          orgId: new ObjectId(orgId),
          fromDate: { $lte: toDateEnd },
          toDate: { $gte: fromDateStart },
        },
      },
      {
        $project: {
          name: 1,
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
      { $project: { name: 1, date: "$dates" } },
    ]);

    const holidayMap = {};
    holidays.forEach((h) => {
      holidayMap[h.date] = h.name;
    });

    const sundaySet = new Set();
    for (const dateObj of dateList) {
      if (dateObj.getDay() === 0) {
        sundaySet.add(dateObj.toISOString().split("T")[0]);
      }
    }

    const attendanceRecords = await dailyAttendanceSchema.aggregate([
      {
        $match: {
          orgId: new ObjectId(orgId),
          employeeId: { $in: employeeIds },
          $or: [
            { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
            { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
          ],
        },
      },
      {
        $project: {
          employeeId: 1,
          logInDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$logInTime", "$logOutTime"] },
            },
          },
        },
      },
    ]);

    // console.log("From Date ", fromDateStart, " To Date ", toDateEnd);
    const permissionRecords = await permissionRequestSchema.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
          statusId: acceptedStatusId._id,
          date: { $gte: fromDateStart, $lte: toDateEnd },
        },
      },
      {
        $project: {
          employeeId: 1,
          dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
      },
    ]);

    // console.log("This is Employee Permission ", permissionRecords);

    const leaveRecords = await leaveRequestSchema.aggregate([
      {
        $match: {
          orgId: new ObjectId(orgId),
          employeeId: { $in: employeeIds },
          statusId: acceptedStatusId._id,
          startDate: { $lte: toDateEnd },
          endDate: { $gte: fromDateStart },
          // date: { $gte: fromDateStart, $lte: toDateEnd },
        },
      },
      {
        $addFields: {
          dates: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $add: [
                      {
                        $dateDiff: {
                          startDate: "$startDate",
                          endDate: "$endDate",
                          unit: "day",
                        },
                      },
                      1,
                    ],
                  },
                ],
              },
              as: "offset",
              in: {
                $dateAdd: {
                  startDate: "$startDate",
                  unit: "day",
                  amount: "$$offset",
                },
              },
            },
          },
        },
      },
      { $unwind: "$dates" },
      {
        $project: {
          employeeId: 1,
          dateStr: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dates",
            },
          },
        },
      },
    ]);

    const wfhRecords = await workFromHomeSchema.aggregate([
      {
        $match: {
          orgId: new ObjectId(orgId),
          employeeId: { $in: employeeIds },
          statusId: acceptedStatusId._id,
          startDate: { $lte: toDateEnd },
          endDate: { $gte: fromDateStart },
          // date: { $gte: fromDateStart, $lte: toDateEnd },
        },
      },
      {
        $addFields: {
          dates: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $add: [
                      {
                        $dateDiff: {
                          startDate: "$startDate",
                          endDate: "$endDate",
                          unit: "day",
                        },
                      },
                      1,
                    ],
                  },
                ],
              },
              as: "offset",
              in: {
                $dateAdd: {
                  startDate: "$startDate",
                  unit: "day",
                  amount: "$$offset",
                },
              },
            },
          },
        },
      },
      { $unwind: "$dates" },
      {
        $project: {
          employeeId: 1,
          dateStr: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dates",
            },
          },
        },
      },
    ]);

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      if (!attendanceMap[rec.logInDate])
        attendanceMap[rec.logInDate] = new Set();
      attendanceMap[rec.logInDate].add(rec.employeeId.toString());
    });

    const permissionMap = {};
    permissionRecords.forEach((rec) => {
      if (!permissionMap[rec.dateStr]) permissionMap[rec.dateStr] = new Set();
      permissionMap[rec.dateStr].add(rec.employeeId.toString());
    });

    const leaveMap = {};
    leaveRecords.forEach((rec) => {
      if (!leaveMap[rec.dateStr]) leaveMap[rec.dateStr] = new Set();
      leaveMap[rec.dateStr].add(rec.employeeId.toString());
    });

    const wfhMap = {};
    wfhRecords.forEach((rec) => {
      if (!wfhMap[rec.dateStr]) wfhMap[rec.dateStr] = new Set();
      wfhMap[rec.dateStr].add(rec.employeeId.toString());
    });

    const result = dateList.map((dateObj) => {
      const dateStr = dateObj.toISOString().split("T")[0];

      if (holidayMap[dateStr]) {
        return {
          date: dateStr,
          totalEmployees,
          present: 0,
          absent: 0,
          permission: 0,
          leave: 0,
          holiday: true,
          holidayName: holidayMap[dateStr],
          sunday: false,
        };
      }

      if (sundaySet.has(dateStr)) {
        return {
          date: dateStr,
          totalEmployees,
          present: 0,
          absent: 0,
          permission: 0,
          leave: 0,
          holiday: false,
          sunday: true,
        };
      }

      const present = attendanceMap[dateStr]?.size || 0;
      const permission = permissionMap[dateStr]?.size || 0;
      const leave = leaveMap[dateStr]?.size || 0;
      const wfh = wfhMap[dateStr]?.size || 0;

      const presentSet = attendanceMap[dateStr] || new Set();
      const permissionSet = permissionMap[dateStr] || new Set();
      const leaveSet = leaveMap[dateStr] || new Set();
      const wfhSet = wfhMap[dateStr] || new Set();

      const absentIds = employeeIdStrings.filter(
        (idStr) =>
          !presentSet.has(idStr) &&
          !permissionSet.has(idStr) &&
          !leaveSet.has(idStr) &&
          !wfhSet.has(idStr)
      );
      const permissionIds = employeeIdStrings.filter((idStr) =>
        permissionSet.has(idStr)
      );
      const leaveIds = employeeIdStrings.filter((idStr) => leaveSet.has(idStr));
      const wfhIds = employeeIdStrings.filter((idStr) => wfhSet.has(idStr));

      const presentIds = employeeIdStrings.filter((idStr) =>
        presentSet.has(idStr)
      );

      const absentNames = absentIds.map(
        (idStr) => employeeNameMap[idStr] || ""
      );
      const permissionNames = permissionIds.map(
        (idStr) => employeeNameMap[idStr] || ""
      );
      const leaveNames = leaveIds.map((idStr) => employeeNameMap[idStr] || "");
      const wfhNames = wfhIds.map((idStr) => employeeNameMap[idStr] || "");
      const presentNames = presentIds.map(
        (idStr) => employeeNameMap[idStr] || ""
      );

      return {
        date: dateStr,
        totalEmployees,
        present: presentNames.length < 0 ? 0 : presentNames.length,
        presentNames,
        absent: absentNames.length < 0 ? 0 : absentNames.length,
        absentNames,
        permission: permissionNames.length < 0 ? 0 : permissionNames.length,
        permissionNames,
        leave: leaveNames.length < 0 ? 0 : leaveNames.length,
        leaveNames,
        wfh: wfhNames.length < 0 ? 0 : wfhNames.length,
        wfhNames,
        holiday: false,
        sunday: false,
      };
    });

    res.status(200).json({
      message: "Employees status count fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching employees status count:", error);
    res.status(500).json({
      message: "Error while fetching employees status count",
      error: error.message,
    });
  }
};

// Get attended employee count grouped by date
const getAttendedEmployeeCount = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const orgId = req?.user?.orgId;

    // console.log("This is comming From date", fromDate, " To Date ", toDate);

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);
    // define plain date bounds for comparisons
    const startDate = new Date(fromDateStart);
    const endDate = new Date(toDateEnd);

    // console.log(" Converted From Date ", fromDateStart, " To Date ", toDateEnd);

    // Base match for date range and org
    const matchStage = {
      orgId: new ObjectId(orgId),
      $or: [
        { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
        { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
      ],
    };

    const [superAdminId, adminId, generalId] = await Promise.all([
      privilegeSchema
        .findOne({ orgId: new ObjectId(orgId), name: "SUPERADMIN" })
        .select("_id")
        .lean(),
      privilegeSchema
        .findOne({ orgId: new ObjectId(orgId), name: "ADMIN" })
        .select("_id")
        .lean(),
      privilegeSchema
        .findOne({ orgId: new ObjectId(orgId), name: "GENERAL" })
        .select("_id")
        .lean(),
    ]);

    if (!superAdminId || !adminId || !generalId) {
      return res
        .status(500)
        .json({ error: "SUPERADMIN/ADMIN/GENERAL privileges not found" });
    }

    if (req?.user?.privilegeId?.toString() === generalId._id.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to access this data" });
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      { $unwind: "$employeeInfo" },
    ];

    // Add team filter if user is ADMIN
    if (req?.user?.privilegeId?.toString() === adminId._id.toString()) {
      if (!req?.user?.teamId) {
        return res.status(200).json({
          message: "You don't have any team to get data",
          "No.of Records": 0,
        });
      }

      pipeline.push({
        $match: {
          "employeeInfo.teamId": new ObjectId(req?.user?.teamId),
        },
      });
    }

    pipeline.push(
      {
        $project: {
          logDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $ifNull: ["$logInTime", "$logOutTime"],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$logDate",
          Count: { $sum: 1 },
        },
      },

      {
        $sort: { _id: 1 },
      }
    );

    const [attendedCount, holidays] = await Promise.all([
      dailyAttendanceSchema.aggregate(pipeline),
      holidaysSchema.aggregate([
        {
          $match: {
            orgId: new ObjectId(orgId),
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
        { $project: { name: 1, date: "$dates", shortCode: 1 } },
      ]),
    ]);

    const holidayMap = {};
    holidays.forEach((h) => {
      if (h && h.date) {
        holidayMap[h.date] = { name: h.name, shortCode: h.shortCode };
      }
    });

    const attendedMap = {};
    attendedCount.forEach((a) => {
      attendedMap[a._id] = a.Count || 0;
    });

    const result = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const current = new Date(d);
      const dateStr = current.toISOString().split("T")[0];
      const count = attendedMap[dateStr] || 0;

      if (holidayMap[dateStr]) {
        result.push({
          _id: dateStr,
          Count: count,
          isHoliday: true,
          HolidayName: holidayMap[dateStr].name,
        });
      } else if (current.getDay() === 0) {
        result.push({
          _id: dateStr,
          Count: count,
          isHoliday: true,
          HolidayName: "SUNDAY",
        });
      } else {
        result.push({ _id: dateStr, Count: count, isHoliday: false });
      }
    }

    return res.status(200).json({
      message: "Attended Employees Count fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching attended employees count:", error);
    return res.status(500).json({
      message: "Error while fetching attended employees count",
      error: error.message,
    });
  }
};

// // ! Set Time Out to Process the Attendance Punches for a date range
// setTimeout(async () => {
//   const start = Date.now();
//   console.log("Process Starts at ", getISTDateAndTime());
//   const startDate = new Date("2025-10-05");
//   const endDate = new Date("2025-10-07");
//   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//     const dateStr = d.toISOString().split("T")[0];
//     const start = Date.now();
//     console.log("Process Starts for day ", dateStr, " at ", getISTDateAndTime());

//     const orgId = await organizationSchema
//     .findOne({ name: "Technical Hub" })
//     .select("_id")
//     .lean();
//     if (!orgId) {
//       console.log("Organization id not found!!");
//       return;
//     }
//   await processAttendencePunches(orgId._id, dateStr);
//     const end = Date.now();
//     console.log("Process ends for day ", dateStr, " at ", getISTDateAndTime());
//     const durationMs = end - start;
//     const durationMinutes = (durationMs / 60000).toFixed(2);
//     console.warn("Total Time taken for day ", dateStr, "(minutes) is:", durationMinutes);
//   }
// }, 10000);

cron.schedule("*/5 * * * *", async () => {
  // console.log("Scheduled task running every 5 minutes");
  // console.log("Process Starts at " , getISTDateAndTime());

  const organizations = await organizationSchema
    .find({ productionAttendanceApi: { $ne: "" } })
    .lean();
  // console.log("Organizations to process:", organizations);

  if (!organizations || organizations.length === 0) {
    console.log("No organizations found with productionAttendanceApi");
    return;
  }

  const date = getISTDateAndTime().toISOString().split("T")[0];

  for (const org of organizations) {
    const attendenceDeviceIp =
      process.env.NODE_ENV !== "staging"
        ? org.productionAttendanceApi
        : org.stagingAttendanceApi;
    // const attendenceDeviceIp =
    //   process.env.NODE_ENV !== "staging"
    //     ? "https://210.212.210.89/office/hrmsapifordatewise.php"
    //     : "https://172.7.67.49/office/hrmsapifordatewise.php";

    await getAttendancePunchesFromMainDevice(date, org._id, attendenceDeviceIp);
  }
  // await getAttendancePunchesFromMainDevice();
  // console.log("Process Completed at ", getISTDateAndTime());
});

// ! Set Time Out to Fetch the Attendance Punches from the Main Device and Process them for a date range
// setTimeout(async () => {
//   const start = Date.now();
//   console.log("Process Starts at ", getISTDateAndTime());
//   const startDate = new Date("2025-10-05");
//   const endDate = new Date("2025-10-07");
//   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//     const dateStr = d.toISOString().split("T")[0];
//     const start = Date.now();
//     console.log("Process Starts for day ", dateStr, " at ", getISTDateAndTime());

//     await getAttendancePunchesFromMainDevice(dateStr);
//     const end = Date.now();
//     console.log("Process ends for day ", dateStr, " at ", getISTDateAndTime());
//     const durationMs = end - start;
//     const durationMinutes = (durationMs / 60000).toFixed(2);
//     console.warn("Total Time taken for day ", dateStr, "(minutes) is:", durationMinutes);
//   }
// }, 5000);

cron.schedule("0 19,21 * * 1-5", async () => {
  console.log("Scheduled task running every day at 7 PM and 9 PM");
  console.log("Process Starts at ", getISTDateAndTime());
  const organizations = await organizationSchema
    .find({ productionAttendanceApi: { $ne: "" } })
    .lean();

  if (!organizations || organizations.length === 0) {
    console.error("No organizations found with productionAttendanceApi");
    return;
  }
  // await getAttendancePunchesFromMainDevice();
  const dateStr = getISTDateAndTime().toISOString().split("T")[0];
  for (const org of organizations) {
    await processAttendencePunches(org._id, dateStr, true);
  }
  console.log("Process Completed at ", getISTDateAndTime());
});

cron.schedule("0 17,18,19 * * 1-5", async () => {
  console.log("Scheduled task running every day at 5 PM and 6 PM");
  console.log("Process Starts at ", getISTDateAndTime());

  try {
    const updateCase1 = await dailyAttendenceSchema.updateMany(
      {
        logInTime: { $ne: null },
        logOutTime: { $ne: null },
        $expr: {
          $gt: [
            "$logInTime",
            {
              $dateFromParts: {
                year: { $year: "$logInTime" },
                month: { $month: "$logInTime" },
                day: { $dayOfMonth: "$logInTime" },
                hour: 15,
                minute: 30,
              },
            },
          ],
        },
      },
      {
        $set: {
          logInTime: null,
        },
      }
    );

    console.log(
      "Case 1 - Updated records (both in/out, logIn after 3:30 PM):",
      updateCase1
    );

    const updateCase2 = await dailyAttendenceSchema.updateMany(
      {
        logInTime: { $ne: null },
        logOutTime: null,
        $expr: {
          $gt: [
            "$logInTime",
            {
              $dateFromParts: {
                year: { $year: "$logInTime" },
                month: { $month: "$logInTime" },
                day: { $dayOfMonth: "$logInTime" },
                hour: 15,
                minute: 30,
              },
            },
          ],
        },
      },
      [
        {
          $set: {
            logOutTime: "$logInTime",
            logInTime: null,
          },
        },
      ]
    );

    console.log(
      "Case 2 - Updated records (only logIn, moved to logOut):",
      updateCase2
    );

    const totalUpdated = updateCase1.modifiedCount + updateCase2.modifiedCount;
    console.log("Total records updated:", totalUpdated);
  } catch (error) {
    console.error("Error in attendance cleanup cron job:", error);
  }

  console.log("Process Completed at ", getISTDateAndTime());
});

const getWorkingDaysCount = async (orgId, fromDate, toDate) => {
  try {
    const holidayMap = await getHolidays(orgId, fromDate, toDate);

    const sundayMap = getSundays(fromDate, toDate);

    // console.log("Holiday Map:", holidayMap);
    // console.log("Sunday Map:", sundayMap);

    const overAllHolidays = Object.keys(sundayMap?.data).filter(
      (date) => !holidayMap?.date[date]
    );

    overAllHolidays.push(...Object.keys(holidayMap?.date));

    // console.log("Overall Holidays:", overAllHolidays);

    // const totalHolidays = Object.keys(holidayMap?.date).length || 0;
    // const totalSundays = Object.keys(overAllHolidays).length || 0;

    // console.log("Total Holidays:", totalHolidays);
    // console.log("Total Sundays:", totalSundays);
    // console.log("Non Holiday Sundays:", nonHolidaySundays);

    const totalDays =
      Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    // console.log("Total Days in Range:", totalDays);

    const totalWorkingDays = totalDays - overAllHolidays.length;
    // console.log("Total Working Days:", totalWorkingDays);

    return {
      overAllHolidays,
      totalWorkingDays,
    };
  } catch (error) {
    console.error("Error in getWorkingDaysCount:", error);
    return 0;
  }
};

const getTopAttendanceEmployees = async (req, res) => {
  try {
    const { fromDate, toDate, limit = 5, teamId } = req.body;
    const orgId = req?.user?.orgId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);
    if (fromDateStart > toDateEnd) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const { totalWorkingDays, overAllHolidays } = await getWorkingDaysCount(
      orgId,
      fromDateStart,
      toDateEnd
    );

    if (totalWorkingDays === 0) {
      return res
        .status(404)
        .json({ error: "No working days found in the specified range" });
    }

    const presentStatusId = await attendenceStatusTypesSchema
      .findOne({ orgId, shortName: "P" })
      .select("_id")
      .lean();

    const matchStage1 = {
      orgId: new ObjectId(orgId),
      statusId: presentStatusId?._id,
      $or: [
        { logInTime: { $gte: fromDateStart, $lte: toDateEnd } },
        { logOutTime: { $gte: fromDateStart, $lte: toDateEnd } },
      ],
    };

    const matchStage2 = {};

    if (teamId) {
      const teamExists = await teamSchema.findOne({
        _id: new ObjectId(teamId),
      });

      if (!teamExists) {
        return res
          .status(400)
          .json({ error: "Your team does not exist, contact superadmin" });
      }
      matchStage2["employeeDetails.teamId"] = new ObjectId(teamId);
    }

    const attendanceData = await dailyAttendanceSchema.aggregate([
      {
        $match: matchStage1,
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      { $unwind: "$employeeDetails" },
      {
        $match: matchStage2,
      },
      {
        $addFields: {
          logInDateStr: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$logInTime",
            },
          },
          logOutDateStr: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$logOutTime",
            },
          },
        },
      },

      {
        $match: {
          $or: [
            {
              logInDateStr: {
                $nin: overAllHolidays,
              },
            },
            {
              logOutDateStr: {
                $nin: overAllHolidays,
              },
            },
          ],
        },
      },

      {
        $group: {
          _id: "$employeeDetails._id",
          firstName: {
            $first: "$employeeDetails.firstName",
          },
          lastName: {
            $first: "$employeeDetails.lastName",
          },
          employeeCode: {
            $first: "$employeeDetails.employeeCode",
          },
          employeeImage: {
            $first: "$employeeDetails.profileImage",
          },
          attendanceCount: { $sum: 1 },
        },
      },

      {
        $addFields: {
          employeeName: {
            $concat: ["$firstName", " ", "$lastName"],
          },
        },
      },

      { $sort: { attendanceCount: -1 } },
      { $limit: limit },
      {
        $project: {
          employeeName: 1,
          attendanceCount: 1,
          employeeCode: 1,
          employeeImage: 1,
        },
      },
    ]);

    return res.status(200).json({
      message: "Top attendance employees fetched",
      totalWorkingDays: totalWorkingDays,
      data: attendanceData,
    });
  } catch (error) {
    console.error("Error fetching top attendance employees:", error);
    return res.status(500).json({
      message: "Error while fetching top attendance employees",
      error: error.message,
    });
  }
};

const attendencePunchProcessor = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    if (fromDateStart > toDateEnd) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const attendancePromises = [];

    for (
      let d = new Date(fromDateStart);
      d <= toDateEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      // console.log("Processing attendance punches for date:", dateStr);
      attendancePromises.push(
        processAttendencePunches(req.user.orgId, dateStr)
      );
    }

    await Promise.all(attendancePromises);
    return res.status(200).json({
      message:
        "Attendance punches processed successfully for the given date range",
    });
  } catch (error) {
    console.error("Error processing attendance punches:", error);
    return res.status(500).json({
      message: "Error while processing attendance punches",
      error: error.message,
    });
  }
};

const backfillFRSAttendanceController = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    const fromDateStart = new Date(`${fromDate}T00:00:00.000Z`);
    const toDateStart = new Date(`${toDate}T00:00:00.000Z`);

    if (isNaN(fromDateStart.getTime()) || isNaN(toDateStart.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    if (fromDateStart > toDateStart) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const diffDays =
      Math.floor((toDateStart - fromDateStart) / (24 * 60 * 60 * 1000)) + 1;
    if (diffDays > 62) {
      return res.status(400).json({
        error: "Date range is too large. Please backfill 62 days or fewer at a time.",
      });
    }

    const result = await backfillFRSAttendance(
      fromDate,
      toDate,
      req.user?.orgId?.toString()
    );

    return res.status(200).json({
      message: "FRS attendance backfill completed",
      data: result,
    });
  } catch (error) {
    console.error("Error backfilling FRS attendance:", error);
    return res.status(500).json({
      message: "Error while backfilling FRS attendance",
      error: error.message,
    });
  }
};

const getAttendanceDataFromDevice = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    // const fromDate = "2025-10-01";
    // const toDate = "2025-10-10";

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const organizations = await organizationSchema
      .find({ _id: req.user.orgId, productionAttendanceApi: { $ne: "" } })
      .lean();
    // console.log("Organizations to process:", organizations);

    if (!organizations || organizations.length === 0) {
      console.log("No organizations found with productionAttendanceApi");
      return;
    }

    // console.log(organizations);

    for (
      let d = new Date(fromDate);
      d <= new Date(toDate);
      d.setDate(d.getDate() + 1)
    ) {
      const date = d.toISOString().split("T")[0];
      // console.log("processing : ", date);

      const attendenceDeviceIp =
        process.env.NODE_ENV !== "staging"
          ? organizations[0].productionAttendanceApi
          : organizations[0].stagingAttendanceApi;

      // console.log(attendenceDeviceIp)
      getAttendancePunchesFromMainDevice(
        date,
        organizations[0]._id,
        attendenceDeviceIp
      );
    }

    console.log("All attendance data fetched and processed");

    return res.status(200).json({
      message: "Attendance data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return res.status(500).json({
      message: "Error while fetching attendance data",
      error: error.message,
    });
  }
};

const addAttendanceToEmployees = async (req, res) => {
  try {
    const { employeesArray, date, logInTime, logOutTime, status } = req.body;

    // console.log("Request Body:", req.body);

    if (
      !employeesArray ||
      employeesArray.length === 0 ||
      !date ||
      (!logInTime && !logOutTime) ||
      !status
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new Date(`${date}T${logInTime}`) >= new Date(`${date}T${logOutTime}`)) {
      return res
        .status(400)
        .json({ message: "Log Out Time must be after Log In Time" });
    }

    if (
      changeGTMtoIST(new Date(`${date}T${logInTime}`)) > getISTDateAndTime()
    ) {
      return res
        .status(400)
        .json({ message: "Log In Time cannot be in the future" });
    }

    if (
      changeGTMtoIST(new Date(`${date}T${logOutTime}`)) > getISTDateAndTime()
    ) {
      return res
        .status(400)
        .json({ message: "Log Out Time cannot be in the future" });
    }

    const [
      presentStatusId,
      firstHalfStatusId,
      secondHalfStatusId,
      fullDayStatusId,
    ] = await Promise.all([
      attendenceStatusTypesSchema.findOne({ shortName: "P" }),
      attendenceStatusTypesSchema.findOne({ shortName: "FH" }),
      attendenceStatusTypesSchema.findOne({ shortName: "SH" }),
      attendenceStatusTypesSchema.findOne({ shortName: "FD" }),
    ]);

    if (
      !presentStatusId ||
      !firstHalfStatusId ||
      !secondHalfStatusId ||
      !fullDayStatusId
    ) {
      return res
        .status(400)
        .json({ message: "Attendance status types not found" });
    }

    const employeesData = [];
    const notFoundEmployees = [];
    for (const employeeCode of employeesArray) {
      const employee = await employeeSchema
        .findOne(
          { employeeCode: employeeCode, orgId: req.user.orgId },
          { firstName: 1, lastName: 1, employeeCode: 1, shiftId: 1 }
        )
        .lean();
      if (employee) {
        employeesData.push(employee);
      } else {
        notFoundEmployees.push(employeeCode);
      }
    }

    if (notFoundEmployees.length > 0) {
      return res.status(400).json({
        message: `Employees not found with employee codes: ${notFoundEmployees.join(
          ", "
        )}`,
      });
    }

    const { overAllHolidays, totalWorkingDays } = await getWorkingDaysCount(
      req.user.orgId,
      new Date(date),
      new Date(date)
    );

    // console.log(
    //   "overAllHolidays : ",
    //   overAllHolidays,
    //   "totalWorkingDays : ",
    //   totalWorkingDays
    // );

    if (totalWorkingDays === 0 || overAllHolidays.includes(date)) {
      return res
        .status(400)
        .json({ message: `The selected date ${date} is not a working day.` });
    }

    const dayStart = changeGTMtoIST(new Date(`${date}T00:00:00`));
    const dayEnd = changeGTMtoIST(new Date(`${date}T23:59:59`));

    if (status.toString() === fullDayStatusId._id.toString()) {
      // Process for Full Day status
      const alreadyExists = [];
      for (const employee of employeesData) {
        const existingAttendance = await dailyAttendanceSchema.findOne({
          employeeId: employee._id,
          $or: [
            {
              logInTime: {
                $gte: dayStart,
                $lte: dayEnd,
              },
            },
            {
              logOutTime: {
                $gte: dayStart,
                $lte: dayEnd,
              },
            },
          ],
        });

        if (existingAttendance) {
          alreadyExists.push(employee.employeeCode);
        }
      }

      if (alreadyExists.length > 0) {
        return res.status(400).json({
          message: `Attendance already exists for employee IDs ${alreadyExists.join(
            ", "
          )} on date ${date}`,
        });
      }

      for (const employee of employeesData) {
        const newAttendance = new dailyAttendanceSchema({
          employeeId: employee._id,
          logInDate: new Date(date),
          logInTime: changeGTMtoIST(new Date(`${date}T${logInTime}`)),
          logOutTime: changeGTMtoIST(new Date(`${date}T${logOutTime}`)),
          shiftId: employee.shiftId,
          statusId: presentStatusId._id,
          orgId: req.user.orgId,
          createdBy: req.user._id,
        });
        await newAttendance.save();
      }

      return res
        .status(201)
        .json({ message: "Full Day Attendance added successfully" });
    } else if (status.toString() === firstHalfStatusId._id.toString()) {
      const alreadyExists = [];

      for (const employee of employeesData) {
        const existingAttendance = await dailyAttendanceSchema.findOne({
          employeeId: employee._id,
          logInTime: { $gte: dayStart, $lte: dayEnd },
        });

        if (existingAttendance) {
          alreadyExists.push(employee.employeeCode);
        }
      }

      if (alreadyExists.length > 0) {
        return res.status(400).json({
          message: `Log In already exists for employee IDs ${alreadyExists.join(
            ", "
          )} on date ${date}`,
        });
      }

      for (const employee of employeesData) {
        const alreadyExists = await dailyAttendanceSchema.findOne({
          employeeId: employee._id,
          logOutTime: { $gte: dayStart, $lte: dayEnd },
        });

        if (alreadyExists) {
          alreadyExists.logInTime = changeGTMtoIST(
            new Date(`${date}T${logInTime}`)
          );
          alreadyExists.statusId = presentStatusId._id;
          alreadyExists.createdBy = req.user._id;
          await alreadyExists.save();
        } else {
          const newAttendance = new dailyAttendanceSchema({
            employeeId: employee._id,
            logInTime: changeGTMtoIST(new Date(`${date}T${logInTime}`)),
            logOutTime: null,
            shiftId: employee.shiftId,
            statusId: secondHalfStatusId._id,
            orgId: req.user.orgId,
            createdBy: req.user._id,
          });
          await newAttendance.save();
        }
      }
      return res
        .status(201)
        .json({ message: "First Half Attendance processed successfully" });
    } else if (status.toString() === secondHalfStatusId._id.toString()) {
      // Process for Second Half: update existing record if present, otherwise create SH record

      const alreadyExists = [];

      for (const employee of employeesData) {
        const existingAttendance = await dailyAttendanceSchema.findOne({
          employeeId: employee._id,
          logOutTime: { $gte: dayStart, $lte: dayEnd },
        });

        if (existingAttendance) {
          alreadyExists.push(employee.employeeCode);
        }
      }

      if (alreadyExists.length > 0) {
        return res.status(400).json({
          message: `Log Out already exists for employee IDs ${alreadyExists.join(
            ", "
          )} on date ${date}`,
        });
      }

      const notExists = [];
      for (const employee of employeesData) {
        const existingAttendance = await dailyAttendanceSchema.findOne({
          employeeId: employee._id,
          logInTime: { $gte: dayStart, $lte: dayEnd },
        });

        if (!existingAttendance) {
          notExists.push(employee.employeeCode);
        }
      }

      if (notExists.length > 0) {
        return res.status(400).json({
          message: `Log In does not exist for employee IDs ${notExists.join(
            ", "
          )} on date ${date}. Please add First Half attendance first.`,
        });
      }

      for (const employee of employeesData) {
        const existingAttendance = await dailyAttendanceSchema.findOneAndUpdate(
          {
            employeeId: employee._id,
            logInTime: { $gte: dayStart, $lte: dayEnd },
          },
          {
            logOutTime: changeGTMtoIST(new Date(`${date}T${logOutTime}`)),
            statusId: presentStatusId._id,
            createdBy: req.user._id,
          }
        );
        await existingAttendance.save();
      }

      return res
        .status(201)
        .json({ message: "Second Half Attendance processed successfully" });
    } else {
      return res.status(400).json({ message: "Invalid status ID" });
    }
  } catch (error) {
    console.error("Error adding attendance:", error);
    return res.status(500).json({
      message: "Error while adding attendance",
      error: error.message,
    });
  }
};

//Cron Job to process attendance punches for last 5 days every 5 days
cron.schedule("01 0 */5 * *", async () => {
  console.log("Scheduled task running every 5 days at 12:01 AM");
  console.log("Process Starts at ", getISTDateAndTime());
  const toDate = getISTDateAndTime();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 5);

  const organizations = await organizationSchema
    .find({ productionAttendanceApi: { $ne: "" } })
    .lean();

  if (!organizations || organizations.length === 0) {
    console.error("No organizations found with productionAttendanceApi");
    return;
  }

  for (
    startDate = fromDate;
    startDate <= toDate;
    startDate.setDate(startDate.getDate() + 1)
  ) {
    const dateStr = startDate.toISOString().split("T")[0];
    for (const org of organizations) {
      await processAttendencePunches(org._id, dateStr);
    }
    console.log("Process Completed at ", getISTDateAndTime());
  }
});

// setTimeout(async () => {
//   console.log("Process Starts at ", getISTDateAndTime());
//   await getAttendancePunchesFromMainDevice();
//   console.log("Process Completed at ", getISTDateAndTime());
// }, 2000);

//   const end = Date.now();
//   console.log("Process ends at ", getISTDateAndTime());
//   const durationMs = end - start;
//   const durationMinutes = (durationMs / 60000).toFixed(2);
//   console.warn("Total Time taken for entire month is (minutes):", durationMinutes);
// }, 5000);

// setTimeout(async() => {
//   const firstHalfStatusId = await attendenceStatusTypesSchema.findOne({ shortName: "FH" });
//           const secondHalfStatusId = await attendenceStatusTypesSchema.findOne({ shortName: "SH" });
//           const fullDayStatusId = await attendenceStatusTypesSchema.findOne({ shortName: "FD" });

//           console.log("First Half Status ID:", firstHalfStatusId._id);
//           console.log("Second Half Status ID:", secondHalfStatusId._id);
//           console.log("Full Day Status ID:", fullDayStatusId._id);
// }, 1000);

// setTimeout(async () => {
//   console.log("Process Stats at ", getISTDateAndTime());
// await getAttendancePunchesFromMainDevice();
//   console.log("Process Ends at ", getISTDateAndTime());
// }, 5000);

// setTimeout(async () => {
//   console.log("This is new Date()", new Date());
//   console.log("This is IST Date and Time", getISTDateAndTime());
// }, 10000);

// setTimeout(async () => {
//   console.log("processAttendencePunches for today Starts at ", getISTDateAndTime());
//   const orgId = await organizationSchema
//     .findOne({ name: "TECHNICAL HUB" })
//     .select("_id")
//     .lean();
//   // await getAttendancePunchesFromMainDevice();
//   await processAttendencePunches(orgId._id);
//   console.log("processAttendencePunches for today Completed at ", getISTDateAndTime());
// }, 10000);

// setTimeout(async () => {
//   const update = await dailyAttendanceSchema.updateMany(
//     { thumbId: { $ne: null } },
//     { $set: { thumbId: null } }
//   );
//   console.log("Update Result for removing thumbId", update);
// }, 2000);

// setTimeout(async () => {
// const apiData = await axios.post(
//       // "https://office.technicalhub.io/hrmsapifordatewise.php",
//       "https://210.212.210.89/office/hrmsapifordatewise.php",
//       // "https://172.7.67.49/office/hrmsapifordatewise.php",
//       {
//         date: "2025-09-12",
//       },
//       {
//         httpsAgent: agent,
//       }
//     );
//     const data = apiData.data.data;
//     console.log("Total Records Fetched ", data.length);

//     for (const punchData of data) {
//       if(punchData.Employee_id === "4348"){
//         console.log(punchData);
//       }
//     }
// }, 2000);

// setTimeout(async () => {
//   const updateOrg = await organizationSchema.updateMany(
//     { },
//     { $set: { productionAttendanceApi: "" , stagingAttendanceApi : "" } }
//   );
//   console.log("Updated organizations:", updateOrg);
// });
module.exports = {
  getEmployeeAttendance,
  getAllEmployeeAttendence,
  getEmployeesStatusCount,
  getAttendedEmployeeCount,
  getTopAttendanceEmployees,
  getWorkingDaysCount,
  attendencePunchProcessor,
  backfillFRSAttendanceController,
  getAttendanceDataFromDevice,
  addAttendanceToEmployees,
};
