import axiosInstance from "@/config/axiosConfig";


async function getEmployees() {
    try {
        const response = await axiosInstance.get("/api/employee/get-employees-name-and-code")
        if (response.status) {
            return {
                success: true,
                data: response.data
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
async function getToDos() {
    try {
        const response = await axiosInstance.get("/api/todo/get-items")
        if (response.status) {
            return {
                success: true,
                data: response.data
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
async function CreateTodo(data) {
    try {
        const response = await axiosInstance.post("/api/todo/create-todo", data)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "To Do Created Successfully"
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
async function TaskStatistics(data) {
    try {
        const response = await axiosInstance.post("/api/todo/task-statistics", data)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "Task Statistics Fetched Successfully"
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
                'An unexpected error occurred while fetching task statistics',
        }
    }
}
async function updateTodo(data) {
    try {
        const response = await axiosInstance.put("/api/todo/update", data)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "To Do Created Successfully"
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
async function deleteToDoTask(data) {
    console.log(data)
    try {
        const response = await axiosInstance.delete("/api/todo/delete-task", {data})
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "To Do Created Successfully"
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
async function deleteToDo(data) {
    const todoId = data?.toDoId;
    try {
        const response = await axiosInstance.delete(`/api/todo/delete-todo/${todoId}`)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "To Do Created Successfully"
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
async function changeTodoStatus(data) {
    try {
        const response = await axiosInstance.put(`/api/todo/mark-as-completed`, data)
        if (response.status) {
            return {
                success: true,
                data: response.data,
                message : response.data?.message || "To Do Created Successfully"
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

export const ToDoApis = {
    getEmployees,
    CreateTodo,
    getToDos,
    deleteToDoTask,
    deleteToDo,
    changeTodoStatus,
    updateTodo,
    TaskStatistics,
}