import axiosInstance from "@/config/axiosConfig";

async function dowloadTemplate() {
    try {
        const response = await axiosInstance.get("/api/employee/download-template", {
            responseType: "arraybuffer", // 👈 important for Excel files
        });

        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data, // binary data
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
                "An unexpected error occurred while downloading template",
        };
    }
}

async function dowload_reference() {
    try {
        const response = await axiosInstance.get(
            "/api/employee/download-reference-data",
            {
                responseType: "arraybuffer", 
            }
        );

        if (response.status === 200 || response.status === 201) {
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
                "An unexpected error occurred while downloading reference data",
        };
    }
}


async function uploadEmployee(formData) {
    try {
        const response = await axiosInstance.post("/api/employee/bulk-upload-employee-data", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log(response);
        if (response.status == 200) {
            return {
                success: true,
                data: response.data
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
                'An unexpected error occurred while getting all previlages',
        }
    }
}
const bulkUploadApis = {
    dowloadTemplate,
    uploadEmployee,
    dowload_reference
}
export default bulkUploadApis;