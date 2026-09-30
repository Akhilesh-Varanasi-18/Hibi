const nodemailer = require('nodemailer');
const generator = require('generate-password');

const { decryptThis } = require('./encryption');

const emailTemplates = {
  "ONBOARDING": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f4f6fb; border-radius: 12px; border: 1px solid #e3e6ed;">
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Welcome to HRMS</h2>
        <p style="text-align:center; color:#4a5568; margin-bottom: 24px;">Your digital workplace starts here!</p>
        <div style="background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 2px 8px #e2e8f0; margin-bottom: 24px;">
          <p style="font-size: 16px; color: #333;">Dear <strong>{{userName}}</strong>,</p>
          <p style="font-size: 15px; color: #555;">Your account has been created successfully. Please use the credentials below to log in:</p>
          <div style="margin: 18px 0; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
            <div style="font-size: 16px; color: #007bff; margin-bottom: 6px;"><strong>Employee Code:</strong> {{employeeCode}}</div>
            <div style="font-size: 16px; color: #007bff;"><strong>Password:</strong> {{password}}</div>
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 18px;">This password will expire in 24 hours for security reasons.<br>If you didn't request this account, please ignore this email.</p>
          <a href="{{siteUrl}}" style="display:inline-block; background:#007bff; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; margin-bottom: 10px;">Visit Site</a>
          <div style="margin-top: 10px; font-size: 13px; color: #4a5568;">Or copy and paste this URL in your browser:<br><span style="color:#007bff;">{{siteUrl}}</span></div>
        </div>
        <div style="text-align:center; color:#a0aec0; font-size:12px; margin-top: 24px;">This is an automated message. Please do not reply to this email.</div>
      </div>
    `,
    text: `
      Welcome to HRMS
      
      Dear {{userName}},
      
      Your account has been created successfully. Please use the credentials below to log in:
  Employee Code: {{employeeCode}}
  Password: {{password}}
      
      Visit: {{siteUrl}}
      
      This password will expire in 24 hours for security reasons.
      If you didn't request this account, please ignore this email.
      
      This is an automated message. Please do not reply to this email.`
  },
  "OTP": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Your OTP Code</h2>
        
        <p>Dear {{userName}},</p>
        
        <p>Your One-Time Password (OTP) is:</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
          <strong style="font-size: 24px; color: #007bff;">{{password}}</strong>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This OTP is valid for the next 5 minutes.<br>
          If you didn't request this OTP, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
      Your OTP Code
      
      Dear {{userName}},
      
      Your One-Time Password (OTP) is:
    
      OTP: {{password}}

      Important: This OTP is valid for the next 5 minutes.
      If you didn't request this OTP, please ignore this email.

      This is an automated message. Please do not reply to this email.
        `
  },
  "PasswordReset": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f4f6fb; border-radius: 12px; border: 1px solid #e3e6ed;">
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Password Reset</h2>
        <p style="text-align:center; color:#4a5568; margin-bottom: 24px;">Your password has been reset successfully.</p>
        <div style="background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 2px 8px #e2e8f0; margin-bottom: 24px;">
          <p style="font-size: 16px; color: #333;">Dear <strong>{{userName}}</strong>,</p>
          <p style="font-size: 15px; color: #555;">Please use the credentials below to log in:</p>
          <div style="margin: 18px 0; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
            <div style="font-size: 16px; color: #007bff; margin-bottom: 6px;"><strong>Employee Code:</strong> {{employeeCode}}</div>
            <div style="font-size: 16px; color: #007bff;"><strong>Password:</strong> {{password}}</div>
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 18px;">This password will expire in 24 hours for security reasons.<br>If you didn't request this password reset, please contact support immediately.</p>
          <a href="{{siteUrl}}" style="display:inline-block; background:#007bff; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; margin-bottom: 10px;">Visit Site</a>
          <div style="margin-top: 10px; font-size: 13px; color: #4a5568;">Or copy and paste this URL in your browser:<br><span style="color:#007bff;">{{siteUrl}}</span></div>
        </div>
        <div style="text-align:center; color:#a0aec0; font-size:12px; margin-top: 24px;">This is an automated message. Please do not reply to this email.</div>
      </div>
    `,
    text: `
      Password Reset
      
      Dear {{userName}},
      
      Your password has been reset. Please use the credentials below to log in:
  Employee Code: {{employeeCode}}
  Password: {{password}}
      
      Visit: {{siteUrl}}
      
      This password will expire in 24 hours for security reasons.
      If you didn't request this password reset, please contact support immediately.
      
      This is an automated message. Please do not reply to this email.`
  },
  "RESET2FA": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">2FA Reset Request</h2>
        
        <p>Dear {{userName}},</p>
        
        <p>We received a request to reset the Two-Factor Authentication (2FA) for your account. Please click the link below to proceed. The link is valid for 15 minutes.</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
          <a href="{{resetLink}}" style="font-size: 18px; color: #007bff; text-decoration: none;">Reset 2FA</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email and contact support immediately.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
      2FA Reset Request
      
      Dear {{userName}},
      
      We received a request to reset the Two-Factor Authentication (2FA) for your account. Please copy and paste the following link into your browser to proceed. The link is valid for 15 minutes.
    
      Reset Link: {{resetLink}}
      
      If you didn't request this, please ignore this email and contact support immediately.
      
      This is an automated message. Please do not reply to this email.`
  }
};

