"use client"

import axiosInstance from "@/config/axiosConfig";

async function createOrganization(data) {
    try {
        const response = await axiosInstance.post("/api/organization/add-organization", data);
        // console.log(response);
        if (response && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Organization created successfully'
            };
        } else {
            // Handle API-level errors (when success is false)
            return {
                success: false,
                error: response.data.error || 'Failed to create organization',
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating organization',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function GstChecking(gstin) {
    try {
        const response = await axiosInstance.get(`api/organization/get-gst-data/${gstin}`)
        console.log(response);
        if (response) {
            return {
                success: true,
                data: response?.data?.data,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while checking Gst Number',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function addEmployee(data) {
    console.log(data);
    try {
        const response = await axiosInstance.post("/api/employee/add-new-employee", data)
        console.log(response);
        if (response.status == 201) {
            return {
                success: true,
                data : response.data || "successfully Added Employee",
                message : response.data?.message || "successfully Added Employee"

            }
        }
        else {
            return {
                success: false,
                error: response.data?.error || 'Failed to Add Employee',
            }
        }

    }
    catch (error) {
        console.log(error)
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function DeleteOrganization(orgid) {
    try {
        const response = await axiosInstance.delete(`/api/organization/delete-organization/${orgid}`);
        if (response.status == 200) {
            return {
                success: true,
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function UpdateOrganization(data) {
    try {
        const response = await axiosInstance.put("/api/organization/update-organization", data);
        if (response.status == 200) {
            return {
                success: true,
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function GettingOraganizationDatawithHead() {
    try {
        const response = await axiosInstance.get("/api/product-manager/get-all-organizations-and-heads-data");
        console.log(response)
        if (response?.data) {
            return {
                success: true,
                data: response?.data?.organizations,
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
            data : [],
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}

async function UpdatingOrganizationHead(data) {
    try {
        const response = await axiosInstance.put("/api/organization-head/update-organization-head", data)
        if (response.status == 200) {
            return {
                success: true,
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function getEmployeeData() {
    try {
        const response = await axiosInstance.get("/api/employee/get-general-employees")
        if (response.status == 200) {
            return {
                success: true,
                data : response?.data
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function getOrganizationData() {
    try {
        const response = await axiosInstance.get("/api/organization/get-organization-data")
        console.log(response,response?.data?.data[0])
        if (response.status == 200) {
            return {
                success: true,
                data : response?.data?.data[0]
            }
        }
        else {
            return {
                success: false,
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while Adding Organizations Head',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
// async function getAllEmployeesData() {
//     try {
//         const response = await axiosInstance.get("/api/employee/get-all-employees-with-privilege-and-role")
//         if (response.status == 200) {
//             return {
//                 success: true,
//                 data : response?.data?.employees
//             }
//         }
//         else {
//             return {
//                 success: false,
//             }
//         }
//     }
//     catch (error) {
//         return {
//             success: false,
//             error: error.response?.data?.message ||
//                 error.message ||
//                 'An unexpected error occurred while Adding Organizations Head',
//             status: error.response?.status,
//             details: error.response?.data?.details || {}
//         }
//     }
// }

const OrganizationApi = {
    // getAllEmployeesData,
    createOrganization,
    GstChecking,
    addEmployee,
    DeleteOrganization,
    UpdateOrganization,
    GettingOraganizationDatawithHead,
    UpdatingOrganizationHead,
    getEmployeeData,
    getOrganizationData
}

export default OrganizationApi;