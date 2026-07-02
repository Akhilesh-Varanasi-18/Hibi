import axiosInstance from "@/config/axiosConfig";

async function GetPayrollReports(data) {
    try {
        const res = await axiosInstance.post("/api/attendence-reports/get-attendence-report", data);
        console.log(res)
        if (res.status) {
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
async function GetPendingRequests(data) {
    try {
        const res = await axiosInstance.post("/api/employee-stats/get-all-pending-requests", data);
        console.log(res)
        if (res.status) {
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


async function RefreshAttendence(data) {
    try {
        const res = await axiosInstance.post("/api/attendance/process-attendance-punches", data);
        console.log(res)
        if (res.status) {
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



export const payrollApis = {
    GetPayrollReports,
    RefreshAttendence,
    GetPendingRequests
}