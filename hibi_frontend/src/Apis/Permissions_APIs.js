import axiosInstance from "@/config/axiosConfig";
import { formdataToJSON } from "@/utils/DateFunctions";

async function getAllPermissionTypes() {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.get("/api/permission-types/get-permission-types");
        // console.log(response)
        // Check if the response is successful and contains data
        if (response.status == 200 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAllTeamLeads() {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.get("/api/employee/get-team-leads");
        // console.log(response)
        // Check if the response is successful and contains data
        if (response.status == 200 && response.data) {
            // console.log(response.data)
            return {
                success: true,
                data: response.data?.teamLeads,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAllManagers() {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.get("/api/employee/get-managers");
        console.log(response)
        // Check if the response is successful and contains data
        if (response.status == 200 && response.data) {
            // console.log(response.data)
            return {
                success: true,
                data: response.data?.managers                ,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function AddNewPermissionRequest(data) {
    try {
        // Make the API call to create a privilege
        // console.log(data)
        const response = await axiosInstance.post("/api/permission-requests/add-request",data);
        console.log(response)
        // Check if the response is successful and contains data
        if (response.status == 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getActionRequiredPermissions(data) {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.post("/api/permission-requests/get-action-required-permissions",data);
        console.log(response)
        // Check if the response is successful and contains data
        // console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
// OrganizationActionRequiredRequests fetches all org permission requests for which action is required
async function OrganizationActionRequiredRequests(data) {
    try {
        // API call to get all organization permission requests that require action
        const response = await axiosInstance.post(
            "/api/permission-requests/get-all-permission-requests",
            data
        );
        // Check if the response is successful and contains data
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message,
            };
        } else {
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {},
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {},
        };
    }
}
async function getPermissionRequestFlow(id) {
    try {
        // Make the API call to create a privilege
        const response = await axiosInstance.get(`/api/permission-requests/get-permission-request-flow/${id}`);
        console.log(response)
        // Check if the response is successful and contains data
        // console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAllEmployeePermissions(data) {
    try {
        console.log(data)
        const response = await axiosInstance.post("/api/permission-requests/get-employee-requests",data);
        console.log(response)
        // Check if the response is successful and contains data
        // console.log(response)
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message 
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error , 
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getAllStatusTypes() {
    try {
        const response = await axiosInstance.get("/api/status/get-status-types");
        console.log(response)
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                error: response.data.error,
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

// New function: processPermissionRequest
async function processPermissionRequest(formdata) {
    // Convert formdata (which may be a FormData object) to a plain JSON object
    try {
        // const jsonData = formdataToJSON(formdata)
        const response = await axiosInstance.post("/api/permission-requests/process-request", formdata);
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                error: response.data.error,
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
async function cancelPermissionRequest(data) {
    console.log(data)
    data.actionReason = data.approverReason;

    try {
        const response = await axiosInstance.post("/api/permission-requests/cancel-permission-request", data);
        console.log("API Response from cancel ", response);
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


const permissionsAPI = {
    getAllPermissionTypes,
    getAllManagers,
    getAllTeamLeads,
    AddNewPermissionRequest,
    getActionRequiredPermissions,
    getAllStatusTypes,
    processPermissionRequest, 
    getAllEmployeePermissions,
    getPermissionRequestFlow,
    cancelPermissionRequest,
    OrganizationActionRequiredRequests,
};

export default permissionsAPI;