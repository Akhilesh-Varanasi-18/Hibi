import axiosInstance from "@/config/axiosConfig";

// Create Designation
async function createDesignation(data) {
    try {
        const response = await axiosInstance.post('/api/designation/add-new-designation', data);
        if (response.status === 201 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Designation created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to create designation',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating designation',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Get All Designations
async function getDesignations() {
    try {
        const response = await axiosInstance.get('/api/designation/get-all-designations');
        console.log(response);
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.designations || [],
            };
        } else {
            return {
                success: false,
                data: [],
                error: response.data?.error || 'Failed to fetch designations'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching designations',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Delete Designation
async function deleteDesignation(id) {
    try {
        const response = await axiosInstance.delete(`/api/designation/delete-designation/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: response.data.message || 'Designation deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete designation',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting designation',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Update Designation
async function updateDesignation(data) {
    try {
        const response = await axiosInstance.put(
            '/api/designation/update-designation',
            { ...data, designationId: data._id }
        );
        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Designation updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to update designation',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating designation',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const designationApi = {
    createDesignation,
    getDesignations,
    deleteDesignation,
    updateDesignation,
};

export default designationApi;