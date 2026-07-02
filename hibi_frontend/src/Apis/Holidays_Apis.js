import axiosInstance from "@/config/axiosConfig";

async function dowloadTemplate() {
    try {
        const response = await axiosInstance.get("/api/holidays/get-holiday-template", {
            responseType: "arraybuffer", // 👈 important for Excel files
        });

        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data, // binary data
            };
        } else {
            return {
                success: false,
                data: [],
            };
        }
    } catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}

async function createHolidays(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/holidays/add-holidays",data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
                message : response.data.message || "Holidays created successfully"
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
async function getHolidays(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/holidays/get-holidays",data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data || [],
                message : response.data.message || "Holidays fetched successfully"
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
async function UpdateHoliday(data) {
    console.log(data)
    try {
        const response = await axiosInstance.post("/api/holidays/update-holiday",data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data?.data || [],
                message : response.data.message || "Holidays fetched successfully"
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
async function deleteHoliday(id) {
    try {
        const response = await axiosInstance.delete(`/api/holidays/delete-holiday/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: response.data.message || 'Holiday deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete Holiday',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting Holiday',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
export const HolidaysAPI = {
    dowloadTemplate,
    createHolidays,
    getHolidays,
    UpdateHoliday,
    deleteHoliday,
}