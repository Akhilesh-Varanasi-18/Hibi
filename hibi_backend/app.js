// app.js
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { allowPublicRoutes, verifyUser } = require("./src/middleware");

const logger = require("./src/utils/logger");

dotenv.config();
const { startFRSCron } = require('./src/utils/frsAttendanceCron');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Add API request logger

const allowedOrigins = [
  "https://hrms.technicalhub.io",
  "http://192.168.11.114:3000",
  "http://192.168.11.119:3000",
  "http://localhost:3000",
  "https://frontend.stagingapp.tech",
  "http://210.212.210.89:9000",
  "https://hibi.technicalhub.io",
  "https://hibiplatform.com",
  "http://18.60.11.55:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // This is crucial for cookies to work
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"], // Expose Set-Cookie header to frontend
  })
);

app.use(
  allowPublicRoutes([
    "/api/login/verify-email",
    "/api/login/login-user",
    "/api/product-manager/add-product-manager",
    "/api/login/check-cookies",
    "/api/login/application-login",
    "/api/password/forget-password",
    "/api/login/verify-otp",
    "/api/login/application-verify-otp",
    "/api/password/verify-otp-forgot-password",
    "/api/password/confirm-2fa-reset",
    "/api/password/request-2fa-reset",
    "/api/attendence-reports/get-inactive-employee",
    "/api/attendence-reports/get-active-employee",
    "/api/password/resend-password",
    "/api/cls-od/all-employees-cl-balance",
    "/api/cls-od/all-employees-od-balance",
  ])
);

app.use(logger.logApiRequest);

const {
  router: leavesTypeRouter,
} = require("./src/routes/LeaveRoutesManagement/leaveTypesRouter");
const {
  router: leaveRequestsRouter,
} = require("./src/routes/LeaveRoutesManagement/leaveRequestesRouter");
const {
  router: employeesRouter,
} = require("./src/routes/EmployeeRouterManagement/employeesRouter");
const metaDataRouter = require("./src/routes/metaDataRouter");
const {
  router: privilegeRouter,
} = require("./src/routes/EmployeeRouterManagement/privilegeRoute");
const {
  router: departmentRouter,
} = require("./src/routes/EmployeeRouterManagement/departmentRouter");
const { router: statusRouter } = require("./src/routes/statusTypeRouter");
const {
  router: designationRouter,
} = require("./src/routes/EmployeeRouterManagement/designationRouter");
const {
  router: rolesRouter,
} = require("./src/routes/EmployeeRouterManagement/rolesRouter");
const {
  router: shiftRouter,
} = require("./src/routes/EmployeeRouterManagement/shiftRouter");
const {
  router: permissionTypesRouter,
} = require("./src/routes/PermissionRouterManagement/permissionTypesRouter");
const {
  router: organizationRouter,
} = require("./src/routes/organizationRouter");
const {
  router: projectManagerRoutes,
} = require("./src/routes/productManagerRoutes");
const {
  router: EmployeePersonalDetailsRouter,
} = require("./src/routes/EmployeeRouterManagement/employeePersonalDetailsRouter");
const { router: loginRouter } = require("./src/routes/loginRouter");
const {
  router: permissionRequestController,
} = require("./src/routes/PermissionRouterManagement/permissionRequestRouter");
const {
  router: employeeContactsRouter,
} = require("./src/routes/EmployeeRouterManagement/employeeContactsRouter");
const {
  router: governmentIdTypesRouter,
} = require("./src/routes/EmployeeRouterManagement/governmentIdTypesRouter");
const { router: workReportRouter } = require("./src/routes/workReportRouter");
const {
  router: FCMTockenRouter,
} = require("./src/routes/firebaseNotificationRouter");
const { router: passwordRouter } = require("./src/routes/passwordRouter");
const { router: teamRouter } = require("./src/routes/teamRouter");
const {
  router: employeeBankDetailsRouter,
} = require("./src/routes/EmployeeRouterManagement/employeeBankDetailsRouter");
const {
  router: tripTypeRouter,
} = require("./src/routes/TripRouterManagement/tripTypeRouter");
const {
  router: attendanceRouter,
} = require("./src/routes/AttedenceRouterManagement/attendenceRouter");
const {
  router: attendenceStatusTypesRouter,
} = require("./src/routes/AttedenceRouterManagement/attendenceStatusTypesRouter");
const {
  router: tripRouter,
} = require("./src/routes/TripRouterManagement/tripRouter");
const thumbRequestRouter = require("./src/routes/AttedenceRouterManagement/thumbRequestRouter");
const holidayRouter = require("./src/routes/AttedenceRouterManagement/holidayRouter");
const odRequestRouter = require("./src/routes/AttedenceRouterManagement/odRequestRouter");
const digilockerRouter = require("./src/routes/digilockerRouter");
const leaveConsidarationRouter = require("./src/routes/LeaveRoutesManagement/leaveConsidarationRouter");
const clAndOdRouter = require("./src/routes/LeaveRoutesManagement/clsRouter");
const attendenceReportRouter = require("./src/routes/attendenceReportRouter");
const bugReportRouter = require("./src/routes/ReviewRouterManagement/bugReportRouter");
const {
  router: wfhRequestRouter,
} = require("./src/routes/PermissionRouterManagement/wfhRequestRouter");
const announcementRouter = require("./src/routes/announcementRouter");
const paySlipRouter = require("./src/routes/paySlipRouter");
const todoRouter = require("./src/routes/todoRouter");
const careerHistoryRouter = require("./src/routes/EmployeeRouterManagement/careerHistoryRouter");
const employeeStatsRouter = require("./src/routes/employeeStatsRouter");

