# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Hibi (HiBi) is an HRMS platform split into two independent apps, each with its own `package.json`:

- `hibi_backend/` — Express 4 + Mongoose (MongoDB) REST API, plain CommonJS JavaScript. Entry point is `app.js` (there is no `bin/www`; the server listens directly in `app.js`, default port 5001).
- `hibi_frontend/` — Next.js 14 (App Router) in JavaScript/JSX. Despite the App Router, the app is fully client-side rendered — every page uses `"use client"`.

Run `npm install` and commands separately in each directory.

## Commands

Backend (`hibi_backend/`):
```
npm start          # nodemon app.js (auto-reload dev server on :5001)
```
Requires a `.env` with at least `MONGO_URI` and `JWT_SECRET` (other integrations: AWS S3/MinIO, DigiLocker, FRS biometric API, GST API). When `NODE_ENV=staging`, the Mongo URI is instead decrypted from `MONGO_URI_ENC`/`MONGO_IV` (see bottom of `app.js`). `test-frs.js` and `setup-data.js` are ad-hoc scripts run with `node`, not a test suite.

Frontend (`hibi_frontend/`):
```
npm run dev        # Next dev server on :3000
npm run build      # Production build
npm run lint       # next lint
```
Requires `NEXT_PUBLIC_BACKEND_BASE_URI` pointing at the backend.

There is no automated test suite in either app.

## Backend Architecture

- **Domain folders, three layers.** Code is grouped by domain into `src/routes/`, `src/controllers/`, and `src/models/`, each with per-domain subfolders (`EmployeeRouterManagement/`, `AttendenceSchemaManagement/`, `LeaveContollerManagement/`, etc.). A feature touches all three plus a router registration in `app.js`.
- **Router registration is centralized in `app.js`.** All ~35 routers are required and mounted under `/api/*` there. Many routers export `{ router }` (destructured on require), others export the router directly — match the existing export style of the file you touch. Some routers use the `applyRoutes(routeDefinitions)` helper from `src/utils/routerUtils.js` instead of calling `router.get/post` directly.
- **Auth is global-by-default.** `allowPublicRoutes([...])` in `app.js` wraps every request: unless the exact path is in the public whitelist there, `src/middleware/verifyUser.js` runs. It accepts a JWT either from the auth cookie (browser; cookie name from `src/middleware/setToken.js`) or an `Authorization: Bearer` header (mobile), and sets `req.user`, `req.userType` (`EMPLOYEE` | `PRODUCTMANAGER`), `req.userId`, and `req.isMobileRequest`. New public endpoints must be added to the whitelist array in `app.js`. Note: the privilege/role route-guard (`canAllowUser`) exists in `verifyUser.js` but is currently commented out — auth verifies identity only.
- **CORS allowlist is hardcoded in `app.js`** (`allowedOrigins`). A new frontend origin must be added there or requests fail, since `credentials: true` cookies are required.
- **Cross-cutting utilities** live in `src/utils/`: `s3Upload.js` (AWS S3 and MinIO file storage), `mailSender.js` (nodemailer), `timeFunction.js` (IST timezone conversions — dates throughout the app are handled in IST), `logger.js` (API request logging middleware), and `frsAttendanceCron.js` (facial-recognition-system attendance sync, started via `startFRSCron()` right after the Mongo connection succeeds). Push notifications go through `firebase-admin` (`src/middleware/firebase.js`, `src/controllers/FirebaseNotifications/`).
- **Spelling in identifiers is inconsistent but load-bearing** (`Attendence`, `AttedenceRouterManagement`, `LeaveContollerManagement`, `leaveConsidaration`, `previlege`). Always match the existing spelling of the folder/file/route you're working with rather than "fixing" it.

## Frontend Architecture

- **API layer:** all backend calls live in `src/Apis/` (~37 modules, one per domain), built on the shared axios instance in `src/config/axiosConfig.js` (`baseURL` from `NEXT_PUBLIC_BACKEND_BASE_URI`, `withCredentials: true` for cookie auth). Add new endpoints to the matching `src/Apis/` module, not inline in components.
- **State:** no Redux/Zustand. Global user/role/privilege/theme state lives in `src/app/context/UserContext.jsx` (`UsersContext`); dashboard-wide shared data in `src/app/dashboard/context/CommonDataContext.jsx`. Org-level theme colors come from the backend via `colorPalettesFromBackend`.
- **Routing:** file-based under `src/app/`. The main product surface is `src/app/dashboard/` (home, attendance, leaveManagement, permissions, payslips, trips, teamManagement, thumbManagement, onDuty, hiring, todo, BugReports, appearance, …), wrapped by `dashboard/layout.js` + `DashBoardWrapper.jsx`. Other top-level routes: `login`, `logout`, `forgotPassword`, `changePassword`, `profile`, `userProfile`, `organizationManagement`, `orgHead`.
- **Components:** `src/components/ui/` is shadcn/ui (New York style, see `components.json`) — generated primitives, keep app logic out of them. App-specific shared components live in `src/app/components/` (including `ReusableComponents/`). Import alias `@/*` → `./src/*`.
- **Utilities:** `src/utils/` holds date helpers (`DateFunctions.js`), validations, and `crypto.js` (CryptoJS AES used to encrypt sensitive payloads/storage). Toasts go through `src/lib/ToastService.jsx`.
- `hibi_frontend/DOCUMENTATION.md` is a detailed (March 2026) architecture reference for the frontend — consult it for module-by-module specifics.
