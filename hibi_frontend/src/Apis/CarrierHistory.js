import axiosInstance from "@/config/axiosConfig";


async function createHistory(data) {
    try {
        const res = await axiosInstance.post("/api/career-history/create", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                data: res.data
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


async function updateHistory(data, id) {
    try {
        const res = await axiosInstance.put(`/api/career-history/update/${id}`, data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                data: res.data
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


async function getHistory() {
    try {
        const res = await axiosInstance.get("/api/career-history/get");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                data: res.data
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

async function deleteHistory(id) {
    try {
        const res = await axiosInstance.delete(`/api/career-history/delete/${id}`);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                data: res.data
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

const CarrierApi = {
    createHistory,
    updateHistory,
    getHistory,
    deleteHistory
}

export default CarrierApi;