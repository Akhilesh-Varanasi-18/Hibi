import axiosInstance from "@/config/axiosConfig";
async function createRole(data) {
    try {
        const response = await axiosInstance.post("/api/roles/add-new-role", data);
        if (response.status == 201 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Role created successfully'
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error || 'Failed to create role',
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating role',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function GettingRoles() {
    try {
        const response = await axiosInstance.post("api/roles/get-all-roles");
        if (response.status === 200 && response.data) {
            return {
                success: true,
                data: response.data.roles,
                message: 'Roles fetched successfully'
            };
        } else {
            return {
                data : response.data.roles,
                success: false,
                error: response.data.error || 'Failed to fetch roles',
                details: response.data.details || {}
            };
        }
    }
    catch (error) {
        console.log(error)
        return {
            data : [],
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching roles',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function updateRole(data)
{
    try{
        const response = await axiosInstance.put("api/roles/update-role",data);
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.role,
                message: 'Role updated successfully'
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to update role',
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
                'An unexpected error occurred while updating role',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function deleteRole(roleId)
{
    try
    {
        const response=await axiosInstance.delete(`api/roles/delete-role/${roleId}`)
        if(response.status=200 && response.data)
        {
            return{
                success:true,
                data:response.data
            }
        }
        else{
            return{
                success:false,
                data:response.data
            }
        }

    }
    catch(error)
    {
         return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating role',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

const roleApi = {
    createRole,
    GettingRoles,
    updateRole,
    deleteRole

}

export default roleApi;