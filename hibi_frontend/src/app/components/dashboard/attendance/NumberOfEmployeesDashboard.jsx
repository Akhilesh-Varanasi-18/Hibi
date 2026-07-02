"use client"
import React, { useState, useEffect, useMemo, useContext } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Attendance_Apis } from "@/Apis/Attendance_Apis"
import { getDDMMYYDate, getFirstOfMonth_ddmmyy, getToday_ddmmyy } from "@/utils/DateFunctions"
import MultipleDateSelector from "../../ReusableComponents/MultipleDateSelector"
import { UsersContext } from "@/app/context/UserContext"

const chartConfig = {
  count: {
    label: "Present",
  },
};

const NumberOfEmployeesDashboard = () => {
  const {colorPalettesFromBackend} = useContext(UsersContext)
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: getFirstOfMonth_ddmmyy(),
    to: getToday_ddmmyy(),
  });
  const [averageAttendance, setAverageAttendance] = useState(0);

  // Fetching attendance numbers from API
  const fetchNumberData = async () => {
    setLoading(true);
    try {
      const res = await Attendance_Apis.getAttendanceInNumber({
        fromDate: getDDMMYYDate(dateRange.from),
        toDate: getDDMMYYDate(dateRange.to),
      });

      // console.log(res)

      if (res && res.success && Array.isArray(res.data)) {
        // Transform and calculate average attendance (excluding holidays)
        let presentSum = 0;
        let presentDays = 0;
        const transformed = res.data.map((item, i) => {
          const isHoliday = item?.isHoliday === true || (!!item?.HolidayName && item?.HolidayName !== "");
          // Only add to presentSum if NOT holiday
          if (!isHoliday) {
            presentSum += item.Count || 0;
            presentDays += 1;
          }
          return {
            date: item._id,
            count: item.Count,
            isHoliday: item?.isHoliday,
            HolidayName: item?.HolidayName,
          };
        });
        setChartData(transformed);
        // Avoid division by zero; show 0 if no non-holiday days
        const avg = presentDays > 0 ? (presentSum / presentDays) : 0;
        setAverageAttendance(avg);
      } else {
        setChartData([]);
        setAverageAttendance(0);
      }
    } catch (err) {
      setChartData([]);
      setAverageAttendance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumberData();
    // eslint-disable-next-line
  }, [dateRange]);

  // Helper to get day short name
  const getDayShort = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  return (
    <Card className="py-0 mb-8">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex w-full items-center justify-between gap-1 px-6 py-6">
          <div className="flex flex-col gap-2">
            <CardTitle>Number of Employees Present</CardTitle>
            <CardDescription>
              Average attendees: <span className="font-semibold">{!loading ? Math.round(averageAttendance) : "--"}</span>
            </CardDescription>
          </div>
          <MultipleDateSelector dateRange={dateRange} setDateRange={setDateRange} />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => {
                // Show as "Sun Aug 1", "Tue Sep 2", etc.
                const date = new Date(value);
                if (isNaN(date)) {
                  // fallback for YYYY-MM-DD string
                  const [y, m, d] = value.split("-");
                  const jsDate = new Date(`${y}-${m}-${d}`);
                  if (!isNaN(jsDate)) {
                    return `${getDayShort(jsDate)} ${jsDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`;
                  }
                  // fallback if still invalid
                  return value;
                }
                return ` ${date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`;
              }}
            />
            <YAxis
              dataKey="count"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const date = new Date(item.date);
                  let labelStr;
                  if (isNaN(date)) {
                    const [y, m, d] = (item.date || "").split("-");
                    const jsDate = new Date(`${y}-${m}-${d}`);
                    if (!isNaN(jsDate)) {
                      labelStr = `${getDayShort(jsDate)}, ${jsDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`;
                    } else {
                      labelStr = item.date;
                    }
                  } else {
                    labelStr = `${getDayShort(date)}, ${date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`;
                  }
                  return (
                    <div className="p-3 bg-background rounded-md shadow w-[200px]">
                      <div className="font-semibold">{labelStr}</div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span>Present:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      {item.isHoliday && (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">Holiday:</span> {item.HolidayName || "Holiday"}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colorPalettesFromBackend?.graphBg} stopOpacity={0} />
                <stop offset="30%" stopColor={colorPalettesFromBackend?.graphBg} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colorPalettesFromBackend?.graphBg} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="grayGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#888888" stopOpacity={0} />
                <stop offset="30%" stopColor="#bdbdbd" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#888888" stopOpacity={1} />
              </linearGradient>
            </defs>
            {/* Render a single Bar component, choose fill based on isHoliday/HolidayName */}
            <Bar
              dataKey="count"
              radius={8}
              isAnimationActive={false}
              // fill is dynamically handled in shape below
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                // You can define which property marks a holiday
                const isGray =
                  (payload.isHoliday === true) ||
                  (!!payload.HolidayName && payload.HolidayName !== "");
                if (height <= 0 || width <= 0) return null; // don't render invisible bars
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={
                      isGray
                        ? "url(#grayGradient)"
                        : "url(#barGradient)"
                    }
                    rx={8}
                  />
                );
              }}
            />
          </BarChart>
        </ChartContainer>
        {loading && (
          <div className="text-center text-xs text-muted-foreground mt-2">
            Loading attendance data...
          </div>
        )}
        {!loading && chartData.length === 0 && (
          <div className="text-center text-xs text-muted-foreground mt-2">
            No attendance data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NumberOfEmployeesDashboard;

export const description = "An interactive bar chart showing number of employees present per day with average attendance shown (excluding holidays).";
