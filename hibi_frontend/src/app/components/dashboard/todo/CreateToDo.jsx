"use client"
import React, { useEffect, useState } from "react";
import { DynamicFormDialog } from "../../ReusableComponents/DynamicFormDialog";
import { ToDoApis } from "@/Apis/ToDoApis";
import CustomLoader from "../../ReusableComponents/Loader";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

const CreateToDo = ({ priorityOptions, employees, refresh }) => {
  const { toast } = useToast();

  // Config describing the fields for the Create ToDo form
  const createToDoConfig = {
    Title: "Create To-Do",
    submitLabel: "Create To-Do",
    DialogLabel: "Create To Do",
    submitVariant: "default",
    onSubmit: async (data) => {
      try {
        const res = await ToDoApis.CreateTodo(data);
        if (res.success) {
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-green-500 rounded-full text-lg">
                  <TiTick />
                </div>
                <span>{res.message || "To-Do Created successfully!"}</span>
              </div>
            ),
          });
          refresh && refresh();
        } else {
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-red-500 rounded-full text-lg">
                  <RxCross2 />
                </div>
                <span>{res.error || "Failed to create To-Do"}</span>
              </div>
            ),
          });
        }
        // Optionally: console.log the response for debugging
        console.log(res);
        console.log("Form data:", data);
      } catch (error) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{"Failed to create To-Do"}</span>
            </div>
          ),
        });
      }
    },
    Fields: [
      {
        name: "moduleName",
        type: "text",
        label: "Module Name",
        required: true,
        errorMessage: "Module Name is required",
      },
      {
        name: "taskNames",
        type: "multitext",
        label: "Tasks ",
        placeholder : "Type and Enter to add a task",
        required: true,
        errorMessage: "At least one task is required",
      },
      {
        name: "employeeIds",
        type: "select",
        label: "Assign Employees",
        multiselect: true,
        required: true,
        array: employees,
        showSearch: true,
        errorMessage: "Please select at least one employee",
      },
      {
        name: "FromTo",
        type: "multicalendar",
        label: "Start and End Date",
        DateStartName: "startDate",
        showUpcoming: true,
        DateEndName: "endDate",
        required: true,
        errorMessage: "Please select both start and end dates",
      },
      {
        name: "priority",
        type: "select",
        label: "Priority",
        required: true,
        array: priorityOptions,
        placeholder: "Select priority",
        errorMessage: "Please select priority",
      },
    ],
  };

  return (
    <div>
      {employees ? <DynamicFormDialog config={createToDoConfig} /> : <CustomLoader />}
    </div>
  );
};

export default CreateToDo;