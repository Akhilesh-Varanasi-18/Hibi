import axiosInstance from "@/config/axiosConfig";

// Add Leave Type
async function createLeaveType(data) {
    try {
        const response = await axiosInstance.post('/api/leave-types/add-leave-type', data);
        if (response.status === 201 || response.status === 200) {
            return {
                success: true,
                message: 'Leave type created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to create leave type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating leave type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Get Leave Types
async function getLeaveTypes() {
    try {
        const response = await axiosInstance.get('/api/leave-types/get-leave-types');
        if (response.status === 200) {
            return {
                success: true,
                data: response.data?.leaveTypes || response.data || [],
            };
        } else {
            return {
                success: false,
                data: [],
                error: response.data?.error || 'Failed to fetch leave types'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching leave types',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Update Leave Type
async function updateLeaveType(data) {
    try {
        const response = await axiosInstance.put('/api/leave-types/update-leave-type', data);
        if (response.status === 200) {
            return {
                success: true,
                message: 'Leave type updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to update leave type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating leave type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Delete Leave Type
async function deleteLeaveType(id) {
    try {
        const response = await axiosInstance.delete(`/api/leave-types/delete-leave-type/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: 'Leave type deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete leave type',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting leave type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const leavesTypeApi = {
    createLeaveType,
    getLeaveTypes,
    updateLeaveType,
    deleteLeaveType,
};

export default leavesTypeApi;
