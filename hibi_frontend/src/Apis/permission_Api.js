import axiosInstance from "@/config/axiosConfig";

// Get Permission Types
async function getPermissionTypes() {
    try {
        const response = await axiosInstance.get('/api/permission-types/get-permission-types');
        if (response.status === 200) {
            return { success: true, data: response.data || [] };
        } else {
            return { success: false, data: [], error: "Failed to fetch permission types" };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Unexpected error while fetching permission types",
            status: error.response?.status,
        };
    }
}

// Update Permission Type
async function updatePermissionType(data) {
    try {
        const response = await axiosInstance.put(
            '/api/permission-types/update-permission-type',
            { ...data, permissionTypeId: data._id }
        );
        if (response.status === 200) {
            return { success: true, data: response.data, message: "Permission type updated successfully" };
        } else {
            return { success: false, error: "Failed to update permission type" };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Unexpected error while updating",
            status: error.response?.status,
        };
    }
}

// Delete Permission Type
async function deletePermissionType(id) {
    try {
        const response = await axiosInstance.delete(`/api/permission-types/delete-permission-type/${id}`, {
        }); 
        if (response.status === 200) {
            return { success: true, message: "Permission type deleted successfully" };
        } else {
            return { success: false, error: "Failed to delete permission type" };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Unexpected error while deleting",
            status: error.response?.status,
        };
    }
}

// Create Permission Type
async function createPermissionType(data) {
    try {
        const response = await axiosInstance.post('/api/permission-types/add-permission-type', data);
        if (response.status === 201 || response.status === 200) {
            return { success: true, data: response.data, message: "Permission type created successfully" };
        } else {
            return { success: false, error: "Failed to create permission type" };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Unexpected error while creating permission type",
            status: error.response?.status,
        };
    }
}

const permissionApi = {
    getPermissionTypes,
    updatePermissionType,
    deletePermissionType,
    createPermissionType,
};

export default permissionApi;
