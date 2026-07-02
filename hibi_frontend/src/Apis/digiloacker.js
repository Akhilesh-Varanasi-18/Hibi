import axiosInstance from "@/config/axiosConfig";

async function getDigiLink() {
    try {
        const response = await axiosInstance.get('/api/digilocker/generate-auth-url');
        if (response.status === 200 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'DigiLink fetched successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to fetch DigiLink',
                details: response.data?.details || {}
            };
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

async function Verify(code) {
    try {
        const response = await axiosInstance.get(`/api/digilocker/get-access-token?code=${code}`);
        if (response.status === 200 && response.data) {
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'DigiLink fetched successfully'
            };
        } else {
            return {
                success: false,
                error: response.data?.error || 'Failed to fetch DigiLink',
                details: response.data?.details || {}
            };
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

async function getDocuments(id) {
    try {
        let url = "/api/digilocker/fetch-documents"
        if (id) {
            url = `/api/digilocker/fetch-documents?employeeId=${id}`
        }
        const res = await axiosInstance.get(url);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to get data"
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


async function getRefreshDoc() {
    try {
        const res = await axiosInstance.get("/api/digilocker/refetch-documents");
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "Failed to get data"
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
const digiloackerApi = {
    getDigiLink,
    Verify,
    getDocuments,
    getRefreshDoc
};

export default digiloackerApi;