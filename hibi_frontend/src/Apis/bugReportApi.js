import axiosInstance from "@/config/axiosConfig";


async function createBug(data) {
    try {
        const res = await axiosInstance.post("/api/bug-reports/create-bug-report", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res?.data,
                message: res?.data?.message
            }
        }
        else {
            return {
                success: false,
                error: res?.data?.message
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }

}


async function getBugs() {
    try {
        const res = await axiosInstance.get("/api/bug-reports/all-bug-reports");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data,
            }
        }
        else {
            return {
                success: false,
                error: res.data.message
            }
        }

    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}


async function updateBugs(data) {
    try {
        const res = await axiosInstance.put("/api/bug-reports/update-bug-report", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res?.data,
                message: res?.data?.message
            }
        }
        else {
            return {
                success: false,
                error: res?.data?.message
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }

}


const bugReportApi = {
    createBug,
    getBugs,
    updateBugs
}



export default bugReportApi;