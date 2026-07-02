const thumbRequestSchema = require("../../models/AttendenceSchemaManagement/thumbRequestSchema");
const Employees = require("../../models/EmployeeSchemaManagement/employeeSchema");
const AttendenceRequestType = require("../../models/AttendenceSchemaManagement/attendenceStatusTypesSchema");
const roleSchema = require("../../models/EmployeeSchemaManagement/rolesSchema");
const teamSchema = require("../../models/teamSchema");
const statusSchema = require("../../models/statusSchema");
const leaveRequestSchema = require("../../models/LeaveSchemaManagement/leaveRequestSchema");
const permissionRequestSchema = require("../../models/PermissionSchemaManagement/permissionRequestSchema");

const {
  getISTDateAndTime,
  changeGTMtoIST,
} = require("../../utils/timeFunction");
const {
  sendNotificationtoTokens,
} = require("../FirebaseNotifications/firebaseMessageingTockenController");
const logger = require("../../utils/logger");

const firebaseMessageingTockenSchema = require("../../models/firebaseMessageingTockenSchema");
const dailyAttendenceSchema = require("../../models/AttendenceSchemaManagement/dailyAttendenceSchema");
const employeeSchema = require("../../models/EmployeeSchemaManagement/employeeSchema");
const privilegeSchema = require("../../models/EmployeeSchemaManagement/privilegeSchema");

const ObjectId = require("mongoose").Types.ObjectId;

const checkForLimit = async (employeeId, orgId, date) => {
  try {
    // console.log("This is date", date);
    const startOfMonth = changeGTMtoIST(
      new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1)
    );

    // console.log("This is start of month", startOfMonth);

    if (!employeeId) {
      console.error("Employee ID is required");
      return {
        status: false,
        message: "Employee ID is required",
      };
    }

    if (!orgId) {
      console.error("Organization ID is required");
      return {
        status: false,
        message: "Organization ID is required",
      };
    }

    // const acceptedStatusId = await statusSchema.findOne({
    //   orgId: orgId,
    //   statusType: "ACCEPTED",
    // });

    // const pendingStatusId = await statusSchema.findOne({
    //   orgId: orgId,
    //   statusType: "PENDING",
    // });

    const rejectedStatusId = await statusSchema.findOne({
      orgId: orgId,
      statusType: "REJECTED",
    });

    const cancelledStatusId = await statusSchema.findOne({
      orgId: orgId,
      statusType: "CANCELLED",
    });

    // if (!acceptedStatusId || !acceptedStatusId._id) {
    //   console.error("Accepted Status not found");
    //   return {
    //     status: false,
    //     message: "Accepted Status not found",
    //   };
    // }

    // if(!pendingStatusId || !pendingStatusId._id) {
    //   console.error("Pending Status not found");
    //   return {
    //     status: false,
    //     message: "Pending Status not found",
    //   };
    // }

    if (!rejectedStatusId || !rejectedStatusId._id) {
      console.error("Rejected Status not found");
      return {
        status: false,
        message: "Rejected Status not found",
      };
    }

    if (!cancelledStatusId || !cancelledStatusId._id) {
      console.error("Cancelled Status not found");
      return {
        status: false,
        message: "Cancelled Status not found",
      };
    }

    const permissionRequestCount = await permissionRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: {
            $nin: [
              new ObjectId(rejectedStatusId._id),
              new ObjectId(cancelledStatusId._id),
            ],
          },
          startTime: {
            $gte: startOfMonth,
          },
        },
      },
      {
        $count: "count",
      },
    ]);

    const thumbRequestCount = await thumbRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: {
            $nin: [
              new ObjectId(rejectedStatusId._id),
              new ObjectId(cancelledStatusId._id),
            ],
          },
          thumbDate: {
            $gte: startOfMonth,
          },
        },
      },
      {
        $count: "count",
      },
    ]);

    // console.log("Permission Request Count:", permissionRequestCount);
    // console.log("Thumb Request Count:", thumbRequestCount);

    const totalCount =
      (permissionRequestCount[0]?.count || 0) +
      (thumbRequestCount[0]?.count || 0);

    // console.log("Total Count:", totalCount);

    return {
      status: true,
      totalCount,
      message: "You can apply for permission request",
    };
  } catch (error) {
    console.error("Error checking permission limit:", error);
    return {
      status: false,
      message: "Error checking permission limit",
    };
  }
};

