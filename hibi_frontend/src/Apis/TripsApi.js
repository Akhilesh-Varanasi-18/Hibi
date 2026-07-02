import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function addTrip(data) {
    try {
        const res = await axiosInstance.post("/api/trip/create-trip", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "something went Wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Trip',
        }
    }

}


async function getTrips() {
    try {
        const res = await axiosInstance.get("/api/trip/get-trips");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "Somethinh went Wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all trips',
        }
    }

}

async function updateTrip(data) {
    try {
        const res = await axiosInstance.put("/api/trip/update-trip", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "something went wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Updating Trips',
        }
    }

}

async function deleteTrip(id) {
    try {
        const res = await axiosInstance.delete(`api/trip/delete-trip/${id}`);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "something went wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting Trips',
        }
    }

}


async function updateStatus(data) {
    try {
        const res = await axiosInstance.patch("/api/trip/change-trip-status", data)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "something went wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Updating Status',
        }
    }
}

const TripApi = {
    addTrip, getTrips, updateTrip, deleteTrip,updateStatus
}

export default TripApi;