import axiosInstance from "@/config/axiosConfig";

// Get All Status Types
async function getStatusTypes() {
    try {
        const response = await axiosInstance.get('/api/status/get-status-types');
        console.log(response)
        if (response.status === 200) {
            return {
                success: true,
                data: response.data?.data || response.data || [],
            };
        } else {
            return {
                success: false,
                data: [],
                error: response.data?.error || 'Failed to fetch status types'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching status types',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Create New Status Type
async function createStatusType(data) {
    try {
        const response = await axiosInstance.post('/api/status/add-status-type', data);
        if (response.status === 201 || response.status === 200) {
            return {
                success: true,
                message: 'Status type created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to create status type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            error: error.response?.data?.message || error.response?.data?.error ||
                error.message ||
                'An unexpected error occurred while creating status type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Update Status Type
async function updateStatusType(data) {
    try {
        // data should include: statusTypeId, statusType
        const response = await axiosInstance.put('/api/status/update-status-type', data);
        if (response.status === 200) {
            return {
                success: true,
                message: 'Status type updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to update status type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating status type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Delete Status Type
async function deleteStatusType(id) {
    try {
        const response = await axiosInstance.delete(`/api/status/delete-status-type/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: 'Status type deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete status type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting status type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const statusApi = {
    getStatusTypes,
    createStatusType,
    updateStatusType,
    deleteStatusType,
};

export default statusApi;
