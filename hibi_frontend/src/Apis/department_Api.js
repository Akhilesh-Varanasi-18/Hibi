import axiosInstance from "@/config/axiosConfig";

// Create Department
async function createDepartment(data) {
    try {
        const response = await axiosInstance.post('/api/department/add-new-department', data);
        if (response.status === 201 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Department created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to create department',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Get All Departments
async function getDepartments() {
    try {
        const response = await axiosInstance.get('/api/department/get-all-departments');
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.departments || response.data || [],
            };
        } else {
            return {
                success: false,
                data: [],
                error: response.data?.error || 'Failed to fetch departments'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching departments',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Delete Department
async function deleteDepartment(id) {
    try {
        const response = await axiosInstance.delete(`/api/department/delete-department/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: response.data.message || 'Department deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to delete department',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

// Update Department
async function updateDepartment(data) {
    try {
        const response = await axiosInstance.put(
            '/api/department/update-department',
            { ...data, departmentId: data._id }
        );
        if (response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Department updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to update department',
                details: response.data?.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating department',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const departmentApi = {
    createDepartment,
    getDepartments,
    deleteDepartment,
    updateDepartment,
};

export default departmentApi;