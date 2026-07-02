"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Approved, Pending } from "@/components/ui/Approval";
import { Trash2 } from "lucide-react";
import { ToDoApis } from "@/Apis/ToDoApis";
import { useToast } from "@/hooks/use-toast";
import MarkAsComplete from "./MarkAsComplete";
import { CustomActionDialog } from "../../ReusableComponents/CustomActionDialog";
import DeleteButton from "../../ReusableComponents/DeleteButton";

// Main todo card component to display a module along with its tasks
const ToDoCard = ({ todo, refresh, onEdit }) => {
  const { toast } = useToast();

  // state for controlling delete dialogs and track which task to delete
  const [openDeleteTodo, setOpenDeleteTodo] = useState(false);
  const [openDeleteTask, setOpenDeleteTask] = useState(false);
  const [deleteExtra, setDeleteExtra] = useState(null);

  // Class names for showing color based on todo priority
  const priorityClassMap = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700",
  };
  const priorityClass = priorityClassMap[(todo.priority || "").toUpperCase()] || "";

  // Config for delete todo dialog
  const deleteTodoConfig = {
    Title: "Delete To Do",
    Desc: "This Action Cannot be Undone",
    submitLabel: (
      <div className="flex items-center">
        <Trash2 className="mr-2" /> Delete
      </div>
    ),
    DialogVariant: "destructive",
    submitVariant: "destructive",
    DialogLabel: <Trash2 className="inline" />,
    hideCancel: true,
    onSubmit: async () => {
      // API call to delete a module along with its tasks
      const res = await ToDoApis.deleteToDo({ toDoId: todo._id });
      if (res.success) {
        toast({ title: res.data?.message || "To-do deleted" });
        refresh();
      } else {
        toast({ title: res.error || "Failed to delete" });
      }
      setOpenDeleteTodo(false);
    },
    Fields: [],
  };

  // Config for delete individual task dialog
  const deleteTaskConfig = {
    Title: "Delete this Task",
    Desc: "This Action Cannot be Undone",
    submitLabel: (
      <div className="flex items-center">
        <Trash2 className="mr-2" /> Delete
      </div>
    ),
    DialogVariant: "destructive",
    submitVariant: "destructive",
    DialogLabel: <Trash2 className="inline" />,
    hideCancel: true,
    onSubmit: async () => {
      // API call to delete a task inside a module
      const res = await ToDoApis.deleteToDoTask(deleteExtra);
      if (res.success) {
        toast({ title: res.data?.message || "Task deleted" });
        refresh();
      } else {
        toast({ title: res.error || "Failed to delete task" });
      }
      setOpenDeleteTask(false);
    },
    Fields: [],
  };

  return (
    <Card className="w-full shadow-md">
      {/* Card header shows module name and priority */}
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle className="text-lg">
            {todo.moduleName || "Untitled Module"}
          </CardTitle>
          {todo.priority && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${priorityClass} mt-1 inline-block`}
            >
              {todo.priority.charAt(0) + todo.priority.slice(1).toLowerCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Click to open module editing */}
          <button
            onClick={onEdit}
            className="px-3 py-1 rounded border border-transparent hover:bg-slate-700/5 text-sm"
          >
            Edit
          </button>
          {/* Open dialog to delete entire module */}
          <div onClick={() => setOpenDeleteTodo(true)}>
            <DeleteButton />
          </div>
        </div>
      </CardHeader>

      {/* Task list content area */}
      <CardContent className="flex flex-col gap-2">
        {Array.isArray(todo.todoList) && todo.todoList.length > 0 ? (
          todo.todoList.map((task) => (
            // Show each task in the module
            <div
              key={task._id}
              className="bg-accent/10 p-2 rounded flex justify-between items-start"
            >
              <div>
                <div className="font-medium">{task.taskName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {/* Task creator information */}
                  Created by: {task.taskCreatedByInfo?.firstName || "—"}{" "}
                  {task.taskCreatedByInfo?.employeeCode
                    ? `(${task.taskCreatedByInfo.employeeCode})`
                    : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {/* Task created timestamp */}
                  Created at: {new Date(task.createdAt).toLocaleString()}
                </div>
                {task.isCompleted && (
                  <div className="text-xs text-muted-foreground">
                    {/* Task completed info */}
                    Completed by:{" "}
                    {task.taskCompletedByInfo?.firstName || "-"} (
                    {new Date(task.completedAt).toLocaleString()})
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Task status indicator */}
                {task.isCompleted ? (
                  <Approved label="Completed" />
                ) : (
                  <Pending label="Pending" />
                )}
                <div className="flex gap-2">
                  {/* Open dialog to confirm deleting the task */}
                  <button
                    onClick={() => {
                      setDeleteExtra({ toDoId: todo._id, taskId: task._id });
                      setOpenDeleteTask(true);
                    }}
                  >
                    <DeleteButton />
                  </button>
                  {/* Mark this task as complete */}
                  <MarkAsComplete task={task} todoId={todo._id} refresh={refresh} />
                </div>
              </div>
            </div>
          ))
        ) : (
          // Message if no tasks in the module
          <div className="text-xs text-muted-foreground">
            No tasks in this module.
          </div>
        )}
      </CardContent>

      {/* Confirmation dialogs for deleting module or a task */}
      {openDeleteTodo && (
        <CustomActionDialog
          config={deleteTodoConfig}
          open={openDeleteTodo}
          setOpen={setOpenDeleteTodo}
        />
      )}
      {openDeleteTask && (
        <CustomActionDialog
          config={deleteTaskConfig}
          open={openDeleteTask}
          setOpen={setOpenDeleteTask}
        />
      )}
    </Card>
  );
};

export default ToDoCard;
