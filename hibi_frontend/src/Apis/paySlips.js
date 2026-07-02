import axiosInstance from "@/config/axiosConfig";

async function getTemplate() {
    try {
        const response = await axiosInstance.get("/api/pay-slips/get-payslip-template", {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating leave type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}

async function getPayslips(data) {
    try {
        const res=await axiosInstance.post("/api/pay-slips/get-payslips",data);
        if(res)
        {
            return{
                success:true,
                data:res.data
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while creating leave type',
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}

const payslipApi = {
    getTemplate,
    getPayslips
}

export default payslipApi;