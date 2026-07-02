import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function Birthdays() {
    try {
        const res=await axiosInstance.get("/api/employee/get-employee-dob");
        if(res.status==200 || res.status==201)
        {
            return{
                success:true,
                data:res?.data?.data
            }
        }
        else{
            return{
                success:false,
                error:"Failed to Fetch employee Birthdays"
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


const homePageApi = {
    Birthdays
}


export default homePageApi