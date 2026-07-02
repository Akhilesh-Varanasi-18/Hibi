import axiosInstance from "@/config/axiosConfig";

async function createPrevilege(data) {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.post("/api/privilege/add-new-privilege", data);
        // Check if the response is successful and contains data
        if (response.status == 201 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Privilege created successfully'
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error || 'Failed to create privilege',
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function getPrivileges() {
    try {
        const response = await axiosInstance.post("/api/privilege/get-all-privileges")
        console.log(response)
        if (response.status == 200) {
            return {
                success: true,
                data: response.data.privileges  || [],
            }
        }
        else {
            return {
                success: false,
                data: []
            }
        }

    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching privileges',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function deletePrivilege(id) {
    try {
        const response = await axiosInstance.delete(`/api/privilege/delete-privilege/${id}`);
        console.log(response)
        // Check if the response is successful and contains data
        if (response.status == 200) {
            return {
                success: true,
                message: response.data.message || 'Privilege deleted successfully'
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to delete privilege',
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function updatePrivilege(data) {
    try {
        const response = await axiosInstance.put("api/privilege/update-privilege", data);
        if (response.status == 200) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Privilege updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to update privilege',
                details: response.data.details || {}
            };
        }
    }
    catch(error)
    {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
const privilegeApi = {
    createPrevilege,
    getPrivileges,
    deletePrivilege,
    updatePrivilege,
};

export default privilegeApi;