const checkForIsInLeave = async (employeeId) => {
  // console.log("Checking leave status for employee:", employeeId);
  // console.log("Current IST Date and Time:", getISTDateAndTime());
  try {
    const leaveData = await leaveRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          endDate: {
            $gte: getISTDateAndTime(),
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "temporaryAssignmentId",
          foreignField: "_id",
          as: "temporaryAssignmentInfo",
        },
      },
      { $unwind: "$temporaryAssignmentInfo" },
      {
        $project: {
          _id: 0,
          notifyToId: "$temporaryAssignmentInfo._id",
          // notifyToName: {
          //   $concat: [
          //     "$temporaryAssignmentInfo.firstName",
          //     " ",
          //     "$temporaryAssignmentInfo.lastName",
          //   ],
          // },
          // notifyToCode: "$temporaryAssignmentInfo.employeeCode",
        },
      },
    ]);
    // if (leaveData && leaveData.length > 0) {
    // console.log("Leave data found:", leaveData[0]);
    return {
      success: true,
      data: leaveData[0] ? leaveData[0].notifyToId : new ObjectId(employeeId),
    };
    // }
    // // console.log("No leave data found for employee:", employeeId);
    // return {
    //   success: false,
    //   message: "No leave found",
    // };
  } catch (error) {
    console.error("Error checking leave status:", error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

// setTimeout(async () => {
// console.log(await checkForIsInLeave("68bd73d7b6e48cd8f49a5fa9"));

// }, 2000);

const processNotifyToIds = (ids) => {
  try {
    ids.map(async (id, index) => {
      const leaveStatus = await checkForIsInLeave(id);
      if (leaveStatus.success && leaveStatus.data) {
        ids[index] = leaveStatus.data;
      }
    });
    return {
      status: true,
      data: ids,
    };
  } catch (error) {
    console.error("Error in processNotifyToIds function:", error);
    return {
      status: false,
      data: [],
      message: "An error occurred while processing notifyTo IDs",
    };
  }
};

const getNotificationToken = async (employeeId) => {
  try {
    const tokens = await firebaseMessageingTockenSchema.aggregate([
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

// Notify logic based on role
// EMPLOYEE: notify MANAGERs and TEAM LEADs of the same team
// TEAM LEAD: notify MANAGERs of the same team
// MANAGER: notify HRs of the org
// HR: notify CEOs of the org
// CEO: notify HRs of the org

const getNotifyToData = async (teamId, roleId, orgId) => {
  try {
    // const teamId = new ObjectId(team);
    // const roleId = new ObjectId(role);
    // const orgId = new ObjectId(org);

    // console.log("This is team, role, org", teamId, roleId, orgId);

    const [ceoRole, cooRole, hrRole, managerRole, teamLeadRole, employeeRole] =
      await Promise.all([
        roleSchema.findOne({ orgId, name: "CEO" }).select("_id"),
        roleSchema.findOne({ orgId, name: "COO" }).select("_id"),
        roleSchema.findOne({ orgId, name: "HR" }).select("_id"),
        roleSchema.findOne({ orgId, name: "MANAGER" }).select("_id"),
        roleSchema.findOne({ orgId, name: "TEAM LEAD" }).select("_id"),
        roleSchema.findOne({ orgId, name: "EMPLOYEE" }).select("_id"),
      ]);

    if (!ceoRole || !hrRole || !managerRole || !teamLeadRole || !employeeRole) {
      console.log("One or more roles are not defined in the organization");
      return {
        status: false,
        data: [],
        message: "One or more roles are not defined in the organization",
      };
    }

    // console.log("This is teamId", teamId);
    if (teamId) {
      // Both teamLeads and managers arrays
      if (roleId.toString() === employeeRole._id.toString()) {
        // EMPLOYEE: notify MANAGERs and TEAM LEADs of the same team
        console.log("Coming for the Manager and the Team Lead");

        const data = await teamSchema.aggregate([
          {
            $match: {
              _id: teamId,
            },
          },
          {
            $lookup: {
              from: "firebasemessagingtokens",
              localField: "managerIds",
              foreignField: "employeeId",
              as: "managerTokens",
            },
          },
          {
            $lookup: {
              from: "firebasemessagingtokens",
              localField: "teamLeadIds",
              foreignField: "employeeId",
              as: "teamLeadTokens",
            },
          },
          {
            $project: {
              _id: 0,
              //   teamName: 1,
              tokens: {
                $concatArrays: [
                  "$managerTokens.token",
                  "$teamLeadTokens.token",
                ],
              },
              notifyTo: {
                $concatArrays: ["$managerIds", "$teamLeadIds"],
              },
            },
          },
        ]);

        // console.log("Data for Managers and Team Leads:", data);

        // const processedNotifyTo = processNotifyToIds(data[0]?.notifyTo || []);
        // if (!processedNotifyTo.status) {
        //   console.log(
        //     "Error processing notifyTo IDs:",
        //     processedNotifyTo.message
        //   );
        //   return {
        //     status: false,
        //     data: [],
        //     message: processedNotifyTo.message,
        //   };
        // }

        // console.log("Processed Notify To IDs:", processedNotifyTo.data);
        // console.log("Original Notify To IDs:", data[0]);
        // data[0].notifyTo = processedNotifyTo.data;

        return {
          status: true,
          data: data[0] || { notifyTo: [], tokens: [] },
        };
      }
      // Only Managers array
      else if (roleId.toString() === teamLeadRole._id.toString()) {
        // console.log("Coming for the managaer only");
        // TEAM LEAD: notify MANAGERs of the same team
        const data = await teamSchema.aggregate([
          {
            $match: {
              _id: teamId,
            },
          },
          {
            $lookup: {
              from: "firebasemessagingtokens",
              localField: "managerIds",
              foreignField: "employeeId",
              as: "managerTokens",
            },
          },
          {
            $project: {
              _id: 0,
              tokens: "$managerTokens.token",
              notifyTo: "$managerIds",
            },
          },
        ]);
        // console.log(data);

        // const processedNotifyTo = processNotifyToIds(data[0]?.notifyTo || []);
        // if (!processedNotifyTo.status) {
        //   console.log(
        //     "Error processing notifyTo IDs:",
        //     processedNotifyTo.message
        //   );
        //   return {
        //     status: false,
        //     data: [],
        //     message: processedNotifyTo.message,
        //   };
        // }

        // data[0].notifyTo = processedNotifyTo.data;

        if (!data[0] || !data[0].notifyTo || data[0].notifyTo.length === 0) {
          // console.log("No managers found in the team");
          // If no managers found in team, notify HR/COO instead
          const data = await Employees.aggregate([
            {
              $match: {
                orgId: orgId,
                roleId: {
                  $in: [hrRole?._id, cooRole?._id],
                },
              },
            },
            {
              $lookup: {
                from: "firebasemessagingtokens",
                localField: "_id",
                foreignField: "employeeId",
                as: "employeeTokens",
              },
            },
            {
              $project: {
                _id: 0,
                notifyTo: ["$_id"],
                tokens: "$employeeTokens.token",
              },
            },
            {
              $group: {
                _id: null,
                notifyTo: { $push: "$notifyTo" },
                tokens: { $push: "$tokens" },
              },
            },
            {
              $project: {
                _id: 0,
                notifyTo: {
                  $reduce: {
                    input: "$notifyTo",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] },
                  },
                },
                tokens: {
                  $reduce: {
                    input: "$tokens",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] },
                  },
                },
              },
            },
          ]);

          return {
            status: true,
            data: data[0] || { notifyTo: [], tokens: [] },
          };
        } else {
          return {
            status: true,
            data: data[0] || { notifyTo: [], tokens: [] },
          };
        }
      }

      // Only HRs array
      else if (roleId.toString() === managerRole._id.toString()) {
        // MANAGER / CEO: notify HRs of the org
        // console.log("Coming for the HRs only from the managers");
        const data = await Employees.aggregate([
          {
            $match: {
              orgId: orgId,
              roleId: {
                $in: [hrRole?._id, cooRole?._id],
              },
            },
          },
          {
            $lookup: {
              from: "firebasemessagingtokens",
              localField: "_id",
              foreignField: "employeeId",
              as: "employeeTokens",
            },
          },
          {
            $project: {
              _id: 0,
              notifyTo: ["$_id"],
              tokens: "$employeeTokens.token",
            },
          },
          {
            $group: {
              _id: null,
              notifyTo: { $push: "$notifyTo" },
              tokens: { $push: "$tokens" },
            },
          },
          {
            $project: {
              _id: 0,
              notifyTo: {
                $reduce: {
                  input: "$notifyTo",
                  initialValue: [],
                  in: {
                    $concatArrays: ["$$value", "$$this"],
                  },
                },
              },
              tokens: {
                $reduce: {
                  input: "$tokens",
                  initialValue: [],
                  in: {
                    $concatArrays: ["$$value", "$$this"],
                  },
                },
              },
            },
          },
        ]);

        // console.log("Data for HRs/COO from Managers:", data);

        // const processedNotifyTo = processNotifyToIds(data[0]?.notifyTo || []);
        // if (!processedNotifyTo.status) {
        //   console.log(
        //     "Error processing notifyTo IDs:",
        //     processedNotifyTo.message
        //   );
        //   return {
        //     status: false,
        //     data: [],
        //     message: processedNotifyTo.message,
        //   };
        // }

        // data[0].notifyTo = processedNotifyTo.data;

        return {
          status: true,
          data: data[0] || { notifyTo: [], tokens: [] },
        };
      }
    }

    // Only CEOs array
    if (
      roleId.toString() === hrRole._id.toString() ||
      roleId.toString() === cooRole?._id.toString()
    ) {
      console.log("Coming for the CEOs only from the HRs");
      // HR: notify CEOs of the org
      // const data = await Employees.aggregate([
      //   {
      //     $match: {
      //       orgId: orgId,
      //       roleId: ceoRole._id,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "firebasemessagingtokens",
      //       localField: "_id",
      //       foreignField: "employeeId",
      //       as: "employeeTokens",
      //     },
      //   },
      //   {
      //     $project: {
      //       notifyTo: ["$_id"],
      //       tokens: "$employeeTokens.token",
      //     },
      //   },
      // ]);

      const data = await Employees.aggregate([
        {
          $match: {
            orgId: orgId,
            // roleId: hrRole._id,
            roleId: {
              $in: [hrRole?._id, ceoRole?._id, cooRole?._id],
            },
          },
        },
        {
          $lookup: {
            from: "firebasemessagingtokens",
            localField: "_id",
            foreignField: "employeeId",
            as: "employeeTokens",
          },
        },
        {
          $project: {
            _id: 0,
            notifyTo: ["$_id"],
            tokens: "$employeeTokens.token",
          },
        },
        {
          $group: {
            _id: null,
            notifyTo: { $push: "$notifyTo" },
            tokens: { $push: "$tokens" },
          },
        },
        {
          $project: {
            _id: 0,
            notifyTo: {
              $reduce: {
                input: "$notifyTo",
                initialValue: [],
                in: {
                  $concatArrays: ["$$value", "$$this"],
                },
              },
            },
            tokens: {
              $reduce: {
                input: "$tokens",
                initialValue: [],
                in: {
                  $concatArrays: ["$$value", "$$this"],
                },
              },
            },
          },
        },
      ]);

      // const processedNotifyTo = processNotifyToIds(data[0]?.notifyTo || []);
      // if (!processedNotifyTo.status) {
      //   console.log(
      //     "Error processing notifyTo IDs:",
      //     processedNotifyTo.message
      //   );
      //   return {
      //     status: false,
      //     data: [],
      //     message: processedNotifyTo.message,
      //   };
      // }

      // data[0].notifyTo = processedNotifyTo.data;

      return {
        status: true,
        data: data[0] || { notifyTo: [], tokens: [] },
      };
    }

    // Only HRs array
    else {
      // console.log("Coming for the HRs only");
      const data = await Employees.aggregate([
        {
          $match: {
            orgId: orgId,
            // roleId: hrRole._id,
            roleId: {
              $in: [hrRole?._id, cooRole?._id],
            },
          },
        },
        {
          $lookup: {
            from: "firebasemessagingtokens",
            localField: "_id",
            foreignField: "employeeId",
            as: "employeeTokens",
          },
        },
        {
          $project: {
            _id: 0,
            notifyTo: ["$_id"],
            tokens: "$employeeTokens.token",
          },
        },
        {
          $group: {
            _id: null,
            notifyTo: { $push: "$notifyTo" },
            tokens: { $push: "$tokens" },
          },
        },
        {
          $project: {
            _id: 0,
            notifyTo: {
              $reduce: {
                input: "$notifyTo",
                initialValue: [],
                in: {
                  $concatArrays: ["$$value", "$$this"],
                },
              },
            },
            tokens: {
              $reduce: {
                input: "$tokens",
                initialValue: [],
                in: {
                  $concatArrays: ["$$value", "$$this"],
                },
              },
            },
          },
        },
      ]);

      // console.log("Debug");
      // console.log("Data for HRs/COO from Managers:", data);

      // const processedNotifyTo = processNotifyToIds(data[0]?.notifyTo || []);
      // if (!processedNotifyTo.status) {
      //   console.log(
      //     "Error processing notifyTo IDs:",
      //     processedNotifyTo.message
      //   );
      //   return {
      //     status: false,
      //     data: [],
      //     message: processedNotifyTo.message,
      //   };
      // }
      // data[0].notifyTo = processedNotifyTo.data;

      return {
        status: true,
        data: data[0] || { notifyTo: [], tokens: [] },
      };
    }
  } catch (error) {
    console.error("Error in getNotifyToData function:", error);
    return {
      status: false,
      data: [],
      message: "An error occurred while fetching notifyTo data",
    };
  }
};

// Create a new thumb request
const createThumbRequest = async (req, res) => {
  try {
    const { requestFor, thumbDate, reason, punchType } = req.body;

    // console.log("Request Body:", req.body);
    const employeeId = req.user._id;

    //   console.log("This is Thumb Time ", punchType);
    // console.log("This is Thumb Time ", changeGTMtoIST(new Date(punchType)));

    // Validate required fields
    if (!requestFor || !thumbDate || !punchType) {
      console.log("Validation failed:", { requestFor, thumbDate, punchType });
      return res.status(400).json({ message: "All fields are required." });
    }

    if (punchType.trim() === "") {
      return res.status(400).json({ message: "Punch Type can not be empty" });
    }

    // Check if requestFor exists
    const requestType = await AttendenceRequestType.findById(requestFor);
    if (!requestType) {
      return res.status(404).json({ message: "Request type not found." });
    }

    // const todayDate = getISTDateAndTime();
    // console.log("Today Date", todayDate, "Thumb Date", new Date(thumbDate));

    if (new Date(thumbDate) > getISTDateAndTime()) {
      return res
        .status(400)
        .json({ message: "Thumb date cannot be in the future." });
    }

    // Get the first day of the previous month
    const startOfMonth = changeGTMtoIST(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    // console.log(
    //   "Start of the month",
    //   startOfMonth,
    //   "Thumb Date",
    //   new Date(thumbDate)
    // );

    // console.log(
    //   "Start of the month",
    //   startOfMonth,
    //   "Thumb Date",
    //   new Date(thumbDate)
    // );
    // console.log(new Date(thumbDate) < startOfMonth);
    if (new Date(thumbDate) < startOfMonth) {
      return res.status(400).json({
        message:
          "You are not able to apply for a Thumb request for the past month.",
      });
    }

    fromDateStart = new Date(thumbDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    toDateEnd = new Date(thumbDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);
    console.log(fromDateStart, toDateEnd);

    // Find attendance record for the date, considering either logInTime or logOutTime falls within the day
    const checkAttendance = await dailyAttendenceSchema.findOne({
      employeeId,
      $or: [
        {
          logInTime: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
        },
        {
          logOutTime: {
            $gte: fromDateStart,
            $lte: toDateEnd,
          },
        },
      ],
    });

    // console.log("Check Attendance", checkAttendance);

    if (!checkAttendance) {
      return res.status(400).json({
        message:
          "You are not able to apply for a Thumb request for the date you have not attended.",
      });
    }

    // console.log("Check env", process.env.NODE_ENV);

    if (
      checkAttendance &&
      checkAttendance.logInTime &&
      checkAttendance.logOutTime &&
      process.env.NODE_ENV !== "staging"
    ) {
      return res.status(400).json({
        message:
          "You are not able to apply for a Thumb request for the date you have attended.",
      });
    }

    const [
          rejectedStatusId,
          cancelledStatusId,
        ] = await Promise.all([
          statusSchema.findOne({ orgId: req.user.orgId, statusType: "REJECTED" }, { _id: 1 }),
          statusSchema.findOne({ orgId: req.user.orgId, statusType: "CANCELLED" }, { _id: 1 }),
        ]);

    const alreadyExists = await thumbRequestSchema.findOne({
      employeeId,
      thumbDate: {
        $gte: new Date(new Date(thumbDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(thumbDate).setUTCHours(23, 59, 59, 999)),
      },
      statusId: {
          $nin: [
            new ObjectId(rejectedStatusId._id),
            new ObjectId(cancelledStatusId._id),
          ],
        },
    });

    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "You have already applied for this date." });
    }

    const acceptedStatusId = await statusSchema.findOne({
      orgId: req?.user?.orgId,
      statusType: "ACCEPTED",
    });

    if (!acceptedStatusId) {
      return res.status(400).json({ message: "Accepted Status not found" });
    }

    // const limitCheck = await checkForLimit(
    //   employeeId,
    //   req.user.orgId,
    //   thumbDate.toString().split("T")[0]
    // );
    // if (!limitCheck.status) {
    //   return res.status(400).json({ message: limitCheck.message });
    // }

    // if (limitCheck.totalCount >= 3) {
    //   return res.status(400).json({
    //     message:
    //       "You have reached the maximum limit of 3 thumb and permission requests for this month.",
    //   });
    // }

    const ThumbRequestCount = await thumbRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          statusId: new ObjectId(acceptedStatusId._id),
          thumbDate: {
            $gte: startOfMonth,
          },
        },
      },
      {
        $count: "count",
      },
    ]);

    if (ThumbRequestCount[0]?.count >= 3) {
      return res.status(400).json({
        message:
          "You have reached the maximum limit of 3 thumb requests for this month.",
      });
    }

    // Get initial status (assuming "PENDING" status exists)
    const pendingStatusTypeId = await statusSchema.findOne({
      orgId: req.user.orgId,
      statusType: "PENDING",
    });

    if (!pendingStatusTypeId) {
      return res.status(500).json({ message: "PENDING status not found." });
    }

    // // console.log(checkForHolidays)

    // if (!checkForHolidays.status) {
    //   return res
    //     .status(400)
    //     .json({ message: "You are not able to apply for Non Working Days" });
    // }

    const requiredData = await getNotifyToData(
      req?.user?.teamId,
      req?.user?.roleId,
      req?.user?.orgId
    );

    if (!requiredData.status) {
      return res.status(500).json({
        message: "Failed to get notifyTo data",
        error: requiredData.message,
      });
    }

    // console.log("Notify To IDs", requiredData.data);

    if (
      !requiredData.data ||
      !requiredData.data.notifyTo ||
      requiredData.data.notifyTo.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "No one to notify, Please contact Admin" });
    }

    // console.log("Required Data", requiredData);

    // Create new thumb request
    const newThumbRequest = new thumbRequestSchema({
      orgId: req.user.orgId,
      employeeId,
      requestFor,
      shiftId: req?.user?.shiftId ? req?.user?.shiftId : null,
      punchType,
      thumbDate,
      reason: reason || "",
      actionedAt: getISTDateAndTime(),
      notifyTo: requiredData.data.notifyTo,
      statusId: pendingStatusTypeId._id,
    });
    await newThumbRequest.save();

    logger.info(
      `Thumb request with reason '${reason}' created by user ${req.user.firstName} ${req.user.lastName}`
    );
    const title = "Thumb Request Created";
    const body = `A new thumb request has been Raised by ${req.user.firstName}.`;
    const data = {
      thumbDate: newThumbRequest.thumbDate,
      reason,
      requestType: requestType.name,
    };

    // console.log("Tokens to send", requiredData.data.tokens);
    await sendNotificationtoTokens(requiredData.data.tokens, title, body, data);

    res.status(201).json({ message: "Thumb request created successfully." });
  } catch (error) {
    console.error("Error creating thumb request:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// it need to implement same like the above function with few changes
const getThumbRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    // console.log("This is from Date and to Date", fromDate, toDate);

    // Validate date range
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    const fromDateStart = changeGTMtoIST(new Date(fromDate));
    // console.log("From Date Start before setting hours", fromDateStart);
    fromDateStart.setUTCHours(0, 0, 0, 0);

    const toDateEnd = changeGTMtoIST(new Date(toDate));
    // console.log("To Date End before setting hours", toDateEnd);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log(
    //   "from Date Start",
    //   fromDateStart,
    //   " toDate End ",
    //   toDateEnd,
    //   " in getThubRequest Section"
    // );
    if (fromDateStart > toDateEnd) {
      return res
        .status(400)
        .json({ error: "From date must be before to date" });
    }

    const employeeId = req.user._id;

    const thumbRequests = await thumbRequestSchema.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          $or: [
            {
              thumbDate: {
                $lte: toDateEnd,
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
          from: "attendencestatustypes",
          localField: "requestFor",
          foreignField: "_id",
          as: "requestTypeInfo",
          pipeline: [{ $project: { _id: 0, name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "statusInfo",
          pipeline: [{ $project: { _id: 0, statusType: 1 } }],
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
                  $in: ["$_id", { $ifNull: ["$$notifyIds", []] }],
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
          as: "notifyToInfo",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "employeeInfo",
          pipeline: [
            {
              $project: {
                _id: 0,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          thumbDate: 1,
          punchType: 1,
          reason: 1,
          createdAt: 1,
          actionReason: 1,
          updatedAt: "$actionedAt",

          requestFor: {
            $ifNull: [{ $first: "$requestTypeInfo.name" }, null],
          },
          status: {
            $ifNull: [{ $first: "$statusInfo.statusType" }, null],
          },

          notifyTo: {
            $cond: [
              {
                $gt: [{ $size: "$notifyToInfo" }, 0],
              },
              {
                $map: {
                  input: "$notifyToInfo",
                  as: "n",
                  in: "$$n.fullName",
                },
              },
              null,
            ],
          },

          actionedBy: {
            $cond: [
              {
                $gt: [{ $size: "$employeeInfo" }, 0],
              },
              {
                $concat: [
                  {
                    $first: "$employeeInfo.firstName",
                  },
                  " ",
                  { $first: "$employeeInfo.lastName" },
                ],
              },
              null,
            ],
          },
        },
      },
    ]);
    return res.status(200).json({
      message: "All Thumb Requests fetched successfully",
      "No.of Records": thumbRequests.length,
      data: thumbRequests,
    });
  } catch (error) {
    console.error("Error fetching thumb requests:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Process (approve/reject/escalate) a thumb request
const processThumbRequest = async (req, res) => {
  try {
    const { thumbRequestId, statusId, actionReason } = req.body;
    const employeeId = req?.user?._id;

    // Validate required fields
    if (!thumbRequestId || !statusId) {
      return res.status(400).json({
        message: "Thumb request ID and status ID are required",
      });
    }

    const [status, thumbRequest, superAdmin] = await Promise.all([
      statusSchema.findById({ _id: statusId }, { statusType: 1 }),
      thumbRequestSchema.findById(thumbRequestId),
      privilegeSchema.find(
        { orgId: req?.user?.orgId, name: "SUPERADMIN" },
        { _id: 1 }
      ),
    ]);

    const statusTypes = {
      ACCEPTED: "ACCEPTED",
      REJECTED: "REJECTED",
      ESCALATED: "ESCALATED",
    };

    if (
      !status ||
      !status.statusType ||
      !Object.values(statusTypes).includes(status.statusType)
    ) {
      return res.status(400).json({ message: "Invalid status ID" });
    }

    if (!thumbRequest) {
      return res.status(404).json({ message: "Thumb request not found" });
    }

    if (
      !thumbRequest.notifyTo.includes(employeeId) &&
      req.user.privilegeId.toString() !== superAdmin[0]._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to process this request" });
    }

    // const limitCheck = await checkForLimit(
    //   thumbRequest.employeeId,
    //   req.user.orgId,
    //   thumbRequest.thumbDate.toString().split("T")[0]
    // );
    // if (!limitCheck.status) {
    //   return res.status(400).json({ message: limitCheck.message });
    // }

    // if (
    //   limitCheck.totalCount > 3 &&
    //   status.statusType === statusTypes.ACCEPTED
    // ) {
    //   return res.status(400).json({
    //     message:
    //       "The employee has reached the maximum limit of 3 thumb and permission requests for this month.",
    //   });
    // }

    const actionList = {
      actionedBy: employeeId,
      statusId: statusId,
      actionReason: actionReason || "",
      createdAt: getISTDateAndTime(),
    };

    thumbRequest.approvalList.push(actionList);
    thumbRequest.statusId = statusId;
    thumbRequest.actionedBy = employeeId;
    actionReason && (thumbRequest.actionReason = actionReason);
    thumbRequest.actionedAt = getISTDateAndTime();
    thumbRequest.updatedAt = getISTDateAndTime();

    await thumbRequest.save();

    logger.info(
      `Thumb request with ID '${thumbRequestId}' processed by user ${req.user.firstName} ${req.user.lastName} with status ${status.statusType}`
    );
    const data = {
      thumbDate: thumbRequest.thumbDate,
      reason: thumbRequest.reason,
      requestType: thumbRequest.requestFor,
    };

    const fromDate = new Date(thumbRequest.thumbDate);
    fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = new Date(thumbRequest.thumbDate);
    toDate.setUTCHours(23, 59, 59, 999);

    // console.log("From Date", fromDate, " To Date ", toDate);

    // Process the thumb request based on its status
    if (status.statusType === statusTypes.ACCEPTED) {
      // Find attendance record for the date, considering either logInTime or logOutTime falls within the day
      const attendanceRecord = await dailyAttendenceSchema.findOne({
        employeeId: thumbRequest.employeeId,
        $or: [
          {
            logInTime: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
          {
            logOutTime: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        ],
      });

      // console.log("Attendance Record", attendanceRecord);

      if (!attendanceRecord) {
        return res
          .status(400)
          .json({ message: "No attendance record found for the thumb date." });
      }

      const [firstHalfId, secondHalfId, presentId, fullDayId] =
        await Promise.all([
          AttendenceRequestType.findOne({
            orgId: req.user.orgId,
            shortName: "FH",
          }).select("_id"),
          AttendenceRequestType.findOne({
            orgId: req.user.orgId,
            shortName: "SH",
          }).select("_id"),
          AttendenceRequestType.findOne({
            orgId: req.user.orgId,
            shortName: "P",
          }).select("_id"),
          AttendenceRequestType.findOne({
            orgId: req.user.orgId,
            shortName: "P",
          }).select("_id"),
        ]);

      const shiftInfo = await thumbRequestSchema.aggregate([
        {
          $match: {
            _id: new ObjectId(thumbRequestId),
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
          $project: {
            startTime: {
              $first: "$shiftInfo.startTime",
            },
            breakTime: {
              $first: "$shiftInfo.breakTime",
            },
            endTime: { $first: "$shiftInfo.endTime" },
          },
        },
      ]);

      // console.log(today);
      const date = thumbRequest.thumbDate.toISOString().split("T")[0];
      // const time = "04:30";
      // const shiftStartBase = new Date(`${date}T${time}:00Z`);
      // console.log(shiftStartBase);

      if (thumbRequest.requestFor.toString() === firstHalfId._id.toString()) {
        // first half
        // attendanceRecord.logOutTime = attendanceRecord.logInTime;
        // attendanceRecord.logInTime = thumbRequest.thumbTime;

        if (thumbRequest.punchType === "IN") {
          attendanceRecord.logInTime = new Date(
            `${date}T${shiftInfo[0].startTime}:00Z`
          );
        } else {
          attendanceRecord.logOutTime = new Date(
            `${date}T${shiftInfo[0].breakTime}:00Z`
          );
        }

        if (
          attendanceRecord.statusId.toString() === firstHalfId._id.toString()
        ) {
          attendanceRecord.statusId = presentId._id;
        } else if (
          attendanceRecord.statusId.toString() === fullDayId._id.toString()
        ) {
          attendanceRecord.statusId = secondHalfId._id;
        }
      } else if (
        thumbRequest.requestFor.toString() === secondHalfId._id.toString()
      ) {
        // second half
        // attendanceRecord.logOutTime = thumbRequest.thumbTime;
        if (thumbRequest.punchType === "IN") {
          attendanceRecord.logInTime = new Date(
            `${date}T${shiftInfo[0].breakTime}:00Z`
          );
        } else {
          attendanceRecord.logOutTime = new Date(
            `${date}T${shiftInfo[0].endTime}:00Z`
          );
        }
        if (
          attendanceRecord.statusId.toString() === secondHalfId._id.toString()
        ) {
          attendanceRecord.statusId = presentId._id;
        } else if (
          attendanceRecord.statusId.toString() === fullDayId._id.toString()
        ) {
          attendanceRecord.statusId = firstHalfId._id;
        }
      } else {
        return res
          .status(400)
          .json({ message: "Invalid Status Id in RequestFor field" });
      }

      attendanceRecord.thumbId = thumbRequest._id;

      const timeDuration = Number(
        (
          (attendanceRecord.logOutTime - attendanceRecord.logInTime) /
          (1000 * 60 * 60)
        ).toFixed(2)
      );

      if (
        timeDuration >= 6 &&
        attendanceRecord.statusId?.toString() !== presentId._id.toString()
      ) {
        attendanceRecord.statusId = presentId._id;
      }

      attendanceRecord.totalHours = timeDuration;
      attendanceRecord.finalizedAt = getISTDateAndTime();
      attendanceRecord.updatedAt = getISTDateAndTime();

      const isHalfDay =
        attendanceRecord.statusId?.toString() === firstHalfId._id.toString() ||
        attendanceRecord.statusId?.toString() === secondHalfId._id.toString();
      attendanceRecord.halfDay = !!isHalfDay;

      await attendanceRecord.save();

      console.log(`Thumb request ${thumbRequestId} accepted`);
      // Send notification to the employee
      const tokens = await getNotificationToken(thumbRequest.employeeId);

      const title = `Update On Your Thumb Request`;
      const body = `Your Thumb Request has been ${status.statusType}. Please review it.`;
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
    } else if (status.statusType === statusTypes.REJECTED) {
      console.log(`Thumb request ${thumbRequestId} rejected`);
      // Send notification to the employee
      const tokens = await getNotificationToken(thumbRequest.employeeId);
      const title = `Update On Your Thumb Request`;
      const body = `Your Thumb Request has been ${status.statusType}. Please review it.`;
      const response = await sendNotificationtoTokens(
        tokens,
        title,
        body,
        data
      );
      if (!response.success) {
        console.warn("Failed to send notification:", response.error);
      } else {
        console.log(
          `Notification sent successfully to ${thumbRequest.employeeId}`,
          data
        );
        // console.log("This is Title", title);
        // console.log("This is Body", body);
      }
    } else if (status.statusType === statusTypes.ESCALATED) {
      console.log(`Thumb request ${thumbRequestId} escalated`);
      // Send notification to the notifyTo employee

      const requiredData = await getNotifyToData(
        req?.user?.teamId,
        req?.user?.roleId,
        req?.user?.orgId
      );

      if (!requiredData.status) {
        return res.status(500).json({
          message: "Errror While Notifying ",
          error: requiredData.message,
        });
      }

      console.log("This is required Data", requiredData);

      // check if i am sending notify to the same employee who raised the request or not
      if (thumbRequest.employeeId.toString() in requiredData.data.notifyTo) {
        return res.status(400).json({
          message:
            "You cannot forward the request to the same employee who raised it.",
        });
      }

      // filter the notify to array to remove the employee who have already actioned the request
      // console.log(thumbRequest.approvalList);
      const approvalIds = thumbRequest.approvalList
        .map((item, index) => {
          if (index === thumbRequest.approvalList.length - 1) return;
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

      thumbRequest.notifyTo = filteredNotifyTo;
      await thumbRequest.save();

      const title = `${data.employee}'s Thumb Request Forwarded from ${req.user.firstName} to You`;
      const body = `${data.employee}'s Thumb Request has been forwarded to You. Please review it.`;
      const response = await sendNotificationtoTokens(
        requiredData.data.tokens,
        title,
        body
      );
      if (!response.success) {
        console.warn("Failed to send notification:", response.error);
        // res.status(500).json({
        //   message: "Failed to send the Notification for this request",
        // });
      } else {
        console.log(`Notification sent successfully`, data);
        console.log("This is Title", title);
        console.log("This is Body", body);
      }
    }

    return res
      .status(200)
      .json({ message: "Thumb request processed successfully" });
  } catch (error) {
    console.error("Error while processing thumb request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Fetch thumb requests that require action from the logged-in user
const getActionRequiredThumbs = async (req, res) => {
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

    console.log("This is from Date and to Date", fromDate, toDate);

    const fromDateStart = new Date(fromDate);
    fromDateStart.setUTCHours(0, 0, 0, 0);
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    console.log(
      "This is from Date and to Date after setting time",
      fromDateStart,
      toDateEnd
    );

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
    const pendingRequests = await thumbRequestSchema.aggregate([
      {
        $match: {
          notifyTo: new ObjectId(employeeId),
          $or: [
            {
              thumbDate: {
                $lte: toDateEnd,
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
          from: "attendencestatustypes",
          localField: "requestFor",
          foreignField: "_id",
          as: "requestTypeInfo",
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
          thumbDate: 1,
          reason: 1,
          punchType: 1,
          createdAt: 1,
          updatedAt: "$actionedAt",
          Status: { $first: "$Status.statusType" },
          requestType: { $first: "$requestTypeInfo.name" },
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
    return res.status(200).json(
      (message = {
        message: "Action required thumb requests fetched successfully",
        "No.of Records": pendingRequests.length,
        data: pendingRequests,
      })
    );
  } catch (error) {
    console.error("Error fetching thumb actions:", error);
    return res

      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getNotifyToNames = async (req, res) => {
  try {
    const { thumbRequestId } = req.body;
    if (!thumbRequestId) {
      return res.status(400).json({ message: "thumbRequestId is required" });
    }

    const names = await thumbRequestSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(thumbRequestId),
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

const getAllThumbRequestsData = async (
  fromDateStart,
  toDateEnd,
  statusArray,
  orgId
) => {
  try {
    const matchStage = {
      thumbDate: {
        $lte: toDateEnd,
        $gte: fromDateStart,
      },
    };

    if (statusArray.length > 0) {
      matchStage.statusId = { $in: statusArray };
    }

    const thumbRequests = await thumbRequestSchema.aggregate([
      {
        $match: matchStage,
      },

      {
        $lookup: {
          from: "attendencestatustypes",
          localField: "requestFor",
          foreignField: "_id",
          as: "requestTypeInfo",
          pipeline: [{ $project: { _id: 0, name: 1 } }],
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
          from: "statustypes",
          localField: "statusId",
          foreignField: "_id",
          as: "statusInfo",
          pipeline: [{ $project: { _id: 0, statusType: 1 } }],
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
                  $in: ["$_id", { $ifNull: ["$$notifyIds", []] }],
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
          as: "notifyToInfo",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionedBy",
          foreignField: "_id",
          as: "employeeInfo",
          pipeline: [
            {
              $project: {
                _id: 0,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          thumbDate: 1,
          punchType: 1,
          reason: 1,
          createdAt: 1,
          actionReason: 1,
          updatedAt: "$actionedAt",

          requestFor: {
            $ifNull: [{ $first: "$requestTypeInfo.name" }, null],
          },
          status: {
            $ifNull: [{ $first: "$statusInfo.statusType" }, null],
          },

          notifyTo: {
            $cond: [
              {
                $gt: [{ $size: "$notifyToInfo" }, 0],
              },
              {
                $map: {
                  input: "$notifyToInfo",
                  as: "n",
                  in: "$$n.fullName",
                },
              },
              null,
            ],
          },

          requestedBy: {
            $concat: [
              { $first: "$requestedByInfo.firstName" },
              " ",
              { $first: "$requestedByInfo.lastName" },
            ],
          },

          actionedBy: {
            $cond: [
              {
                $gt: [{ $size: "$employeeInfo" }, 0],
              },
              {
                $concat: [
                  {
                    $first: "$employeeInfo.firstName",
                  },
                  " ",
                  { $first: "$employeeInfo.lastName" },
                ],
              },
              null,
            ],
          },
        },
      },
    ]);

    return {
      status: true,
      data: thumbRequests,
    };
  } catch (error) {
    console.log("Error While fetching the Thumb Requests ", error);
    return {
      status: false,
      message: error.message,
    };
  }
};

// function to get all thumb requests of an employee with date filter
const getAllThumbRequests = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    // console.log("This is from Date and to Date", fromDate, toDate);

    // Validate date range
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Required date range is missing" });
    }

    const fromDateStart = changeGTMtoIST(new Date(fromDate));
    // console.log("From Date Start before setting hours", fromDateStart);
    fromDateStart.setUTCHours(0, 0, 0, 0);

    const toDateEnd = changeGTMtoIST(new Date(toDate));
    // console.log("To Date End before setting hours", toDateEnd);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    // console.log(
    //   "from Date Start",
    //   fromDateStart,
    //   " toDate End ",
    //   toDateEnd,
    //   " in getThubRequest Section"
    // );
    if (fromDateStart > toDateEnd) {
      return res
        .status(400)
        .json({ error: "From date must be before to date" });
    }

    const thumbRequests = await getAllThumbRequestsData(
      fromDateStart,
      toDateEnd,
      [],
      req.user.orgId
    );

    if (!thumbRequests.status) {
      return res.status(404).json({
        message: "Error While fetching Thumbs requests",
        error: thumbRequests.message,
      });
    }

    return res.status(200).json({
      message: "All Thumb Requests fetched successfully",
      "No.of Records": thumbRequests.data.length,
      data: thumbRequests.data,
    });
  } catch (error) {
    console.error("Error fetching thumb requests:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const cancelThumbRequest = async (req, res) => {
  try {
    const { thumbRequestId } = req.body;
    const employeeId = req?.user?._id;
    if (!thumbRequestId) {
      return res.status(400).json({ message: "thumbRequestId is required" });
    }

    const thumbRequest = await thumbRequestSchema.findOne({
      _id: thumbRequestId,
    });

    if (!thumbRequest) {
      return res.status(404).json({ message: "Thumb request not found" });
    }

    const [acceptedStatusId, cancelledStatusId, superAdminId] =
      await Promise.all([
        statusSchema.findOne(
          { orgId: req.user.orgId, statusType: "ACCEPTED" },
          { _id: 1 }
        ),
        statusSchema.findOne(
          { orgId: req.user.orgId, statusType: "CANCELLED" },
          { _id: 1 }
        ),
        employeeSchema.findOne(
          { orgId: req.user.orgId, name: "SUPERADMIN" },
          { _id: 1 }
        ),
      ]);

    if (thumbRequest.statusId.toString() === acceptedStatusId._id.toString()) {
      return res
        .status(400)
        .json({ message: "Accepted thumb request cannot be cancelled" });
    }

    if (
      thumbRequest.employeeId.toString() !== employeeId.toString() &&
      req.user.privilegeId.toString() !== superAdminId._id.toString() &&
      !thumbRequest.notifyTo.includes(employeeId)
    ) {
      return res.status(403).json({
        message: "You are not authorized to cancel this thumb request",
      });
    }

    thumbRequest.statusId = cancelledStatusId._id;
    await thumbRequest.save();

    return res
      .status(200)
      .json({ message: "Thumb request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling thumb request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// setTimeout(async () => {
//   console.log("process Started", new Date());
//   // getNotifyToData('teamId', 'roleId', 'orgId');
//   data = await getNotifyToData(
//     null,
//     "68bbfb1106e9159927029312",
//     "68bbfb1106e9159927029312"
//   );
//  const  processNotifyToId = await processNotifyToIds(data.data.data);
//   console.log(processNotifyToId);
//   console.log("process ended", new Date());
// }, 1000);

// setTimeout(async () => {
//   const employee = await employeeSchema.findOne({
//     employeeCode: "4299"
//   })

//   employee.officeMail = 'jonathan@technicalhub.io';
//   await employee.save();

// }, 1000);

// setTimeout(async () => {
//  console.log("Process Started for the limit checking", new Date());
//  const check = await checkForLimit(
//    "68bc7a2cf5a9d0213efba7c0",
//     "68bbfb1106e9159927029312"
//   );
//   console.log(check);
//   console.log("Process Ended for the limit checking", new Date());
// }, 2000);

// setTimeout(async () => {
//   console.log("Process Start");
//   try {
//     const changed = await thumbRequestSchema.updateMany(
//       {},
//       {
//         $set: {
//           shiftId: new ObjectId("68bbfc2406e91599270293ab"),
//         },
//       }
//     );
//     console.log(changed);
//     console.log("Process completed");
//   } catch (error) {
//     console.error("Error updating shiftId:", error);
//   }
// }, 10000);

// setTimeout(async () => {
//   console.log("Process Start for adding the employeeId in the approvalList");
//   const thumbTime = await thumbRequestSchema.aggregate([
//     {
//       $match: {
//         _id: new ObjectId("68d0eabc090c5c70983329b6"),
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
//       $project: {
//         startTime: {
//           $first: "$shiftInfo.startTime",
//         },
//         breakTime: {
//           $first: "$shiftInfo.breakTime",
//         },
//         endTime: { $first: "$shiftInfo.endTime" },
//       },
//     },
//   ]);

//   console.log(thumbTime[0]);
// }, 2000);

// setTimeout(() => {
//   const today = getISTDateAndTime();
//   console.log(today);
//   const date = today.toISOString().split('T')[0];
//   const time = "04:30";
//   const shiftStartBase = new Date(`${date}T${time}:00Z`);
//   console.log(shiftStartBase);
// }, 1000);

// setTimeout(async () => {
//     const data = await privilegeSchema.find({ orgId: req?.user?.orgId, name: "SUPERADMIN" },{ _id: 1 });
//     console.log(data[0]._id);
// }, 1000);

module.exports = {
  createThumbRequest,
  getNotifyToData,
  getThumbRequests,
  processThumbRequest,
  getActionRequiredThumbs,
  getNotifyToNames,
  checkForLimit,
  getAllThumbRequests,
  getAllThumbRequestsData,
  cancelThumbRequest,
};
