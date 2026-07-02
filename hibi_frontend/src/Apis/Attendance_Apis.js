import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";
// import { success } from "zod";

async function getAttendance(data) {
    try {
        // Make the API call to create a privilege
        console.log(data)
        const response = await axiosInstance.post("/api/attendance/get-employee-attendance", data);
        console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data,
                message: response.data.message
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAttendanceInNumber(data) {
    try {
        // Make the API call to create a privilege
        // console.log(data)
        const response = await axiosInstance.post("/api/attendance/get-attended-employee-count", data);
        // console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data,
                message: response.data.message
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function ProcessAttendancePunches(data) {
    try {
        const response = await axiosInstance.post("/api/attendance/process-attendance-punches", data);
        if (response.status) {
            return {
                success: true,
                data: response.data?.data,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAttendanceStatusTypes() {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.get("/api/attendence-status-types/get-attendance-status");
        console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data,
                message: response.data.message
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function getAttendenceStatus() {
    try {
        const response = await axiosInstance.get("/api/attendence-status-types/get-attendance-status");
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response?.data?.data
            }
        }
        else {
            return {
                success: false,
                error: "Something went wrong"
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

async function allEmployeeAttendence(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/attendance/get-all-employee-attendance", data);
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
                error: "Fail to get Data"
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
        }
    }

}

async function getAttendenceStatustics(data) {
    try {
        const res = await axiosInstance.post("/api/attendance/get-employees-status", data);
        if (res) {
            return {
                success: true,
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
        }
    }
}

async function AddAttendance(data) {
    try {
        const res = await axiosInstance.post("/api/attendance/add-attendance-to-employees", data);
        if (res && (res.status === 200 || res.status === 201)) {
            return {
                success: true,
                data: res.data,
                message: res.data?.message || "Attendance added successfully"
            }
        } else {
            return {
                success: false,
                error: res?.data?.message || "Failed to add attendance"
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
        }
    }
}



export const Attendance_Apis = {
    getAttendance,
    getAttendenceStatus,
    allEmployeeAttendence,
    getAttendanceStatusTypes,
    getAttendanceInNumber,
    getAttendenceStatustics,
    ProcessAttendancePunches,
    AddAttendance,
}
