import axiosInstance from "@/config/axiosConfig";

/**
 * Creates a new announcement with images. The input 'data' is expected to be
 * a FormData object containing 'announcements' (JSON string array of objects)
 * and 'images' (File(s)).
 * @param {object | FormData} data - The announcement data, expected to be FormData.
 * @returns {Promise<object>} An object containing success status, message, and error details if applicable.
 */
async function createAnnouncement(data) {
    try {
        console.log("Create Announcement Data:", data);

        // Directly post the data. Assuming 'data' is already a FormData object
        // correctly structured with 'announcements' and 'images', and that
        // axios handles the Content-Type automatically for FormData.
        const response = await axiosInstance.post("/api/announcements/create-announcement", data);

        console.log(response);

        if (response.status) {
            return {
                success: true,
                message: response.data.message
            };
        } else {
            // Handle API-level errors outside of the catch block
            return {
                success: false,
                error: response.data.error || "An unexpected error occurred",
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

// --------------------------------------------------------------------------

/**
 * Gets all existing announcements.
 * @returns {Promise<object>} An object containing success status, data (array of announcements), message, and error details if applicable.
 */
async function getAnnouncements() {
    try {
        const response = await axiosInstance.get("/api/announcements/get-announcements");
        console.log(response);

        if (response.status) {
            return {
                success: true,
                data: response.data?.data, // The success response format includes a 'data' array 
                message: response.data.message
            };
        } else {
            // Handle API-level errors outside of the catch block
            return {
                success: false,
                error: response.data.error || "An unexpected error occurred",
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

// --------------------------------------------------------------------------

/**
 * Deletes an announcement by its ID.
 * @param {string} id - The Announcement document _id.
 * @returns {Promise<object>} An object containing success status, message, and error details if applicable.
 */
async function deleteAnnouncement(id) {
    try {
        console.log(`Deleting announcement with ID: ${id}`);
        // The ID is passed as a URL parameter 
        const response = await axiosInstance.delete(`/api/announcements/delete-announcement/${id}`);
        console.log(response);

        if (response.status) {
            return {
                success: true,
                message: response.data.message
            };
        } else {
            // Handle API-level errors outside of the catch block
            return {
                success: false,
                error: response.data.error || "An unexpected error occurred",
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

// --------------------------------------------------------------------------

/**
 * Export the Announcement API functions.
 */
export const Announcements_Apis = {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement,
};