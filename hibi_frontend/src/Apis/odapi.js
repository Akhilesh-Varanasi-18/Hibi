import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function add_request(data) {
    try {
        const res = await axiosInstance.post("/api/od-requests/add-request", data);
        if (res.status == 200 || res.status == 201) {
            console.log(res)
            return {
                success: true,
                data: res?.data?.message
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}
async function GetActionRequests(data) {
    try {
        const res = await axiosInstance.post("/api/od-requests/action-required-requests", data);
        if (res.status == 200 || res.status == 201) {
            console.log(res)
            return {
                success: true,
                data: res?.data?.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}
async function ProcessActionRequests(data) {
    try {
        const res = await axiosInstance.post("/api/od-requests/process-request", data);
        if (res.status == 200 || res.status == 201) {
            console.log(res)
            return {
                success: true,
                data: res?.data?.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}


async function getemployeeRequest(data) {
    try {
        const res = await axiosInstance.post("/api/od-requests/get-requests", data);
        if (res.status == 200 || res.status == 201) {
            console.log(res)
            return {
                success: true,
                data: res?.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }

}


async function getOrganizationRequest(data) {
    try {
        const res = await axiosInstance.post("/api/od-requests/get-all-od-requests", data);
        if (res.status == 200 || res.status == 201) {
            console.log(res)
            return {
                success: true,
                data: res?.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}


const odapi = {
    add_request,
    getemployeeRequest,
    GetActionRequests,
    ProcessActionRequests,
    getOrganizationRequest
}

export default odapi;