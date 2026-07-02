import axiosInstance from "@/config/axiosConfig";

async function getTopAttendedEmployees(params) {
    try {
        const res = await axiosInstance.post("/api/attendance/get-top-attendance-employees", params);
        if (res.status === 200 || res.status === 201) {
            return {
                success: true,
                data: res.data,
                message: res?.data?.message || "Top attended employees fetched successfully"
            };
        } else {
            return {
                success: false,
                data: res.data
            };
        }
    } catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while fetching top attended employees",
        };
    }
}
async function getTopLeavesEmployees(params) {
    try {
        const res = await axiosInstance.post("/api/leave-requests/get-top-leaves-employees", params);
        if (res.status === 200 || res.status === 201) {
            return {
                success: true,
                data: res.data,
                message: res?.data?.message || "Top attended employees fetched successfully"
            };
        } else {
            return {
                success: false,
                data: res.data
            };
        }
    } catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while fetching top attended employees",
        };
    }
}

export const StatisticsAPI = {
    getTopAttendedEmployees,
    getTopLeavesEmployees,
};