app.use("/api/firebase", FCMTockenRouter);
app.use("/api/leave-types", leavesTypeRouter);
app.use("/api/leave-requests", leaveRequestsRouter);
app.use("/api/status", statusRouter);
app.use("/api/employee", employeesRouter);
app.use("/api/meta-data", verifyUser, metaDataRouter);
app.use("/api/privilege", privilegeRouter);
app.use("/api/department", departmentRouter);
app.use("/api/designation", designationRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/shift", shiftRouter);
app.use("/api/permission-types", permissionTypesRouter);
app.use("/api/permission-requests", permissionRequestController);
app.use("/api/organization", organizationRouter);
app.use("/api/product-manager", projectManagerRoutes);
app.use("/api/login", loginRouter);
app.use("/api/employee-personal-details", EmployeePersonalDetailsRouter);
app.use("/api/employee-contacts", employeeContactsRouter);
app.use("/api/government-id-types", governmentIdTypesRouter);
app.use("/api/work-report", workReportRouter);
app.use("/api/password", passwordRouter);
app.use("/api/team", teamRouter);
app.use("/api/employee-bank-details", employeeBankDetailsRouter);
app.use("/api/trip-type", tripTypeRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/attendence-status-types", attendenceStatusTypesRouter);
app.use("/api/trip", tripRouter);
app.use("/api/thumb-request", thumbRequestRouter);
app.use("/api/holidays", holidayRouter);
app.use("/api/od-requests", odRequestRouter);
app.use("/api/digilocker", digilockerRouter);
app.use("/api/leave-consideration", leaveConsidarationRouter);
app.use("/api/cls-od", clAndOdRouter);
app.use("/api/attendence-reports", attendenceReportRouter);
app.use("/api/bug-reports", bugReportRouter);
app.use("/api/wfh-requests", wfhRequestRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/pay-slips", paySlipRouter);
app.use("/api/todo", todoRouter);
app.use("/api/career-history", careerHistoryRouter);
app.use("/api/employee-stats", employeeStatsRouter);

// Middleware
app.use(bodyParser.json());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

const crypto = require("crypto");
var decrypted;
if (process.env.NODE_ENV === "staging") {
  const encrypted = process.env.MONGO_URI_ENC;
  const iv = Buffer.from(process.env.MONGO_IV, "hex");

  // Secure key – DO NOT hardcode in real apps
  const key = crypto.scryptSync("your-secure-passphrase", "salt", 32);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
} else {
  decrypted = process.env.MONGO_URI;
}

// DB Connection
mongoose
  .connect(decrypted)
  .then(() => { console.log("MongoDB connected"); startFRSCron(); })
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/", (req, res) => {
  res.send(
    '<center><p style="font-size: 65px; color: #333;">Welcome to HRMS Backend API</p></center>'
  );
});

// error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send a JSON error response instead of rendering a view
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message,
    // Optionally include the error stack in development for debugging
    error: req.app.get("env") === "development" ? err : {},
  });
});

// Server start
const port = process.env.PORT || 5001;
app.listen(port, "0.0.0.0", function () {
  console.log(`Server is Running at  http://0.0.0.0:${port}`);
});

// const {
//   getISTDateAndTime,
//   changeGTMtoIST,
// } = require("./src/utils/timeFunction");

// setTimeout(() => {
//   console.log("Inside setTimeout");
//   const startOfYear = new Date(new Date().getFullYear(), 0, 1);
//   const fromDate = changeGTMtoIST(startOfYear);
//   const toDate = getISTDateAndTime();

//   console.log("fromDate & toDate: ", fromDate, toDate);
// }, 2000);

module.exports = app;
