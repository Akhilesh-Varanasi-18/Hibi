import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function getRoute() {
    try {
        const res = await axiosInstance.get("/api/meta-data/routes");
        if (res.status == 200) {
            return {
                success: true,
                data: res?.data?.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to get route Data"
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

async function addPermission(data) {
    try {
        console.log(data);
        const res = await axiosInstance.post("/api/permissions/create-permission",data);
        console.log(res)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "Something went Wrong"
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


const accessControlApi = {
    getRoute,
    addPermission
}


export default accessControlApi;