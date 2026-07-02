const employeeSchema = require("../models/EmployeeSchemaManagement/employeeSchema");
const productManagerSchema = require("../models/productManagerSchema");
const privilegeSchema = require("../models/EmployeeSchemaManagement/privilegeSchema");
const roleSchema = require("../models/EmployeeSchemaManagement/rolesSchema");
const speakEasySchema = require("../models/speakEasySchema");
const statusSchema = require("../models/statusSchema");
const organizationSchema = require("../models/organizationSchema");

const { setToken, COOKIE_NAME } = require("../middleware/setToken");
const bcrypt = require("bcrypt");
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const jwt = require("jsonwebtoken");

const { getISTDateAndTime } = require("../utils/timeFunction");

const getUserPrivilege = async (privilegeId) => {
	const privilege = await privilegeSchema.findById(privilegeId, { name: 1 });
	return privilege?.name || null;
};

const getUserRole = async (roleId) => {
	const role = await roleSchema.findById(roleId, { name: 1 });
	return role?.name || null;
};

// Helper to clear the generic auth cookie with correct options
const clearAuthCookie = (res) => {
	const cookieOptions = {
		httpOnly: true,
		sameSite: "None",
		secure: true,
	};
	res.clearCookie(COOKIE_NAME, cookieOptions);
};