// Helper function to replace template variables
const replaceTemplateVariables = (template, variables) => {
  let result = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
};

// Pick the SMTP server from the sender's email domain.
// Gmail addresses use Gmail SMTP; Outlook/Hotmail personal addresses use
// Outlook SMTP; any other domain (e.g. Microsoft 365 custom domains like
// support@toriiminds.com) goes through Office 365 SMTP.
// Override per-deployment with SMTP_HOST/SMTP_PORT env vars if needed.
const getSmtpConfig = (senderEmail) => {
  if (process.env.SMTP_HOST) {
    return { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: false };
  }
  const domain = (senderEmail || "").split("@")[1]?.toLowerCase() || "";
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return { host: "smtp.gmail.com", port: 587, secure: false };
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) {
    return { host: "smtp-mail.outlook.com", port: 587, secure: false };
  }
  return { host: "smtp.office365.com", port: 587, secure: false };
};

const sendmail = async (subject, type, username, email, password, organizationEmail, organizationAppPassword, employeeCode = "") => {
  if (organizationEmail === "toriiminds@gmail.com") {
    console.log({ email, password });
    console.log("It's a tori mail");
  }

  // Determine site URL based on NODE_ENV
  let siteUrl = process.env.FRONTEND_PRODUCTION_URL;
  if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase().includes("staging")) {
    siteUrl = process.env.FRONTEND_STAGING_URL;
  }

  const transporter = nodemailer.createTransport({
    ...getSmtpConfig(organizationEmail),
    auth: {
      user: organizationEmail,
      pass: decryptThis(JSON.parse(organizationAppPassword).encryptedData, JSON.parse(organizationAppPassword).iv)
    }
  });
  // Check if template type exists
  if (!emailTemplates[type]) {
    throw new Error(`Email template type "${type}" not found`);
  }

  const template = emailTemplates[type];
  let variables = {
    userName: username,
    password: password,
    employeeCode: employeeCode,
    siteUrl: siteUrl,
    resetLink: password // for RESET2FA, password is actually the resetLink
  };

  // Replace variables in both HTML and text templates
  let htmlContent = replaceTemplateVariables(template.html, variables);
  let textContent = replaceTemplateVariables(template.text, variables);

  // Email options — `from` must match the authenticated organizationEmail
  const mailOptions = {
    from: organizationEmail,
    to: email,
    subject,
    html: htmlContent,
    text: textContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

const generatePassword = () => {
  const password = generator.generate({
    length: 14,
    numbers: true,
    lowercase: true,
    uppercase: true,
    excludeSimilarCharacters: true
  });

  return password;
}

module.exports = {
  sendmail,
  generatePassword,
  getSmtpConfig
};