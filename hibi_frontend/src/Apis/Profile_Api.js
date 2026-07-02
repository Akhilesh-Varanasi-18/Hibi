import axiosInstance from "@/config/axiosConfig";
import { ca } from "date-fns/locale";

async function GettingEmployeeData(id) {
    try {
        let url = "/api/employee/get-employee-data"
        if (id) {
            url = `/api/employee/get-employee-data?employeeId=${id}`
        }
        const response = await axiosInstance.get(url)
        if (response.status == 200) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                data: response.message
            }
        }
    }
    catch (error) {
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

async function AddPersonalDetails(data) {
    try {
        const response = await axiosInstance.post("/api/employee-personal-details/add-details", data);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: "Personal Details Added Successfully"
            }
        }
        else {
            return {
                success: false,
                error: "Something Went Wrong Personal Details Not Added"
            }
        }
    }
    catch (error) {
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

async function AddBankDetails(data) {
    try {
        const response = await axiosInstance.post("/api/employee-bank-details/create", data);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "unable to add Bank details"
            }
        }
    }
    catch (error) {
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

async function AddEmergencyContacts(data) {
    try {
        const res = await axiosInstance.post("/api/employee-contacts/add-contact", data);
        if (res.status == 201 || res.status == 200) {
            return {
                success: true,
                data: "Contact Added Successfully"
            }
        }
        else {
            return {
                success: false,
                error: "Something Went Wrong Contact Not Added"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}

async function GetPersonalDetails(id) {
    try {
        let url = "/api/employee-personal-details/get-details"
        if (id) {
            url = `/api/employee-personal-details/get-details?employeeId=${id}`
        }
        const res = await axiosInstance.get(url);
        // console.log(res);
        if (res.status == 201 || res.status == 200) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                data: res.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}

async function GetContacts(id) {
    try {
        let url = "/api/employee-contacts/get-contacts"
        if (id) {
            url = `/api/employee-contacts/get-contacts?employeeId=${id}`
        }
        const response = await axiosInstance.get(url);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data.contacts[0]

            }
        }
        else {
            return {
                success: false,
                data: response.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}

async function UpdateContacts(data) {
    try {
        const response = await axiosInstance.put("/api/employee-contacts/update-contact", data);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: "Contact Updated Successfully"

            }
        }
        else {
            return {
                success: false,
                error: "contact Not Updated , something went wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function UpdatePersonalDetails(data) {
    try {
        const response = await axiosInstance.put("/api/employee-personal-details/update-details", data);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: "Personal Details Updated Successfully"

            }
        }
        else {
            return {
                success: false,
                error: "Failed to update personal details"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}
async function updateEmployeeData(data) {
    try {
        const response = await axiosInstance.patch("/api/employee/update-employee", data);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: "Employee Data Updated Successfully"

            }
        }
        else {
            return {
                success: false,
                error: "Failed to update Employee Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}


async function getbankDetails(id) {
    try {
        let url = "/api/employee-bank-details/get"
        if (id) {
            url = `/api/employee-bank-details/get?employeeId=${id}`
        }
        const response = await axiosInstance.get(url);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to update Employee Data"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating privilege',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        }
    }
}

async function updateBankDetails(data) {
    try {
        const response = await axiosInstance.put("/api/employee-bank-details/update", data);
        console.log(response);
        if (response.status == 201 || response.status == 200) {
            return {
                success: true,
                data: response.data
            }
        }
        else {
            return {
                success: false,
                error: "unable to add Bank details"
            }
        }
    }
    catch (error) {
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
const ProfileAPi = {
    GettingEmployeeData,
    AddPersonalDetails,
    AddBankDetails,
    AddEmergencyContacts,
    GetPersonalDetails,
    GetContacts,
    UpdateContacts,
    UpdatePersonalDetails,
    updateEmployeeData,
    getbankDetails,
    updateBankDetails
}

export default ProfileAPi;