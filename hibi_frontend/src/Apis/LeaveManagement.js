import axiosInstance from '@/config/axiosConfig';

async function getLeavetypes() {
    try {
        const response = await axiosInstance.get('api/leave-types/get-leave-types');
        if (response.status == 200) {
            return {
                success: true,
                data: response.data,
            };
        } else {
            return {
                success: false,
                data: [],
            };
        }
    } catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function addLeaveRequest(data) {
    try {
        const response = await axiosInstance.post('/api/leave-requests/add-leave-request', data);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
            };
        } else {
            return {
                success: false,
                data: 'An unexpected error occurred while getting all previlages',
            };
        }
    } catch (error) {
        // console.log(error);
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function ActionRequired(data) {
    try {
        const response = await axiosInstance.post('api/leave-requests/get-action-required-leaves', data);
        console.log(data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
            };
        } else {
            return {
                success: false,
                data: response.data,
            };
        }
    } catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function ProcessLeaveRequest(data) {
    try {
        console.log(data);
        const response = await axiosInstance.post('api/leave-requests/process-leave-request', data);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
            };
        } else {
            return {
                success: false,
                data: response.data,
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function GetEmployeeLeaveRequest(data) {
    try {
        const response = await axiosInstance.post("/api/leave-requests/get-employee-leave-requests", data)
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response?.data?.data,
            }
        }
        else {
            return {
                success: false,
                data: response.data,
            };
        }
    }
    catch (error) {
        console.log(error);
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };

    }
}

async function DeleteLeaveRequest(id) {
    try {
        const response = await axiosInstance.delete(`/api/leave-requests/delete-leave-request/${id}`)
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data,
            }
        }
        else {
            return {
                success: false,
                data: response.data || "Failed to Delete Leave Request"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function get_temporary_assignment_data() {
    try {
        const response = await axiosInstance.get("/api/leave-requests/get-temporary-assignment-data");
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response?.data?.data
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
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function cancelLeave(data) {
    try {
        console.log(data)
        const response = await axiosInstance.post("/api/leave-requests/cancel-leave-request", data);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: response.data || "Failed to Cancel Leave Request"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}


async function ConsiderationTypes() {
    try {
        const res = await axiosInstance.get("/api/leave-consideration/get-consideration-types");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: response.data || "Failed to get Consideration Leave Request"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}

async function getWorkingDays(data) {
    try {
        const res = await axiosInstance.post("api/leave-requests/get-working-days", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: response.data || "Failed to get Consideration Leave Request"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}


async function getOdandCl() {
    try {
        const res = await axiosInstance.get("/api/cls-od/employee-cls-ods");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "failed to get CD's and OD's"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }
}


async function OrganizationLeaves(data) {
    try {
        const res = await axiosInstance.post("/api/leave-requests/get-all-leave-requests",data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "failed to get CD's and OD's"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while getting all previlages',
        };
    }

}
const LeaveManagementApi = {
    getLeavetypes,
    addLeaveRequest,
    ActionRequired,
    ProcessLeaveRequest,
    GetEmployeeLeaveRequest,
    DeleteLeaveRequest,
    get_temporary_assignment_data,
    cancelLeave,
    ConsiderationTypes,
    getWorkingDays,
    getOdandCl,
    OrganizationLeaves
};

export default LeaveManagementApi;
