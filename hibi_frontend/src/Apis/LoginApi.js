import axiosInstance from "@/config/axiosConfig";
import { setToast, showToast } from "@/lib/ToastService";
async function Login(data) {
    try {
        const response = await axiosInstance.post("/api/login/login-user", data)
        console.log(response);
        if (response.status) {
            // showToast("Logged In Successfully","success");
            return {
                success: true,
                data: response.data,
                message: response.data?.message || "Logged In Successfully",
                nextAction:response?.data?.nextAction,
                status:response?.status
            }
        }
        else {
            return {
                success: false,
                data: response.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Logging in',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function getBannerDetails(data) {
    try {
        const response = await axiosInstance.post("/api/login/verify-email", data);
        console.log(response);
        if (response.status) {
            // showToast("Logged In Successfully","success");
            return {
                success: true,
                data: response.data,
                message: response.data?.message || "Logged In Successfully",
                nextAction:response?.data?.nextAction,
                status:response?.status
            }
        }
        else {
            return {
                success: false,
                data: response.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Logging in',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function Verify(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/login/verify-otp", data)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message: response.data?.message || "Logged In Successfully",
                nextAction:response?.data?.nextAction,
                status:response?.status
            }
        }
        else {
            return {
                success: false,
                data: "Failed to Login"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Logging in',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function Logout() {
    try {
        const response = await axiosInstance.post("/api/login/logout-user")

        if (response.status) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: response.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Logging out',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function GetEmployeeData() {
    try {
        const response = await axiosInstance.get("/api/employee/get-employee-data")

        if (response.status) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: response.data
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
        }
    }
}
const LoginApi = {
    Login,
    GetEmployeeData,
    Logout,
    Verify,
    getBannerDetails,
}

export default LoginApi