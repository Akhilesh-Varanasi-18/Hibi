import axiosInstance from "@/config/axiosConfig";

// Add New Shift
async function createShift(data) {
    try {
        const response = await axiosInstance.post('/api/shift/add-new-shift', data);
        // The API does not return a response body, so just check status
        if (response.status === 201 || response.status === 200) {
            return {
                success: true,
                message: 'Shift created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to create shift',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        // console.log(error);
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating shift',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Get All Shifts
async function getShifts() {
    try {
        const response = await axiosInstance.get('/api/shift/get-all-shifts');
        // The API does not return a response body, so just check status
        if (response.status === 200) {
            return {
                success: true,
                // If the backend returns data, use it, otherwise return empty array
                data: response.data?.shifts || response.data || [],
            };
        } else {
            return {
                success: false,
                data: [],
                error: response.data?.error || 'Failed to fetch shifts'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching shifts',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Update Shift
async function updateShift(data) {
    try {
        // data should include: shiftId, name, startTime, endTime
        const response = await axiosInstance.put('/api/shift/update-shift', data);
        // The API does not return a response body, so just check status
        if (response.status === 200) {
            return {
                success: true,
                message: 'Shift updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to update shift',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating shift',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Delete Shift
async function deleteShift(id) {
    try {
        const response = await axiosInstance.delete(`/api/shift/delete-shift/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: 'Shift deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete shift',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting shift',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const shiftsApi = {
    createShift,
    getShifts,
    updateShift,
    deleteShift,
};

export default shiftsApi;