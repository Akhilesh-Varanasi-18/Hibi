import React, { useEffect, useState } from "react";
import { DynamicFormDialog } from "../../ReusableComponents/DynamicFormDialog";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import CustomLoader from "../../ReusableComponents/Loader";
import { Attendance_Apis } from "@/Apis/Attendance_Apis";
import { ToDoApis } from "@/Apis/ToDoApis";
import { showToast } from "@/lib/ToastService";
import { Plus } from "lucide-react";
import { FilterAttendanceStatusTypesForAddingAttendance } from "@/utils/FilterStatusTypes";

const AddAttendanceToEmployees = ({ refresh }) => {
    const [statusTypes, setStatusTypes] = useState(null);
    const [employees, setEmployees] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [attendanceTypesRes, employeesRes] = await Promise.all([
                    Attendance_Apis.getAttendanceStatusTypes(),
                    ToDoApis.getEmployees(),
                ]);

                setStatusTypes(FilterAttendanceStatusTypesForAddingAttendance(attendanceTypesRes?.data) || []);
                console.log(employeesRes?.data?.data)
                if (employeesRes.success) {
                    const convertedEmployees =
                        employeesRes?.data?.data?.map(item => ({
                            _id: item?.employeeCode,
                            name: item?.employeeName,
                        })) || [];
                    setEmployees(convertedEmployees);
                } else {
                    setEmployees([]);
                }
            } catch (error) {
                setStatusTypes([]);
                setEmployees([]);
            }
        };

        fetchData();
    }, []);

    const handleAddAttendance = async (data) => {
        const res = await Attendance_Apis.AddAttendance(data);
        if (res.success) {
            showToast(res?.message || res?.data?.message || "Attendance Added Successfully!", "success")
        } else {
            showToast(res?.error || "Failed to add attendance", "error")
        }
        console.log(res);
        console.log("Form data:", data);
    };

    const addAttendanceConfig = {
        Title: "Add Attendance",
        submitLabel: "Add Attendance",
        DialogLabel: <div className="flex gap-2 items-center"><Plus /> Add Attendance to Employees</div>,
        submitVariant: "default",
        onSubmit: handleAddAttendance,
        Fields: [
            {
                name: "employeesArray",
                type: "select",
                label: "Select Employees",
                multiselect: true,
                required: true,
                array: employees,
                showSearch: true,
                errorMessage: "Please select at least one employee",
            },
            {
                name: "date",
                type: "calendar",
                label: "Date",
                required: true,
                errorMessage: "Date is required",
                hideUpcoming : true,
            },
            {
                name: "logInTime",
                type: "time",
                label: "Log In Time",
                required: true,
                errorMessage: "Log In Time is required",
            },
            {
                name: "logOutTime",
                type: "time",
                label: "Log Out Time",
                required: true,
                errorMessage: "Log Out Time is required",
            },
            {
                name: "status",
                type: "select",
                label: "Status",
                required: true,
                array: statusTypes,
                showSearch: true,
                errorMessage: "Please select status",
            },
        ],
    };

    return (
        <div>
            {statusTypes ? (
                <DynamicFormDialog config={addAttendanceConfig} />
            ) : (
                <CustomLoader />
            )}
        </div>
    );
};

export default AddAttendanceToEmployees;