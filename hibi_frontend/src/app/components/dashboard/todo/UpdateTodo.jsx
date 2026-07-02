"use client"
import React from 'react'
import { EditTodoDialog } from './EditTodoDialogComponent'
import { ToDoApis } from '@/Apis/ToDoApis'
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"

const UpdateTodo = ({ item, employees, priorityOptions, refresh }) => {
    const { toast } = useToast();

    // Handles updating the todo item and refreshes the list after successful update
    const handleUpdate = async (payload) => {
        try {
            const res = await ToDoApis.updateTodo(payload);
            if (res?.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg"><TiTick /></div>
                            <span>{res?.message || "Todo updated successfully!"}</span>
                        </div>
                    ),
                });
                if (refresh) refresh();
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg"><RxCross2 /></div>
                            <span>{res?.error || "Failed to update todo"}</span>
                        </div>
                    ),
                });
            }
        } catch (error) {
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-red-500 rounded-full text-lg"><RxCross2 /></div>
                        <span>{"Failed to update todo"}</span>
                    </div>
                ),
            });
        }
    }

    return (
        <EditTodoDialog
            item={item} // Passes current todo data for editing
            onUpdate={handleUpdate} // Sends update handler to dialog
            employees={employees} // List of all employees for assignment
            priorityOptions={priorityOptions} // Options for setting priority
        />
    )
}

export default UpdateTodo