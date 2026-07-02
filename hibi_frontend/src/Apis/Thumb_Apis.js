import { success } from "zod";

const { default: axiosInstance } = require("@/config/axiosConfig");

async function addThumbRequest(data) {
    try {
        // Make the API call to create a privilege
        console.log(data)
        const response = await axiosInstance.post("/api/thumb-request/add-thumb-request", data);
        console.log(response)
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
                error: response.data.error,
                details: response.data.details || {}
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }

}

async function getThumbRequest(data) {
    try {
        console.log(data);  
        const response=await axiosInstance.post("/api/thumb-request/get-thumb-requests",data);
        if(response.status==200 || response.status==201)
        {
            return{
                success:true,
                data:response.data,
                message:response.data.message || "ThumbRequest fetched successfully"
            }
        }
        else{
            return{
                success:false,
                error:"Failed to get ThumbRequest"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function processThumbRequest(data) {
    try {
        console.log(data);  
        const response=await axiosInstance.post("/api/thumb-request/process-thumb-request",data);
        if(response.status==200 || response.status==201)
        {
            return{
                success:true,
                data:response.data,
                message:response.data.message || "ThumbRequest processed successfully"
            }
        }
        else{
            return{
                success:false,
                error:"Failed to get ThumbRequest"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getActionRequiredThumbRequests(data) {
    try {
        console.log(data);  
        const response=await axiosInstance.post("/api/thumb-request/get-action-required-thumbs",data);
        console.log(response);
        if(response.status==200 || response.status==201)
        {
            return{
                success:true,
                data:response.data,
                message:response.data.message || "ThumbRequest fetched successfully"
            }
        }
        else{
            return{
                success:false,
                error:"Failed to get ThumbRequest"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}
async function getOrganizationActionRequiredThumbRequests(data) {
    try {
        console.log(data);  
        const response=await axiosInstance.post("/api/thumb-request/get-all-thumb-requests",data);
        console.log(response);
        if(response.status==200 || response.status==201)
        {
            return{
                success:true,
                data:response.data?.data || [],
                message:response.data.message || "ThumbRequest fetched successfully"
            }
        }
        else{
            return{
                success:false,
                error:"Failed to get ThumbRequest"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message,
            status: error.response?.status,
            details: error.response?.data?.details || {}
        };
    }
}



export const Thumb_Apis = {
    addThumbRequest,
    getThumbRequest,
    getActionRequiredThumbRequests,
    processThumbRequest,
    getOrganizationActionRequiredThumbRequests,
}
