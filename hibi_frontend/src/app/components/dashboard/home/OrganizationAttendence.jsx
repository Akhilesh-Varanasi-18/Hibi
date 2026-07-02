"use client";
import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Attendance_Apis } from "@/Apis/Attendance_Apis";
import { Button } from "@/components/ui/button";
import { Calendar, UserX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { UsersContext } from "@/app/context/UserContext";
import EmployeePanel from "../../ReusableComponents/EmployeePanel";
import BarChartComponent from "../../ReusableComponents/BarChartComponent";


export default function AttendanceChart() {
  const { colorPalettesFromBackend } = useContext(UsersContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const statusConfig = {
    present: {
      label: "Present",
      color: colorPalettesFromBackend?.graphPresent ? "" : "bg-emerald-500",
      barColor: colorPalettesFromBackend?.graphPresent || "#10b981",
      icon: require("lucide-react").UserCheck,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
    absent: {
      label: "Absent",
      color: colorPalettesFromBackend?.graphAbsent ? "" : "bg-rose-500",
      barColor: colorPalettesFromBackend?.graphAbsent || "#ef4444",
      icon: require("lucide-react").UserX,
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      textColor: "text-rose-700 dark:text-rose-300",
    },
    leave: {
      label: "On Leave",
      color: colorPalettesFromBackend?.graphLeave ? "" : "bg-amber-500",
      barColor: colorPalettesFromBackend?.graphLeave || "#f59e0b",
      icon: require("lucide-react").Plane,
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    permission: {
      label: "Permission",
      color: colorPalettesFromBackend?.graphPermission ? "" : "bg-blue-500",
      barColor: colorPalettesFromBackend?.graphPermission || "#3b82f6",
      icon: require("lucide-react").Clock,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    wfh: {
      label: "Work From Home",
      color: colorPalettesFromBackend?.graphWFH ? "" : "bg-purple-500",
      barColor: colorPalettesFromBackend?.graphWFH || "#8b5cf6",
      icon: require("lucide-react").Home,
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      textColor: "text-purple-700 dark:text-purple-300",
    },
  };

  const fetchData = async () => {
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(today.getDate()).padStart(2, "0")}`;
      const res = await Attendance_Apis.getAttendenceStatustics({
        fromDate: dateStr,
        toDate: dateStr,
      });

      if (res.success && res.data?.data?.[0]) setData(res?.data?.data[0]);
      else setError("No attendance data for today");
    } catch {
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) setHasAnimated(true);
  }, [data]);

  if (loading)
    return (
      <Card className="p-6 w-full">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-32 mt-2" />
        <div className="grid grid-cols-1 gap-4 mt-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 rounded-xl w-1/2" />
          ))}
        </div>
      </Card>
    );

  if (error)
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center">
          <UserX className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="font-semibold mb-2">Oops! Something went wrong</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData} className="rounded-lg">
          Try Again
        </Button>
      </Card>
    );

  const total = data.totalEmployees;

  return (
    <Card className="w-full p-6 shadow-lg border rounded-2xl bg-card">
      <CardHeader className="p-0 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Today's Attendance</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {
          !data.sunday && !data.holiday ?
            <div>
              <BarChartComponent
                data={data}
                total={total}
                onBarClick={setSelectedStatus}
                animateOnRender={!hasAnimated}
                statusConfig={statusConfig}
              />

              <AnimatePresence>
                {selectedStatus && (
                  <>
                    <motion.div
                      className="fixed inset-0 bg-black/30 z-40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedStatus(null)}
                    />
                    <EmployeePanel
                      type={selectedStatus}
                      count={data[selectedStatus]}
                      names={data[`${selectedStatus}Names`] || []}
                      onClose={() => setSelectedStatus(null)}
                      statusConfig={statusConfig}
                    />
                  </>
                )}
              </AnimatePresence>
            </div> :
            <h1 className="text-sm text-secondary-foreground/40 text-center">Today is holiday!</h1>
        }
      </CardContent>
    </Card>
  );
}
