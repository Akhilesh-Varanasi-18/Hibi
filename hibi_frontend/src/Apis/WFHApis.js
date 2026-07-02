import axiosInstance from '@/config/axiosConfig';
import { success } from 'zod';

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
                'An unexpected error occurred',
        };
    }
}

async function addWFHRequest(data) {
    try {
        const response = await axiosInstance.post('/api/wfh-requests/add-request', data);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data,
            };
        } else {
            return {
                success: false,
                data: 'An unexpected error occurred',
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error :
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred',
        };
    }
}

async function ActionRequired(data) {
    try {
        const response = await axiosInstance.post('/api/wfh-requests/get-action-required-requests', data);
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
                'An unexpected error occurred',
        };
    }
}
// OrganizationActionRequired - returns all WFH requests for organization (CEO/COO etc)
async function OrganizationActionRequired(data) {
    try {
        const response = await axiosInstance.post('/api/wfh-requests/get-all-wfh-requests', data);
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
                'An unexpected error occurred',
        };
    }
}

async function ProcessWFHRequest(data) {
    try {
        console.log(data);
        const response = await axiosInstance.post('/api/wfh-requests/process-request', data);
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
        console.log(error, error.message ,error.response?.data?.message  );
        return {
            success: false,
            data:
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred',
        };
    }
}

async function GetEmployeeWFHReq(data) {
    try {
        const response = await axiosInstance.post("/api/wfh-requests/get-employee-requests", data)
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
                'An unexpected error',
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
                'An unexpected error occurred',
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
                'An unexpected error occurred',
        };
    }
}

async function CancelWFH(data) {
    try {
        console.log(data)
        const response = await axiosInstance.post("/api/wfh-requests/cancel-wfh-request", data);
        if (response.status) {
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
                'An unexpected error occurred',
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
                'An unexpected error occurred',
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
                'An unexpected error occurred',
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
                'An unexpected error occurred',
        };
    }
}
const WFHApis = {
    addWFHRequest,
    ActionRequired,
    ProcessWFHRequest,
    GetEmployeeWFHReq,
    DeleteLeaveRequest,
    get_temporary_assignment_data,
    CancelWFH,
    ConsiderationTypes,
    getWorkingDays,
    getOdandCl,
    OrganizationActionRequired,
};

export default WFHApis;
