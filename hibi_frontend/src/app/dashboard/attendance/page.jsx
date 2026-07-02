"use client";
import { useContext } from "react";
import AllEmployeesAttendence from "../../components/dashboard/attendance/AllEmployees";
import { UsersContext } from "@/app/context/UserContext";
import UserAttendance from "@/app/components/dashboard/attendance/UserAttendance";

export default function Page() {
  const { role, mainrole } = useContext(UsersContext);

  if (
    (role === "EMPLOYEE" && mainrole !== "COO" && mainrole !== "CEO") ||
    (role === "INTERN" && mainrole !== "COO" && mainrole !== "CEO")
  )
    return <UserAttendance />;
  else
    return (
      <div >
        <AllEmployeesAttendence />
      </div>
    );
}