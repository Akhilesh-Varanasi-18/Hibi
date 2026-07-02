import axiosInstance from "@/config/axiosConfig";

async function UpdateAssets(formdata) {
    try {
        const res = await axiosInstance.put("/api/organization/update-organization-assets", formdata);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data,
                message : res?.data?.message || "Assets Updated Successfully "
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
            error:
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while downloading template",
        };
    }
}

export const AssetsAPI = {
    UpdateAssets,
}