// Step 1: Verify email and return organization details
const verifyEmail = async (req, res) => {
	try {
		const { email } = req.body;

		// Validate input
		if (!email) {
			return res.status(400).json({ message: "Please provide an email" });
		}

		// Try to find Employee by personalEmail, employeeCode, or officeMail
		const employee = await employeeSchema.findOne({
			$or: [
				{ personalEmail: email },
				{ employeeCode: email },
				{ officeMail: email }
			]
		});

		if (!employee) {
			// Check if it's a product manager
			const productManager = await productManagerSchema.findOne({ userName: email });
			if (productManager) {
				// Product managers don't have organization branding
				return res.status(200).json({ 
					message: "Email verified",
					userType: "PRODUCTMANAGER",
					orgLogo: null,
					orgName: "Product Manager",
					orgBanner: null
				});
			}
			return res.status(404).json({ message: "User not found" });
		}

		// Fetch organization details
		const organization = await organizationSchema.findById(employee.orgId, { 
			name: 1, 
			orgLogo: 1,
			orgBanner: 1
		});

		if (!organization) {
			return res.status(404).json({ message: "Organization not found" });
		}

		return res.status(200).json({
			message: "Email verified",
			userType: "EMPLOYEE",
			orgLogo: organization.orgLogo || null,
			orgName: organization.name,
			orgBanner: organization.orgBanner || null
		});

	} catch (error) {
		console.error("Error while verifying email:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};




// Step 2: Login with email and password
const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({ message: "Please fill in all required fields" });
		}

		// Always clear old cookies before new login
		clearAuthCookie(res);

		// Try to find Employee by personalEmail or employeeCode
		const employee = await employeeSchema.findOne({
			$or: [
				{ personalEmail: email },
				{ employeeCode: email },
				{ officeMail: email }
			]
		});
		if (!employee) {
			const productManager = await productManagerSchema.findOne({ userName: email });

			if (productManager) {
				const isMatch = await bcrypt.compare(password, productManager.password);
				if (!isMatch) {
					return res.status(401).json({ message: "Invalid credentials" });
				}
				// Set cookie
				setToken(res, productManager._id, "PRODUCTMANAGER");

				// Log login event for product manager
				const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
				console.log(`[${timestamp}] POST /api/login/login-user - ${productManager.userName}`);

				return res.status(200).json({ nextAction: 'LOGIN_SUCCESS', message: "Login successful", role: "PRODUCTMANAGER" });
			}
			return res.status(404).json({ message: "User not found" });
		}
		const isMatch = await bcrypt.compare(password, employee.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isStatusActive = await statusSchema.findOne({ orgId: employee.orgId, statusType: "ACTIVE" }, { _id: 1 });
		const privileges = await getUserPrivilege(employee.privilegeId);
		if (privileges !== "SUPERADMIN" && privileges !== "ULTIMATEADMIN") {
			if (!isStatusActive || !employee.status || employee.status.toString() !== isStatusActive._id.toString()) {
				return res.status(403).json({ message: "Your account is not active. Please contact the administrator." });
			}
		}

		// Check if 2FA is enabled for the user
		if (!employee.isRequired2FA) {
			// Generate JWT token for mobile/app login
			// const token = jwt.sign(
			//     { id: employee._id, type: "EMPLOYEE", email: employee.personalEmail },
			//     process.env.JWT_SECRET,
			//     { expiresIn: "7d" }
			// );

			employee.lastLoginAt = getISTDateAndTime();
			await employee.save();

			setToken(res, employee._id, "EMPLOYEE");

			// Log login event for employee
			const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
			const name = `${employee.firstName} ${employee.lastName}`;
			console.log(`[${timestamp}] POST /api/login/login-user - ${name}`);

			return res.status(200).json({
				message: "Login successful",
				// token: token,
				privilege: await getUserPrivilege(employee.privilegeId),
				role: await getUserRole(employee.roleId),
			});
		}

		let is2FAEnabled = await speakEasySchema.findOne({ userId: employee._id });
		if (is2FAEnabled) {
			if (!is2FAEnabled.enabled) {
				// Update existing record for speakEasy 2FA setup
				const secret = speakeasy.generateSecret({ length: 20 });
				const otpauth_url = speakeasy.otpauthURL({
					secret: secret.base32,
					label: `${employee.employeeCode}`,
					issuer: 'HRMS',
					encoding: 'base32'
				});
				is2FAEnabled.secret = secret.base32;
				is2FAEnabled.enabled = false; // Initially disabled until user verifies
				is2FAEnabled.otpauth_url = otpauth_url;
				await is2FAEnabled.save();
				qrcode.toDataURL(otpauth_url, (err, data_url) => {
					if (err) {
						return res.status(500).json({ message: "Error generating QR code" });
					}
					return res.status(202).json({ nextAction: 'SETUP_2FA', message: "2FA setup required", qrCodeDataUrl: data_url });
				});
			} else {
				// If 2FA is enabled, proceed to send OTP
				return res.status(203).json({ nextAction: 'VERIFY_OTP', message: "2FA enabled, proceed to OTP verification" });
			}
		} else {
			// No 2FA record exists, create one and start setup
			const secret = speakeasy.generateSecret({ length: 20 });
			const otpauth_url = speakeasy.otpauthURL({
				secret: secret.base32,
				label: `${employee.employeeCode}`,
				issuer: 'HRMS',
				encoding: 'base32'
			});
			const new2FA = new speakEasySchema({
				userId: employee._id,
				secret: secret.base32,
				enabled: false,
				otpauth_url
			});
			await new2FA.save();
			qrcode.toDataURL(otpauth_url, (err, data_url) => {
				if (err) {
					return res.status(500).json({ message: "Error generating QR code" });
				}
				return res.status(202).json({ nextAction: 'SETUP_2FA', message: "2FA setup required", qrCodeDataUrl: data_url });
			});
		}

	} catch (error) {
		console.error("Error while logging in:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Verify OTP for user login
const verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;

		// Validate input
		if (!email || !otp) {
			return res.status(400).json({ message: "Please provide email and OTP" });
		}
		const employee = await employeeSchema.findOne({
			$or: [
				{ personalEmail: email },
				{ employeeCode: email },
				{ officeMail: email }
			]
		});
		if (!employee) {
			return res.status(404).json({ message: "Employee not found" });
		}
		// Find the OTP entry for the email
		const twoFA = await speakEasySchema.findOne({ userId: employee._id });
		if (!twoFA) {
			return res.status(400).json({ message: "2FA is not enabled for this user" });
		}

		const verified = speakeasy.totp.verify({
			secret: twoFA.secret,
			encoding: 'base32',
			token: otp,
		});

		if (!verified) {
			return res.status(400).json({ message: "Invalid OTP" });
		}
		else if (verified && !twoFA.enabled) {
			// Enable 2FA after successful verification during setup
			twoFA.enabled = true;
			await twoFA.save();
		}
		// OTP is valid, proceed with login

		// Set cookie
		setToken(res, employee._id, "EMPLOYEE");

		employee.lastLoginAt = getISTDateAndTime();

		await employee.save();


		return res.status(200).json({
			nextAction: 'LOGIN_SUCCESS',
			message: "Login successful",
			privilege: await getUserPrivilege(employee.privilegeId),
			role: await getUserRole(employee.roleId),
		});
	} catch (error) {
		console.error("Error while verifying otp:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};



const applicationLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		// Validate required fields
		if (!email || !password) {
			return res.status(400).json({ message: "Please fill in all required fields" });
		}

		// Always clear old cookies before new login (for consistency, even if not used by app)
		clearAuthCookie(res);

		// Check if the employee exists
		const employee = await employeeSchema.findOne({
			$or: [
				{ personalEmail: email },
				{ employeeCode: email },
				{ officeMail: email }
			]
		});
		if (!employee) {
			return res.status(404).json({ message: "Employee not found" });
		}
		const isMatch = await bcrypt.compare(password, employee.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isStatusActive = await statusSchema.findOne({ orgId: employee.orgId, statusType: "ACTIVE" }, { _id: 1 });
		if (!isStatusActive || !employee.status || employee.status.toString() !== isStatusActive._id.toString()) {
			return res.status(403).json({ message: "Your account is not active. Please contact the administrator." });
		}

		// Check if 2FA is enabled for the user
		if (!employee.isRequired2FA) {
			// Generate JWT token for mobile/app login
			const token = jwt.sign(
				{ id: employee._id, type: "EMPLOYEE", email: employee.officeMail, employeeCode: employee.employeeCode },
				process.env.JWT_SECRET,
				// 30 days for app login
				{ expiresIn: "30d" }
			);

			employee.lastLoginAt = getISTDateAndTime();
			await employee.save();

			return res.status(200).json({
				message: "Login successful",
				token: token,
				privilege: await getUserPrivilege(employee.privilegeId),
				role: await getUserRole(employee.roleId),
				employeeId: employee._id
			});
		}

		const twoFA = await speakEasySchema.findOne({ userId: employee._id });

		// If 2FA is enabled, app login should also require OTP verification
		if (twoFA && twoFA.enabled) {
			return res.status(202).json({ nextAction: 'VERIFY_OTP', message: "2FA enabled, proceed to OTP verification" });
		}

		// If 2FA is not enabled, proceed with login (not recommended for production)
		// return res.status(400).json({ message: "2FA must be enabled for application login. Please use web login to set up 2FA." });

		// Generate JWT token for mobile/app login
		const token = jwt.sign(
			{ id: employee._id, type: "EMPLOYEE", email: employee.officeMail, employeeCode: employee.employeeCode },
			process.env.JWT_SECRET,
			{ expiresIn: "30d" }
		);

		employee.lastLoginAt = getISTDateAndTime();
		await employee.save();

		return res.status(200).json({
			message: "Login successful",
			token: token,
			privilege: await getUserPrivilege(employee.privilegeId),
			role: await getUserRole(employee.roleId),
			employeeId: employee._id
		});
	} catch (error) {
		console.error("Error while logging in:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

const applicationVerifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;

		// Validate input
		if (!email || !otp) {
			return res.status(400).json({ message: "Please provide email and OTP" });
		}
		const employee = await employeeSchema.findOne({
			$or: [
				{ personalEmail: email },
				{ employeeCode: email },
				{ officeMail: email }
			]
		});
		if (!employee) {
			return res.status(404).json({ message: "Employee not found" });
		}
		// Find the OTP entry for the email
		const twoFA = await speakEasySchema.findOne({ userId: employee._id });
		if (!twoFA) {
			return res.status(400).json({ message: "2FA is not enabled for this user" });
		}

		const verified = speakeasy.totp.verify({
			secret: twoFA.secret,
			encoding: 'base32',
			token: otp,
		});

		if (!verified) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		// OTP is valid, proceed with login
		// Generate JWT token for mobile/app login
		const token = jwt.sign(
			{ id: employee._id, type: "EMPLOYEE", email: employee.officeMail, employeeCode: employee.employeeCode },
			process.env.JWT_SECRET,
			// 30 days for app login
			{ expiresIn: "30d" }
		);

		employee.lastLoginAt = getISTDateAndTime();
		await employee.save();

		return res.status(200).json({
			message: "Login successful",
			token: token,
			privilege: await getUserPrivilege(employee.privilegeId),
			role: await getUserRole(employee.roleId),
			employeeId: employee._id
		});
	}
	catch (error) {
		console.error("Error while verifying otp:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Logout function to clear the generic auth cookie and handle session cleanup
const logoutUser = async (req, res) => {
	try {
		// Log logout event
		const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
		let name = req.user?.firstName && req.user?.lastName
			? `${req.user.firstName} ${req.user.lastName}`
			: req.user?.userName || "Unknown";
		console.log(`[${timestamp}] POST /api/login/logout-user - ${name}`);

		clearAuthCookie(res);
		return res.status(200).json({ message: "Logout successful" });
	} catch (error) {
		console.error("Error while logging out : ", error);
		return res.status(500).json({ message: "Logout failed" });
	}
};

// setTimeout(async () => {
// 	console.log("Starting to update all employees to set isRequired2FA to true");
// 	const updateResult = await employeeSchema.updateMany({}, {
// 		$set: { isRequired2FA: true }
// 	});
// 	console.log("Updated all employees to set isRequired2FA to true");
// 	console.log("Update results length :", updateResult.length);
// }, 5000);

// Funtion to refresh the token for mobile app users (if needed)
const refreshToken = async (req, res) => {
	try {
		if (!req.isMobileRequest) {
			return res.status(400).json({ message: "Token refresh is only available for mobile app requests" });
		}
		if (!req.user || !req.user._id) {
			return res.status(401).json({ message: "Unauthorized: User information missing" });
		}

		const token = jwt.sign(
			{ id: req.user._id, type: "EMPLOYEE", email: req.user.officeMail, employeeCode: req.user.employeeCode },
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		const employee = await employeeSchema.findById(req.user._id);

		employee.lastLoginAt = getISTDateAndTime();
		await employee.save();

		return res.status(200).json({
			message: "Login successful",
			token: token,
			privilege: await getUserPrivilege(employee.privilegeId),
			role: await getUserRole(employee.roleId),
			employeeId: employee._id
		});
	} catch (error) {
		console.error("Error while refreshing token:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	verifyEmail, // Step 1: Verify email and return organization details
	loginUser, // Step 2: Login Function for Employee, Organization Head, and Product Manager via Browser
	applicationLogin, // Login Function for Employee via Application
	logoutUser, // Logout Function to clear cookies and sessions
	verifyOtp, // Verify OTP for Employee login
	applicationVerifyOtp, // Verify OTP for Employee application login
	refreshToken // Refresh JWT token for mobile app users
};