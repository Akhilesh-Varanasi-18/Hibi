import axiosInstance from "@/config/axiosConfig";
import { success } from "zod";

async function fetchManagers() {
    try {
        const response = await axiosInstance.get("/api/employee/get-managers")
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.managers
            };
        }
        else {
            return {
                success: false,
                data: []
            };
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


async function fetchTeamLeads() {
    try {
        const response = await axiosInstance.get("/api/employee/get-team-leads")
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.teamLeads
            };
        }
        else {
            return {
                success: false,
                data: []
            };
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

async function fetchAllEmployees() {
    try {
        const response = await axiosInstance.get("api/employee/get-general-employees")
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.generalEmployees
            };
        }
        else {
            return {
                success: false,
                data: []
            };
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

async function AddTeam(teamdata) {
    try {
        console.log("Team data being sent:", teamdata);
        const response = await axiosInstance.post("/api/team/create-team", teamdata);
        console.log("Response from AddTeam:", response);
        if (response.status === 201) {
            return {
                success: true,
                data: response?.data?.message || 'Team added successfully'
            };
        }
        else {
            return {
                success: false,
                error: response?.data?.message || 'Failed to add team'
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while adding team',
        }
    }
}


async function fetchTeams() {
    try {
        const response = await axiosInstance.get("/api/team/get-all-details");
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.teams || response.data.team || []
            };
        }
        else {
            return {
                success: false,
                data: []
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching teams',
        }
    }
}


async function deleteTeam(teamId) {
    try {
        const response = await axiosInstance.delete(`api/team/delete-team/${teamId}`);
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response?.data?.message || 'Team deleted successfully'
            };
        }
        else {
            return {
                success: false,
                error: response?.data?.message || 'Failed to delete team'
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting team',
        }
    }
}


async function updateTeam(data) {
    try {
        const response = await axiosInstance.put("api/team/update-team", data);
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response?.data?.message || 'Team updated successfully'
            };
        }
        else {
            return {
                success: false,
                error: response?.data?.message || 'Failed to update team'
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while updating team',
        }
    }
}

async function deleteTeamMember(teamId, memberId) {
    try {
        const response = await axiosInstance.delete(`api/team/delete-employee-from-team?teamId=${teamId}&employeeId=${memberId}`);
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data?.message || 'Team member deleted successfully'
            };
        }
        else {
            return {
                success: false,
                error: response?.data?.message || 'Failed to delete team member'
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while deleting team member',
        }
    }
}

async function GetNonTeamMembers() {
    try {
        const response = await axiosInstance.get("/api/team/get-non-team-employees");
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data.data
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
                'An unexpected error occurred while fetching non-team members',
        }
    }
}

async function UnassignedTeam() {
    try {
        const response = await axiosInstance.get("/api/team/get-unassigned-team-leads");
        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                data: response.data.data
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
                'An unexpected error occurred while fetching unassigned team members',
        }
    }
}


async function unassignedTeamMembers() {
    try {
        const response = await axiosInstance.get("/api/team/get-non-team-employees");
        console.log(response)
        if (response.status === 200 || response.status === 201) {
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
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching unassigned team members',
        }
    }
}

async function Assignrole(data) {
    try {
        const response = await axiosInstance.put("/api/team/change-role-in-team", data);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
            return {
                success: true,
                data: response.data.message || "Success Fully changes"
            }
        }
        else {
            return {
                success: false,
                error: "Failed to Change role"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching unassigned team members',
        }
    }
}

async function getTeamswithName() {
    try {
        const res = await axiosInstance.get("/api/team/get-team-id-and-name");
        if (res.status == 201 || res.status == 200) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "Some thing Went Wrong"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching unassigned team members',
        }
    }
}


async function changeTeam(data) {
    try {
        const res = await axiosInstance.put("/api/team/change-team", data);
        if (res.status == 200 || res.status == 201) {
            return {
                success: true,
                data: res.data
            }
        }
        else {
            return {
                success: false,
                error: "unable to change Team"
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.res?.data?.message ||
                error.message ||
                'An unexpected error occurred while fetching unassigned team members',
        }
    }
}
const TeamManagementApi = {
    fetchManagers,
    fetchTeamLeads,
    fetchAllEmployees,
    AddTeam,
    fetchTeams,
    deleteTeam,
    updateTeam,
    deleteTeamMember,
    GetNonTeamMembers,
    UnassignedTeam,
    unassignedTeamMembers,
    Assignrole,
    getTeamswithName,
    changeTeam
};

export default TeamManagementApi;