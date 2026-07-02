"use client"

import React from "react";
import odapi from "@/Apis/odapi";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { DynamicFormDialog } from "@/app/components/ReusableComponents/DynamicFormDialog";
import { calculateTotalDays } from "@/utils/DateFunctions";

const AddOd = ({ refresh }) => {
  const { toast } = useToast();


  // Dynamic form config
  const odFormConfig = {
    Title: "Create New OD Request",
    DialogVariant: "default",
    submitLabel: "Submit",
    DialogLabel: "Create New OD Request",
    submitVariant: "default",
    Fields: [
      {
        name: "FromTo",
        type: "multicalendar",
        label: "OD Dates",
        DateStartName: "startDate",
        takeFullWidth : true,
        DateEndName: "endDate",
        showUpcoming: true,
        required: true,
        errorMessage: "Please select both dates",
      },
      {
        name: "reason",
        type: "textarea",
        label: "Reason",
        placeholder: "Enter the reason for your OD request",
        required: true,
        takeFullWidth: true,
        errorMessage: "Reason is required",
      }
    ],
    onSubmit: async (formData) => {
      try {
        const payload = {
          fromDate: formData.startDate,
          toDate: formData.endDate,
          totalDays: calculateTotalDays(formData.startDate, formData.endDate),
          reason: formData.reason,
        };
        const res = await odapi.add_request(payload);

        if (res.success) {
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-green-500 rounded-full text-lg"><TiTick /></div>
                <span>{res?.data || "OD Request created successfully!"}</span>
              </div>
            ),
          });
          refresh && refresh();
        } else {
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-red-500 rounded-full text-lg"><RxCross2 /></div>
                <span>{res?.error || "Failed to create OD request"}</span>
              </div>
            ),
          });
        }
      } catch (error) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg"><RxCross2 /></div>
              <span>{"Failed to create OD request"}</span>
            </div>
          ),
        });
      }
    },
  };

  return (
    <div>
      <DynamicFormDialog config={odFormConfig} />
    </div>
  );
};

export default AddOd;