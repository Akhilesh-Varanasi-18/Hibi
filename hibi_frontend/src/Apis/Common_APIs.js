const { default: axiosInstance } = require("@/config/axiosConfig")

export async function getAllPrevilages(orgId) {
    try {
        const response = await axiosInstance.post("/api/privilege/get-all-privileges", { orgId: orgId })
        // console.log(response)
        if (response.status == 200) {
            return {
                success: true,
                data: response.data?.privileges
            }
        }
        else {
            return {
                success: false,
                data: []
            }
        }
    }
    catch (error) {
        console.log(error)
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        }
    }
}
export async function getOrgHeads(orgId) {
    try {
        console.log(orgId)
        const response = await axiosInstance.post("api/employee/ultimate-admin", { orgId: orgId })
        console.log(response)
        if (response.status) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: []
            }
        }
    }
    catch (error) {
        console.log(error)
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        }
    }
}
export async function getAllRoles(orgId) {
    // console.log("Fetching roles for orgId:", orgId);
    try {
        const response = await axiosInstance.post("/api/roles/get-all-roles", { orgId: orgId })
        if (response.status == 200) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: []
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all roles',
        }
    }
}


export async function getAllStatusTypes() {
    try {
        const response = await axiosInstance.get("/api/status/get-status-types");
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.data,
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
            error: error.response?.data?.message || error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


export async function NotifyTo() {
    try {
        const response = await axiosInstance.get("/api/employee/get-notify-to-Data");
        console.log("-------->", response);

        // If the response is 200 or 201 and data is an array with at least one element
        if (
            (response.status === 200 || response.status === 201) &&
            Array.isArray(response.data?.data) &&
            response.data.data.length > 0
        ) {
            return {
                success: true,
                data: response.data.data
            };
        }

        // Handle the special case where the backend returns a message instead of a data array
        if (
            (response.status === 200 || response.status === 201) &&
            (
                (typeof response.data?.data === "object" && !Array.isArray(response.data.data) && response.data.data !== null && response.data.data.message) ||
                (typeof response.data?.message === "string")
            )
        ) {
            return {
                success: false,
                data: [],
                message: response.data?.data?.message || response.data?.message
            };
        }

        // Fallback: no data, no message
        return {
            success: false,
            data: [],
            message: response.data?.message || "No NotifyTo data found."
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting Notify To Data',
        }
    }
}
export async function getEmployeeShifts() {
    try {
        const response = await axiosInstance.get("/api/employee/get-employee-shift");
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response?.data?.data?.length > 0 ? response?.data?.data[0] : {
                    breakTime
                        :
                        "13:00",
                    endTime
                        :
                        "16:30",
                    name
                        :
                        "GENERAL",
                    startTime
                        :
                        "09:30",
                    "breakTimeEnd": "14:00",
                    "breakTimeStart": "13:00"
                }
            }
        }
        else {
            return {
                success: false,
                data: []
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all roles',
        }
    }
}

export async function getAllEmployeesData() {
    try {
        const response = await axiosInstance.get("/api/employee/get-all-employees-with-privilege-and-role")
        if (response.status == 200) {
            return {
                success: true,
                data: response?.data?.employees
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
export async function getHolidays(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/holidays/get-holidays", data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data || [],
                message: response.data.message || "Holidays fetched successfully"
            }
        }
        else {
            return {
                success: false,
                error: "Fail to get Data",

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