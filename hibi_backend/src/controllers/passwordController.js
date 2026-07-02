const employeeSchema = require('../models/EmployeeSchemaManagement/employeeSchema');
const speakEasySchema = require('../models/speakEasySchema');
const organizationSchema = require('../models/organizationSchema');
const statusSchema = require('../models/statusSchema');
const logger = require('../utils/logger');

const { generatePassword, sendmail } = require('../utils/mailSender');

const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');


const { getISTDateAndTime } = require('../utils/timeFunction');

// Safely derive actor name for logging without assuming req.user exists
const getActorName = (req) => {
    try {
        const u = req?.user;
        if (!u) return 'Unknown';
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        if (name) return name;
        if (u.userName) return u.userName;
        if (u.employeeCode) return u.employeeCode;
        return 'Unknown';
    } catch (_) {
        return 'Unknown';
    }
};

// Funtion to forget password
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Validate input
        if (!email) {
            return res.status(400).json({ message: "Please provide email" });
        }

        // Find the employee by email
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

        // const pass = generatePassword();
        // const hashedPassword = await bcrypt.hash(pass, 12);

        // // Update the employee's password
        // employee.password = hashedPassword;
        // await employee.save();

        // // Send the new password to the employee's email
        // sendmail(
        //     "Password Reset",
        //     "PasswordReset",
        //     employee.firstName + " " + employee.lastName,
        //     employee.officeMail,
        //     pass
        // );

        // return res.status(200).json({ message: "A new password has been sent to your email address."});

        const isStatusActive = await statusSchema.findOne({ orgId: employee.orgId, statusType: "ACTIVE" }, { _id: 1 } );
		if (!isStatusActive || employee.status.toString() !== isStatusActive._id.toString()) {
			return res.status(403).json({ message: "Your account is not active. Please contact the administrator." });
		}


        // 2FA setup logic (same as loginController.js)
        let is2FAEnabled = await speakEasySchema.findOne({ userId: employee._id });
        if (is2FAEnabled && is2FAEnabled.enabled) {
            // 2FA is enabled, prompt for OTP from authenticator app
            return res.status(201).json({ nextAction: 'VERIFY_2FA', message: "Please enter the OTP from your authenticator app to reset your password." });
        } else {
            // 2FA is not enabled, setup 2FA as in loginController.js
            const secret = speakeasy.generateSecret({ length: 20 });
            const otpauth_url = speakeasy.otpauthURL({
                secret: secret.base32,
                label: `${employee.employeeCode}`,
                issuer: 'HRMS',
                encoding: 'base32'
            });
            if (!is2FAEnabled) {
                const new2FA = new speakEasySchema({
                    userId: employee._id,
                    secret: secret.base32,
                    enabled: false,
                    otpauth_url
                });
                await new2FA.save();
            } else {
                is2FAEnabled.secret = secret.base32;
                is2FAEnabled.enabled = false;
                is2FAEnabled.otpauth_url = otpauth_url;
                await is2FAEnabled.save();
            }
            qrcode.toDataURL(otpauth_url, (err, data_url) => {
                if (err) {
                    return res.status(500).json({ message: "Error generating QR code" });
                }
                return res.status(202).json({ nextAction: 'SETUP_2FA', message: "2FA setup required. Please scan the QR code to set up 2FA.", qrCodeDataUrl: data_url });
            });
        }
    } catch (error) {
        console.error("Error while processing forget password:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// funtion to reset password using OTP
const otpVerificationForgotPassword = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide email and OTP" });
        }

        // Find the employee by email
        const employee = await employeeSchema.findOne({ officeMail: email });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Only allow 2FA (speakeasy) OTP verification
        let is2FAEnabled = await speakEasySchema.findOne({ userId: employee._id });
        if (!is2FAEnabled || !is2FAEnabled.enabled) {
            // 2FA not set up, prompt to set up 2FA
            const secret = speakeasy.generateSecret({ length: 20 });
            const otpauth_url = speakeasy.otpauthURL({
                secret: secret.base32,
                label: `${employee.employeeCode}`,
                issuer: 'HRMS',
                encoding: 'base32'
            });
            if (!is2FAEnabled) {
                const new2FA = new speakEasySchema({
                    userId: employee._id,
                    secret: secret.base32,
                    enabled: false,
                    otpauth_url
                });
                await new2FA.save();
            } else {
                is2FAEnabled.secret = secret.base32;
                is2FAEnabled.enabled = false;
                is2FAEnabled.otpauth_url = otpauth_url;
                await is2FAEnabled.save();
            }
            qrcode.toDataURL(otpauth_url, (err, data_url) => {
                if (err) {
                    return res.status(500).json({ message: "Error generating QR code" });
                }
                return res.status(202).json({ nextAction: 'SETUP_2FA', message: "2FA setup required. Please scan the QR code to set up 2FA.", qrCodeDataUrl: data_url });
            });
            return;
        }
        // If 2FA is enabled, verify OTP using speakeasy
        const verified = speakeasy.totp.verify({
            secret: is2FAEnabled.secret,
            encoding: 'base32',
            token: otp,
        });
        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        const newPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        // Update the employee's password
        employee.password = hashedPassword;
        await employee.save();

        const organization = await organizationSchema.findOne({ _id: employee.orgId });

        // Send the new password to the employee's email
        sendmail(
            "Password Reset",
            "PasswordReset",
            employee.firstName + " " + employee.lastName,
            employee.officeMail,
            newPassword,
            organization.organizationEmail,
            organization.organizationAppPassword,
            employee.employeeCode
        );
    logger.info(`Password for user with email '${email}' was reset by ${getActorName(req)}`);
        return res.status(200).json({ message: "Password has been reset and sent to your email" });
    } catch (error) {
        console.error("Error while resetting password:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Function to change the known password
const changePassword = async (req, res) => {
    const { oldPassword } = req.body;
    const employeeId = req?.user?._id;

    if (!oldPassword) {
        return res.status(400).json({ message: "Old password required" });
    }

    try {
        const employee = await employeeSchema.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid old password" });
        }

        // Require 2FA to be enabled
        const twoFA = await speakEasySchema.findOne({ userId: employee._id });
        if (!twoFA || !twoFA.enabled) {
            return res.status(403).json({
                message: "2FA must be enabled to change your password. Please enable 2FA first."
            });
        }

        return res.status(201).json({
            nextAction: 'VERIFY_OTP',
            message: "Please provide OTP to continue"
        });

    } catch (error) {
        console.error("Error while changing password:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


const changingPasswordUsingOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP required" });
        }

        if (req.user.officeMail !== email) {
            return res.status(400).json({ message: "You can only change your own password" });
        }

        const employee = await employeeSchema.findOne({ officeMail: email });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const twoFA = await speakEasySchema.findOne({ userId: employee._id });
        if (!twoFA || !twoFA.enabled) {
            return res.status(403).json({
                message: "2FA must be enabled before you can change your password"
            });
        }

        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: otp
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        return res.status(200).json({
            message: "OTP verified. You can now set your new password."
        });

    } catch (error) {
        console.error("Error while verifying OTP:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


const settingNewPasswordUsingOtp = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: "New password required" });
        }

        const employee = await employeeSchema.findOne({ officeMail: req.user.officeMail });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const isSamePassword = await bcrypt.compare(newPassword, employee.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password cannot be the same as old password" });
        }

        employee.password = await bcrypt.hash(newPassword, 12);
        await employee.save();

        logger.info(`User with email '${req.user.officeMail}' changed their password successfully.`);
        return res.status(200).json({ message: "Password has been changed successfully" });

    } catch (error) {
        console.error("Error while setting new password:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const requestTwoFactorReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide an email" });
        }

        const employee = await employeeSchema.findOne({ 
            $or: [
                { personalEmail: email },
                { officeMail: email },
                { employeeCode: email }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const twoFA = await speakEasySchema.findOne({ userId: employee._id });
        if (!twoFA || !twoFA.enabled) {
            return res.status(400).json({ message: "2FA is not enabled for this account" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        twoFA.twoFactorResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        twoFA.twoFactorResetExpires = Date.now() + 1800000; // 30 minutes

        await twoFA.save();

        // const resetLink = `${req.protocol}://${req.get('host')}/api/password/confirm-2fa-reset?token=${resetToken}`;
        const frontendBaseUrl = process.env.NODE_ENV === 'staging' ? process.env.FRONTEND_STAGING_URL : process.env.FRONTEND_PRODUCTION_URL;
        const resetLink = `${frontendBaseUrl}/External?token=${resetToken}`;

        const organization = await organizationSchema.findOne({ _id: employee.orgId });
        // console.log({ organization });

        await sendmail(
            "2FA Reset Request",
            "RESET2FA",
            `${employee.firstName} ${employee.lastName}`,
            employee.officeMail, // Send to office email for recovery
            resetLink,
            organization.organizationEmail,
            organization.organizationAppPassword,
            employee.employeeCode
        );

        return res.status(200).json({ message: "A 2FA reset link has been sent to your office email address." });

    } catch (error) {
        console.error("Error requesting 2FA reset:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const confirmTwoFactorReset = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const twoFA = await speakEasySchema.findOne({
            twoFactorResetToken: hashedToken,
            twoFactorResetExpires: { $gt: Date.now() }
        });

        if (!twoFA) {
            return res.status(400).json({ message: "Token is invalid or has expired" });
        }

        twoFA.enabled = false;
        twoFA.secret = null;
        twoFA.otpauth_url = null;
        twoFA.twoFactorResetToken = undefined;
        twoFA.twoFactorResetExpires = undefined;
        await twoFA.save();

        logger.info(`2FA disabled for user with ID '${twoFA.userId}'.`);
        return res.status(200).json({ message: "2FA has been successfully disabled. You can now log in with your password." });

    } catch (error) {
        console.error("Error confirming 2FA reset:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const resendPassword = async (req, res) => {
    try {
        const { employeeCode } = req.body;
        // Validate input
        if (!employeeCode) {
            return res.status(400).json({ message: "Please provide employee code" });
        }
        // Find the employee by employee code
        const employee = await employeeSchema.findOne({ employeeCode: employeeCode });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const newPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        // Update the employee's password
        employee.password = hashedPassword;
        await employee.save();

        const organization = await organizationSchema.findOne({ _id: employee.orgId });

        // Send the new password to the employee's email
        sendmail(
            "Password Reset by Admin",
            "PasswordReset",
            employee.firstName + " " + employee.lastName,
            employee.officeMail,
            newPassword,
            organization.organizationEmail,
            organization.organizationAppPassword,
            employee.employeeCode
        );
    logger.info(`Password for user with employee code '${employeeCode}' was reset by admin ${getActorName(req)}`);
        return res.status(200).json({ message: "A new password has been sent to the employee's email address."});
    } catch (error) {
        console.error("Error while resetting password:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const toggleTwoFactorAuth = async (req, res) => {
    try {
        let { enable, otp, employeeId } = req.body;
        // If employeeId is not provided in body, use the logged-in user's id
        const loggedInUserId = req?.user?._id;
        if (!employeeId) {
            employeeId = loggedInUserId;
        }

        if (typeof enable !== 'boolean') {
            return res.status(400).json({ message: "Enable must be a boolean" });
        }

        const employee = await employeeSchema.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        let twoFA = await speakEasySchema.findOne({ userId: employee._id });

        // IT team is acting if employeeId in body and not same as logged-in user
        const isITTeam = String(employeeId) !== String(loggedInUserId);

        if (enable) {
            // Enable 2FA logic
            if (!otp && !isITTeam) {
                // Phase 1: Requesting to enable 2FA -> Generate new secret & QR code
                const secret = speakeasy.generateSecret({ length: 20 });
                const otpauth_url = speakeasy.otpauthURL({
                    secret: secret.base32,
                    label: `${employee.employeeCode}`,
                    issuer: 'HRMS',
                    encoding: 'base32'
                });
                
                if (!twoFA) {
                    twoFA = new speakEasySchema({
                        userId: employee._id,
                        secret: secret.base32,
                        enabled: false,
                        otpauth_url
                    });
                    await twoFA.save();
                } else {
                    twoFA.secret = secret.base32;
                    twoFA.enabled = false;
                    twoFA.otpauth_url = otpauth_url;
                    await twoFA.save();
                }

                qrcode.toDataURL(otpauth_url, (err, data_url) => {
                    if (err) {
                        return res.status(500).json({ message: "Error generating QR code" });
                    }
                    return res.status(202).json({ 
                        nextAction: 'SETUP_2FA', 
                        message: "2FA setup required", 
                        qrCodeDataUrl: data_url 
                    });
                });
                return;
            } else if (!isITTeam) {
                // Phase 2: Verifying OTP to confirm enabling
                if (!twoFA || !twoFA.secret) {
                    return res.status(400).json({ message: "2FA setup not initiated." });
                }

                const verified = speakeasy.totp.verify({
                    secret: twoFA.secret,
                    encoding: 'base32',
                    token: otp
                });

                if (!verified) {
                    return res.status(400).json({ message: "Invalid OTP." });
                }

                twoFA.enabled = true;
                await twoFA.save();
                employee.isRequired2FA = true;
                await employee.save();
                logger.info(`2FA enabled for user with ID '${employeeId}' by ${getActorName(req)}`);
                return res.status(200).json({ message: "2FA has been enabled successfully." });
            } else {
                // IT Team bypassing OTP
                if (!twoFA) {
                    const secret = speakeasy.generateSecret({ length: 20 });
                    const otpauth_url = speakeasy.otpauthURL({
                        secret: secret.base32,
                        label: `${employee.employeeCode}`,
                        issuer: 'HRMS',
                        encoding: 'base32'
                    });
                    twoFA = new speakEasySchema({
                        userId: employee._id,
                        secret: secret.base32,
                        enabled: true,
                        otpauth_url
                    });
                    await twoFA.save();
                } else {
                    twoFA.enabled = true;
                    await twoFA.save();
                }
                employee.isRequired2FA = true;
                await employee.save();
                logger.info(`2FA enabled for user with ID '${employeeId}' by IT team ${getActorName(req)}`);
                return res.status(200).json({ message: "2FA has been enabled successfully." });
            }
        } else {
            // Disable 2FA: require OTP verification unless IT team is acting
            if (!twoFA || !twoFA.enabled) {
                return res.status(400).json({ message: "2FA is not enabled." });
            }
            if (!isITTeam) {
                if (!otp) {
                    return res.status(400).json({ message: "OTP is required to disable 2FA." });
                }
                const verified = speakeasy.totp.verify({
                    secret: twoFA.secret,
                    encoding: 'base32',
                    token: otp
                });
                if (!verified) {
                    return res.status(400).json({ message: "Invalid OTP." });
                }
            }
            twoFA.enabled = false;
            await twoFA.save();
            employee.isRequired2FA = false;
            await employee.save();
            logger.info(`2FA disabled for user with ID '${employeeId}' by ${getActorName(req)}`);
            return res.status(200).json({ message: "2FA has been disabled successfully." });
        }
    } catch (error) {
        console.error("Error toggling 2FA:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};



module.exports = {
    forgetPassword,     // Funtion to receive email and send an otp 

    otpVerificationForgotPassword,      // Funcion to verify the otp and send new generated password to mail

    changePassword,     // Function to receive old passowrd and validate it and send otp

    changingPasswordUsingOtp,       // Funtion to verify otp sent after validating the old password

    settingNewPasswordUsingOtp,     // Funtion to set new password after validating the otp

    requestTwoFactorReset, // Function to request a 2FA reset

    confirmTwoFactorReset, // Function to confirm the 2FA reset

    resendPassword,        // Function to reset password by admin using employeecode

    toggleTwoFactorAuth    // Function to enable or disable 2FA
};