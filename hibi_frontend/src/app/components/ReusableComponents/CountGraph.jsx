"use client"

import { TrendingUp } from "lucide-react"
import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { colors } from "@/utils/CustomColorPalettes"
import { useEffect, useState } from "react"
import { Attendance_Apis } from "@/Apis/Attendance_Apis"

export const description = "A radial chart displaying today's employee attendance"

export function EmployeeCountGraph() {
    const [count, setCount] = useState(0);
    const [max, setMax] = useState(0);

    useEffect(() => {
        fetchEmployeePresentCount();
    }, []);

    const fetchEmployeePresentCount = async () => {
        const res = await Attendance_Apis.getAttendanceInNumber({
            fromDate: new Date(),
            toDate: new Date(),
        });
        console.log(res)
        if (res.success) {
            // Find today's date in YYYY-MM-DD format
            const today = new Date();
            const pad = (n) => n.toString().padStart(2, "0");
            const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            const todayObj = res?.data?.find(item => item._id === todayStr);
            setCount(todayObj ? todayObj.Count : 0);
            // Use max (if available), else fallback to today's count, else 1 (to avoid divide by zero)
            setMax(todayObj && typeof todayObj.max === "number"
                ? todayObj.max
                : (todayObj ? todayObj.Count : 1)
            );
        }
    };

    // Build chart data based on API and state
    const radialPercentage = max ? Math.round((count / data?.totalEmployees) * 100) : 0;
    const chartData = [
        {
            name: "Employees Present Today",
            count: count,
            fill: colors.dark.main,
        },
    ];

    const chartConfig = {
        count: {
            label: "Employees Present Today",
        },
    };

    return (
        <Card className="flex flex-col" style={{ height: 320 }}>
            <CardHeader className="items-center pb-0">
                <CardTitle>Employee Attendance (Today)</CardTitle>
                <CardDescription>
                    {new Date().toLocaleDateString()} &mdash; 
                    <span className="ml-1 text-muted-foreground">
                        {data?.totalEmployees > 0
                            ? `${radialPercentage}% of Maximum Attendance (${data?.totalEmployees})`
                            : "No attendance data"}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[200px]"
                >
                    <RadialBarChart
                        data={[
                            {
                                value: count,
                                fill: colors.dark.main,
                                full: max,
                            },
                        ]}
                        startAngle={90}
                        endAngle={450}
                        innerRadius={80}
                        outerRadius={110}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[86, 74]}
                        />
                        {/* The max prop is used to display the total. The bar will show value as proportion of max */}
                        <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            cornerRadius={10}
                            maxBarSize={20}
                            barSize={16}
                        />
                        <PolarRadiusAxis
                            type="number"
                            domain={[0, max > 0 ? max : 1]}
                            angle={90}
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-4xl font-bold"
                                                >
                                                    {count}
                                                </tspan>
                                                {/* <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-base"
                                                >
                                                    Total Employees Present
                                                </tspan> */}
                                            </text>
                                        )
                                    }
                                    return null;
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
            </CardFooter>
        </Card>
    );
}
