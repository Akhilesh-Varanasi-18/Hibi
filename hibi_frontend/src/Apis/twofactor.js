import axiosInstance from "@/config/axiosConfig";
async function Confirm_2fa_reset(token) {
    try {
        const res = await axiosInstance.get(`/api/password/confirm-2fa-reset?token=${token}`);
        if (res.status) {
            return {
                success: true,
                data: res?.data?.message || "Confirmed 2 Factored Authentication"
            }
        }

    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function Request_2fa_reset(email) {
    try {
        const res = await axiosInstance.post("api/password/request-2fa-reset", { email: email });
        if (res.status) {
            return {
                success: true,
                data: res?.data?.message || "Email Sent to Your Office Mail"
            }
        }

    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}


async function toggle_2fa(data) {
    try {
        const res = await axiosInstance.post("/api/password/toggle-2fa",data);
        if (res.status == 200) {
            return {
                success: true,
                message: res.data.message,
                data: res.data
            }
        } else if (res.status == 202) {
            return {
                success: true,
                setup: true,
                message: res.data.message,
                data: res.data
            }
        }

    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}


const MFA_api = {
    Confirm_2fa_reset,
    Request_2fa_reset,
    toggle_2fa
}

export default MFA_api;