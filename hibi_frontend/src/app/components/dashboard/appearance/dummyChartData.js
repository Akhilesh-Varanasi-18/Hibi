import { Clock, Home, Plane, UserCheck, UserX } from "lucide-react";

// 🧠 Dummy data simulating attendance-like structure
export const dummyData = {
  present: 40,
  absent: 10,
  leave: 5,
  permission: 8,
  wfh: 12,
  totalEmployees: 75,
};

// 🎨 Default Status configuration (colors/icons etc.)
export const statusConfig = [
  {
    key: "present",
    label: "Present",
    colorKey: "graphPresent",
    defaultColor: "#10b981",
    icon: UserCheck,
  },
  {
    key: "absent",
    label: "Absent",
    colorKey: "graphAbsent",
    defaultColor: "#ef4444",
    icon: UserX,
  },
  {
    key: "leave",
    label: "On Leave",
    colorKey: "graphLeave",
    defaultColor: "#f59e0b",
    icon: Plane,
  },
  {
    key: "permission",
    label: "Permission",
    colorKey: "graphPermission",
    defaultColor: "#3b82f6",
    icon: Clock,
  },
  {
    key: "wfh",
    label: "Work From Home",
    colorKey: "graphWFH",
    defaultColor: "#8b5cf6",
    icon: Home,
  },
];

export const total = dummyData.totalEmployees;
