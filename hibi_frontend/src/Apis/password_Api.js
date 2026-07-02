import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function ChangePassword(data) {
    try {
        const response = await axiosInstance.post("/api/password/change-password", data);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data,
                message: response.data?.message
            };
        } else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function ForgotPassword(data) {
    console.log(data);
    try {
        const response = await axiosInstance.post("/api/password/forget-password", data);
        console.log(response);
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message: response.data?.message,
                status: response.status
            };
        } else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function VerifyOTPForgotPassword(data) {
    console.log(data);
    try {
        const response = await axiosInstance.post("/api/password/verify-otp-forgot-password", data);
        console.log(response);
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message: response.data?.message
            };
        } else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function verifyOldPassword(data) {
    try {
        console.log(data);
        const res = await axiosInstance.post("/api/password/change-password", data);
        console.log(res)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data,
            }
        }
        else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}

async function verifyOtpChangePassword(data) {
    try {
        console.log(data);
        const res = await axiosInstance.post("/api/password/verify-otp-change-password", data);
        console.log(res)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data,
            }
        }
        else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}


async function setNewPassword(data) {
    try {
        console.log(data);
        const res = await axiosInstance.post("/api/password/set-new-password", data);
        console.log(res)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data,
            }
        }
        else {
            return {
                success: false,
                error: "can't change password right now try after sometime"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}


async function resendPassword(code) {
    try {
        const res = await axiosInstance.post("/api/password/resend-password", { "employeeCode": code });
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                message: res?.data?.message
            }
        }
        else {
            return {
                success: false,
                error: "Failed to resend Password"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}
const PasswordApi = {
    ChangePassword,
    ForgotPassword,
    VerifyOTPForgotPassword,
    verifyOldPassword,
    verifyOtpChangePassword,
    setNewPassword,
    resendPassword
}

export default PasswordApi;