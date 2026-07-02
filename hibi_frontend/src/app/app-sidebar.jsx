"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { UsersContext } from "@/app/context/UserContext";
import { CommonDataContext } from "./dashboard/context/CommonDataContext";

import {
  GoHome,
  GoTasklist,
} from "react-icons/go";
import {
  HiOutlineCalendar,
  HiOutlineKey,
  HiOutlineThumbUp,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineSun,
} from "react-icons/hi";
import { IoMdCalendar} from "react-icons/io";
import { IoBugOutline } from "react-icons/io5";
import { MdManageAccounts, MdOutlineAdminPanelSettings, MdOutlinePayment, MdWorkOutline} from "react-icons/md";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FaUmbrellaBeach } from "react-icons/fa";

import permissionsAPI from "@/Apis/Permissions_APIs";
import LeaveManagementApi from "@/Apis/LeaveManagement";
import odapi from "@/Apis/odapi";
import WFHApis from "@/Apis/WFHApis";
import { Thumb_Apis } from "@/Apis/Thumb_Apis";
import { getFirstOfMonth_ddmmyy, getEndOfMonth_ddmmyy } from "@/utils/DateFunctions";
import { calculatePendingAndEscalated } from "@/utils/UseFulFunctions";
import Comparing from "@/utils/CommonFunctionality";

export function AppSidebar(props) {
  const { user, role, setRole, previlege } = useContext(UsersContext);
  const { reqCounts, setReqCounts } = useContext(CommonDataContext);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    //function used to show number of action required requests (ESCALATED/PENDING only) and we are setting these in the reqCounts context to make them appear in the sidebar
    async function fetchCounts() {
      try {
        const [permissionsRes, wfhRes, leavesRes, odsRes, thumbsRes] = await Promise.all([
          permissionsAPI.getActionRequiredPermissions({ fromDate: getFirstOfMonth_ddmmyy(), toDate: getEndOfMonth_ddmmyy() }),
          WFHApis.ActionRequired({ fromDate: getFirstOfMonth_ddmmyy(), toDate: getEndOfMonth_ddmmyy() }),
          LeaveManagementApi.ActionRequired({ fromDate: getFirstOfMonth_ddmmyy(), toDate: getEndOfMonth_ddmmyy() }),
          odapi.GetActionRequests({ fromDate: getFirstOfMonth_ddmmyy(), toDate: getEndOfMonth_ddmmyy() }),
          Thumb_Apis.getActionRequiredThumbRequests({ fromDate: getFirstOfMonth_ddmmyy(), toDate: getEndOfMonth_ddmmyy() })
        ]);
        setReqCounts({
          permissions: calculatePendingAndEscalated(permissionsRes?.data || []) + calculatePendingAndEscalated(wfhRes?.data?.data || []),
          leaves: calculatePendingAndEscalated(leavesRes?.data || []),
          ods: calculatePendingAndEscalated(odsRes?.data || []),
          thumb: calculatePendingAndEscalated(thumbsRes?.data?.data || [])
        });
      } catch (e) {
        setReqCounts({ permissions: 0, leaves: 0, ods: 0, thumb: 0 });
      }
    }
    fetchCounts();
  }, [setReqCounts]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 700);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navMain = useMemo(() => {
    const items = [
      {
        title: "Home",
        url: "/dashboard/home",
        icon: GoHome,
        isActive: true,
        color: "#eab308",
      },
      {
        title: "Attendance",
        url: "/dashboard/attendance",
        icon: IoMdCalendar,
        isActive: true,
        color: "#6d28d9",
      },
      {
        title: reqCounts?.permissions > 0 ? `Permissions (${reqCounts.permissions})` : "Permissions",
        url: "/dashboard/permissions",
        icon: HiOutlineKey,
        isActive: true,
        color: "#059669",
      },
      {
        title: reqCounts?.leaves > 0 ? `Leave Management (${reqCounts.leaves})` : "Leave Management",
        url: "/dashboard/leaveManagement",
        icon: HiOutlineCalendar,
        isActive: true,
        color: "#f97316",
      },
      {
        title: "To-Do Management",
        url: "/dashboard/todo",
        icon: GoTasklist,
        isActive: true,
        color: "#f97316",
      },
      {
        title: reqCounts?.thumb > 0 ? `Thumb Management (${reqCounts.thumb})` : "Thumb Management",
        url: "/dashboard/thumbManagement",
        icon: HiOutlineThumbUp,
        isActive: true,
        color: "#dc2626",
      },
      {
        title: reqCounts?.ods > 0 ? `On Duty (${reqCounts.ods})` : "On Duty",
        url: "/dashboard/onDuty",
        icon: MdWorkOutline,
        isActive: true,
        color: "#dc2626",
      },
      {
        title: "Employee Management",
        url: "/dashboard/managerManagement",
        icon: MdManageAccounts,
        color: "#059669",
      },
      {
        title: "Bug Report",
        url: "/dashboard/BugReports",
        icon: IoBugOutline,
        color: "#059669",
      },
    ];
    if (previlege === "SUPERADMIN") {
      items.push({
        title: "HR Management",
        url: "/dashboard/hiring",
        icon: MdOutlineAdminPanelSettings,
        isActive: true,
        color: "#1e40af",
        items: [
          {
            title: "Holidays",
            url: "/dashboard/hiring/holidays",
            icon: HiOutlineSun,
            color: "#f59e42",
          },
          {
            title: "Hiring",
            url: "/dashboard/hiring",
            icon: HiOutlineBriefcase,
            color: "#6366f1",
          },
          {
            title: "Payroll",
            url: "/dashboard/hiring/payroll",
            icon: MdOutlinePayment,
            color: "#6366f1",
          },
        ],
      });
    }
    if (Comparing.compareStrings(role, "ACCOUNTANT")) {
      items.push({
        title: "Payroll",
        url: "/dashboard/hiring/payroll",
        icon: MdOutlinePayment,
        color: "#6366f1",
      });
    }
    items.push(
      {
        title: "Team Management",
        url: "/dashboard/teamManagement",
        icon: HiOutlineUserGroup,
        isActive: true,
        color: "#ca8a04",
      },
      {
        title: "PaySlips",
        url: "/dashboard/payslips",
        icon: FaIndianRupeeSign,
        isActive: true,
        color: "#ca8a04",
      },
      {
        title: "Trips",
        url: "/dashboard/trips",
        icon: FaUmbrellaBeach,
        isActive: true,
        color: "#ca8a04",
      }
    );
    if (
      Comparing.compareStrings(previlege, "SUPERADMIN") ||
      Comparing.compareStrings(role, "DESIGNER")
    ) {
      items.push({
        title: "🎨 Appearance Settings",
        url: "/dashboard/appearance",
        color: "#059669",
      });
    }
    return items;
  }, [reqCounts, previlege, role]);

  const roles = useMemo(() => {
    const currentRole = user?.roleId?.name;
    if (!currentRole) return [];
    if (
      ["EMPLOYEE", "INTERN", "ACCOUNTANT", "DESIGNER"].includes(currentRole)
    ) {
      return [currentRole];
    }
    return [currentRole, "EMPLOYEE"];
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher roles={roles} role={role} setRole={setRole} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} isMobile={isMobile} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}