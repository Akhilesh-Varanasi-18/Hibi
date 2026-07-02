"use client";
import { Attendance_Apis } from '@/Apis/Attendance_Apis';
import TeamManagementApi from '@/Apis/TeamManagementApi';
import { UsersContext } from '@/app/context/UserContext';
import Comparing from '@/utils/CommonFunctionality';
import React, { useContext, useEffect, useState } from 'react';
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AttendanceDialog from './AttendenceDialog';
import StatisticsCard from './statusticsCards';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CustomCard from '../../ReusableComponents/CustomCard';
import { formatDate, getToday_ddmmyy } from '@/utils/DateFunctions';

const AttendanceStatistics = () => {
    const { role, previlege } = useContext(UsersContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (Comparing.compareStrings(previlege, "admin")) {
            AttendanceStatistics();
        } else {
            SuperAdminAttendance();
        }
    }, [role]);

    async function getTeams() {
        const res = await TeamManagementApi.getTeamswithName();
        if (res.success) {
            return res.data.teams;
        } else {
            return [];
        }
    }

    async function SuperAdminAttendance() {
        setLoading(true);
        try {
            let teamwiseData = [];
            const teams = await getTeams();
            // console.log(teams);
            // const teamsData=teams.filter((e)=>e.teamName!="TEAM PP")
            // console.log(teamsData)
            for (let i = 0; i < teams.length; i++) {
                const res = await Attendance_Apis.getAttendenceStatustics({
                    "fromDate": getToday_ddmmyy(),
                    "toDate": getToday_ddmmyy(),
                    "team": teams[i]._id
                });
                if (res.data?.data) {
                    const dataWithTeam = res.data.data.map(item => ({
                        ...item,
                        teamName: teams[i].teamName || `Team ${i + 1}`
                    }));
                    teamwiseData = [...teamwiseData, ...dataWithTeam];
                }
            }
            if (teamwiseData.length === 0) {
                const res = await Attendance_Apis.getAttendenceStatustics({
                    fromDate: getToday_ddmmyy(),
                    toDate: getToday_ddmmyy()
                });
                teamwiseData = (res.data?.data || []).map(item => ({
                    ...item,
                    teamName: "Organization"
                }));
            }
            setData(teamwiseData);
        } catch (error) {
            console.log(error);
            setData([]);
        }
        setLoading(false);
    }

    async function AttendanceStatistics() {
        setLoading(true);
        try {
            const res = await Attendance_Apis.getAttendenceStatustics({
            "fromDate": getToday_ddmmyy(),
                "toDate": getToday_ddmmyy()
            });
            setData(res.data?.data || []);
        } catch (error) {
            console.log(error);
            setData([]);
        }
        setLoading(false);
    }

    const summary = data.reduce((acc, item) => ({
        totalEmployees: acc.totalEmployees + (item.totalEmployees || 0),
        present: acc.present + (item.present || 0),
        absent: acc.absent + (item.absent || 0),
        permission: acc.permission + (item.permission || 0),
        wfh: acc.wfh + (item.wfh || 0),
        leave: acc.leave + (item.leave || 0),
        presentNames: [...acc.presentNames, ...(item.presentNames || [])],
        absentNames: [...acc.absentNames, ...(item.absentNames || [])],
        permissionNames: [...acc.permissionNames, ...(item.permissionNames || [])],
        leaveNames: [...acc.leaveNames, ...(item.leaveNames || [])],
        wfhNames: [...acc.wfhNames, ...(item.wfhNames || [])]
    }), {
        totalEmployees: 0,
        present: 0,
        absent: 0,
        permission: 0,
        leave: 0,
        wfh: 0,
        presentNames: [],
        absentNames: [],
        permissionNames: [],
        leaveNames: [],
        wfhNames: []
    });

    const overallPercentage = summary.totalEmployees > 0 ?
        Math.round((summary.present / summary.totalEmployees) * 100) : 0;

    const initialData = data.slice(0, 1);

    const getPercentageColor = (percentage) => {
        return percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
            percentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
                'text-rose-600 dark:text-rose-400';
    };

    const getProgressColor = (percentage) => {
        return percentage >= 80 ? 'bg-emerald-500' :
            percentage >= 60 ? 'bg-amber-500' :
                'bg-rose-500';
    };

    const getStatusColor = (type) => {
        const colors = {
            present: "text-emerald-600 dark:text-emerald-400",
            absent: "text-rose-600 dark:text-rose-400",
            leave: "text-amber-600 dark:text-amber-400",
            permission: "text-blue-600 dark:text-blue-400",
            wfh: "text-purple-600 dark:text-purple-400",
            default: "text-neutral-600 dark:text-neutral-400"
        };
        return colors[type] || colors.default;
    };

    const StatusWithPopover = ({ type, count, names, label }) => {
        if (count === 0 || names?.length == 0) {
            return (
                <div className="text-center">
                    <div className="text-lg font-bold text-neutral-400 dark:text-neutral-600">
                        {count}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
                </div>
            );
        }

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                        <div className={`text-lg font-bold ${getStatusColor(type)}`}>
                            {count}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                    <h4 className="font-semibold text-sm mb-2 capitalize">{label} Employees</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {names.map((name, index) => (
                            <div key={index} className="text-sm text-neutral-700 dark:text-neutral-300 py-1">
                                {name}
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <CustomCard
            title={
                <span className="flex items-center">
                    Teamwise Attendance

                </span>
            }
            desc={formatDate(getToday_ddmmyy())}
            rightSection={
            <div className={`ml-2 text-base font-bold ${getPercentageColor(overallPercentage)}`}>
                {overallPercentage}%
            </div>}
            content={
                <div className="flex-1 rounded-xl">
                    {loading ?
                        <div className='h-full flex flex-col justify-between'>
                            <Skeleton className={"w-full h-[80%]"} />
                            <Skeleton className={"w-full h-[10%]"} />
                        </div> :
                        data.length > 0 ? (
                            <div className="space-y-5">
                                {/* Modern Summary Card */}
                                {data.length > 1 &&
                                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
                                        <div className='flex justify-between'>
                                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                                All Team Overview
                                            </h4>
                                            {data[0].holiday && <Badge>Holiday</Badge>}
                                            {data[0].sunday && <Badge>sunday</Badge>}
                                        </div>
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-5 gap-3 mb-4">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                    {summary.totalEmployees}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total</div>
                                            </div>
                                            <StatusWithPopover
                                                type="present"
                                                count={summary.present}
                                                names={summary.presentNames}
                                                label="Present"
                                            />
                                            <StatusWithPopover
                                                type="absent"
                                                count={summary.absent}
                                                names={summary.absentNames}
                                                label="Absent"
                                            />
                                            <StatusWithPopover
                                                type="leave"
                                                count={summary.leave}
                                                names={summary.leaveNames}
                                                label="Leave"
                                            />
                                            <StatusWithPopover
                                                type="permission"
                                                count={summary.permission}
                                                names={summary.permissionNames}
                                                label="Permission"
                                            />
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                                    Overall Progress
                                                </span>
                                                <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                                                    {summary.present}/{summary.totalEmployees}
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(overallPercentage)}`}
                                                    style={{ width: `${overallPercentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Additional status indicators */}
                                        <div className="mt-3 space-y-1">
                                            {summary.wfhNames.length > 0 && (
                                                <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                                    <span>•</span>
                                                    {summary.wfhNames.length} working from home
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                }

                                {/* Team-wise Statistics */}
                                {data.length == 1 && (
                                    <div className="space-y-3">
                                        {initialData.map((item, index) => (
                                            <StatisticsCard
                                                key={item.teamName || item.date || index}
                                                data={item}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                                <span className="text-lg font-medium">No attendance data</span>
                                <span className="text-sm mt-1">No attendance records found for today.</span>
                            </div>
                        )}
                </div>
            }
            footerContent={
                data.length > 1 && (
                    <div className="absolute w-[90%] bottom-3 left-1/2 -translate-x-1/2">
                        <AttendanceDialog data={data} summary={summary} />
                    </div>
                )
            }
        />
    );
}

export default AttendanceStatistics;
