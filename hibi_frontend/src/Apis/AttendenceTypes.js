import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";


async function addAttendence(body) {
    try {
        console.log(body)
        const response = await axiosInstance.post("/api/attendence-status-types/add-attendance-status", body);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Attendence"
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


async function getAttendence() {
    try {
        const response = await axiosInstance.get("/api/attendence-status-types/get-attendance-status");
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Attendence"
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


async function updateAttendence(body) {
    try {
        console.log(body)
        const response = await axiosInstance.put("/api/attendence-status-types/update-attendance-status", body);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Attendence"
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


async function deleteAttendence(id) {
    try {
        console.log(id)
        const response = await axiosInstance.delete(`/api/attendence-status-types/delete-attendance-status/${id}`);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Add Attendence"
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


const attendenceTypeapi={
    addAttendence,
    updateAttendence,
    getAttendence,
    deleteAttendence
}

export default attendenceTypeapi;