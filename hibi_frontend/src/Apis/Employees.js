import axiosInstance from "@/config/axiosConfig";


async function GetEmployees() {
    try {

        const response = await axiosInstance.get("/api/employee/get-all-employees-for-updation");
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response?.data?.data || []
            }
        }
        else {
            return {
                success: true,
                error: "unable to Fetch Employees",
            }
        }
    }
    catch (error) {
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


async function GetCreatedEmployees() {
    try {

        const response = await axiosInstance.get("/api/employee/get-created-employees");
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response?.data?.data || []
            }
        }
        else {
            return {
                success: true,
                error: "unable to Fetch Employees",
            }
        }
    }
    catch (error) {
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


async function allEmployessUnder() {
    try {
        const res = await axiosInstance.get("/api/employee/get-employees-by-level");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res?.data?.data || []
            }
        }
        else {
            return {
                success: false,
                error: "unable to fetch employees"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching employees',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}


async function getOrgEmployee() {
    try {
        const res = await axiosInstance.get("/api/employee/get-entire-org-employees");
        console.log(res)
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res?.data || []
            }
        }
        else {
            return {
                success: false,
                error: "unable to fetch employees"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching employees',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}

const employeeApi = {
    GetEmployees,
    GetCreatedEmployees,
    allEmployessUnder,
    getOrgEmployee
}
export default employeeApi;