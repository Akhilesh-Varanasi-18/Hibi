const firebaseMessagingTokenSchema = require("../../models/firebaseMessageingTockenSchema");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const admin = require("../../middleware/firebase");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Controller to add or update Firebase token
const addOrUpdateFirebaseToken = async (req, res) => {
  try {
    const { token } = req.body;
    const employeeId = req.user._id;

    if (!token || !employeeId) {
      return res
        .status(400)
        .json({ message: "Token and Employee ID are required" });
    }

    // Search by employeeId to check if token already exists
    const existingToken = await firebaseMessagingTokenSchema.findOne({
      employeeId,
    });

    if (existingToken) {
      existingToken.token = token;
      existingToken.updatedAt = getISTDateAndTime();
      await existingToken.save();

      return res
        .status(200)
        .json({ message: "Firebase token updated successfully" });
    } else {
      // Create new token record
      const newToken = new firebaseMessagingTokenSchema({
        employeeId,
        token,
        createdAt: getISTDateAndTime(),
        updatedAt: getISTDateAndTime(),
      });

      await newToken.save();
      return res
        .status(201)
        .json({ message: "Firebase token added successfully" });
    }
  } catch (error) {
    console.error("Error in addOrUpdateFirebaseToken:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// function to send notifications
// const sendNotificationtoToken = async (token, title, body, data = {}) => {
//   const message = {
//     token,
//     notification: {
//       title,
//       body,
//     },
//     data,
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     console.log("Message sent successfully:", response);
//   }
//   catch (error) {
//     console.error("Error sending message:", error);
//   }
// }

// function to send notifications to multiple tokens
const sendNotificationtoTokens = async (tokens, title, body, data = {}) => {
  // if (tokens?.length === 0) {
  //   return {
  //     success: false,
  //     message: "No valid tokens provided",
  //   };
  // }
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn("No valid tokens provided to send notifications");
    return {
      success: false,
      message: "No valid tokens provided",
    };
  }
  const message = {
    notification: {
      title,
      body,
    },
    data,
    tokens,
  };

  // console.log("This is tokens from final", tokens);
  // try {
  //   const response = await admin.messaging().sendEachForMulticast({
  //     tokens,
  //     notification: message.notification,
  //     data: message.data,
  //   });

  //   console.log(
  //     `Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`
  //   );

  //   if (response.failureCount > 0) {
  //     const failedTokens = [];
  //     response.responses.forEach((resp, idx) => {
  //       if (!resp.success) {
  //         failedTokens.push(tokens[idx]);
  //       }
  //     });
  //     console.log("These tokens failed:", failedTokens);
  //     return {
  //       success: false,
  //       successCount: response.successCount,
  //       failureCount: response.failureCount,
  //       failedTokens,
  //     };
  //   } else {
  //     return {
  //       success: true,
  //       successCount: response.successCount,
  //       failureCount: response.failureCount,
  //     };
  //   }
  // }
  // catch (error) {
  //   console.error("Error sending multicast message:", error);
  //   return {
  //     success: false,
  //     error: error.message,
  //   };
  // }

  try {
    const validNotification =
      message.notification &&
      typeof message.notification.title === "string" &&
      typeof message.notification.body === "string";

    const validData =
      message.data &&
      Object.entries(message.data).every(
        ([key, value]) => typeof key === "string" && typeof value === "string"
      );

    if (!validNotification && !validData) {
      console.error(
        "[FCM] Invalid payload — missing or malformed notification/data"
      );
      console.error("Received message:", JSON.stringify(message, null, 2));
      return { success: false, error: "Invalid payload" };
    }

    const payload = {
      tokens,
      ...(validNotification ? { notification: message.notification } : {}),
      ...(validData ? { data: message.data } : {}),
    };

    // console.log("[FCM] Final payload to send:", JSON.stringify(payload, null, 2));

    const response = await admin.messaging().sendEachForMulticast(payload);

    console.log(
      `[FCM] Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`
    );

    const failedTokens = [];

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        const token = tokens[idx];
        if (!resp.success) {
          const errorCode = resp.error?.code || "unknown_error";
          console.error(`[FCM] Failed to send to token: ${token}`);
          console.error(`Error code: ${errorCode}`);

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          ) {
            console.warn("[FCM] Marking token for removal:", token);
            failedTokens.push(token);
          }

          if (
            errorCode === "messaging/internal-error" ||
            errorCode === "messaging/unavailable" ||
            errorCode === "messaging/server-unavailable"
          ) {
            console.warn("[FCM] Temporary error — retrying in 2 seconds...");
            setTimeout(async () => {
              try {
                await admin.messaging().sendEachForMulticast({
                  tokens: [token],
                  notification: message.notification,
                  data: message.data,
                });
                console.log("[FCM] Retry succeeded for token:", token);
              } catch (retryErr) {
                console.error("[FCM] Retry failed for token:", token);
                console.error(retryErr);
              }
            }, 2000);
          }

          if (errorCode === "messaging/invalid-payload") {
            console.error(
              "[FCM] Invalid payload detected:",
              JSON.stringify(payload, null, 2)
            );
          }
        }
      });
    }

    if (failedTokens.length > 0) {
      console.warn("[FCM] Invalid tokens (to be removed):", failedTokens);
    }

    if (response.successCount > 0) {
      // console.log("[FCM] Notification sent successfully to valid tokens.");
    }

    return {
      success: response.failureCount === 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("[FCM] Critical failure while sending notification:", error);
    return {
      success: false,
      error: error.message || error,
    };
  }
};

// Function to delete a Firebase token (optional)
const deleteFirebaseToken = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const result = await firebaseMessagingTokenSchema.deleteOne({
      employeeId,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No Firebase token found for the employee" });
    }
    return res
      .status(200)
      .json({ message: "Firebase token deleted successfully" });
  } catch (error) {
    console.error("Error in deleteFirebaseToken:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const sendCustomNotifications = async (req, res) => {
  try {
    const { title, body, teamsArray, employeesArray, rolesArray } = req.body;

    const matchStage = {
      "employeeInfo.status": req.user.status,
      "employeeInfo.orgId": req.user.orgId,
    };

    if (teamsArray && teamsArray.length > 0) {
      const converted = teamsArray
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      matchStage["employeeInfo.teamId"] = { $in: converted };
    }

    if (employeesArray && employeesArray.length > 0) {
      const converted = employeesArray
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      matchStage["employeeInfo._id"] = { $in: converted };
    }

    if (rolesArray && rolesArray.length > 0) {
      const converted = rolesArray
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      matchStage["employeeInfo.roleId"] = { $in: converted };
    }

    const tokensData = await firebaseMessagingTokenSchema.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      {
        $unwind: "$employeeInfo",
      },
      {
        $match: matchStage,
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

    console.log("THis is data", tokensData?.[0]?.tokens);

    const response = await sendNotificationtoTokens(
      tokensData?.[0]?.tokens,
      title,
      body
    );
    if (response.success) {
      return res
        .status(200)
        .json({ message: "Notification sent successfully", response });
    } else {
      return res
        .status(500)
        .json({ message: "Failed to send notification", response });
    }
  } catch (error) {
    console.error("Error in sendCustomNotifications:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  addOrUpdateFirebaseToken,
  deleteFirebaseToken,
  sendNotificationtoTokens,
  sendCustomNotifications,
};
