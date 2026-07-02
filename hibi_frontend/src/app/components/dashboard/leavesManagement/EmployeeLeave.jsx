"use client"
import React, { useEffect, useState } from 'react'
import LeaveManagementApi from '@/Apis/LeaveManagement'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from '@/components/ui/input'
import {
    Filter,
    CalendarDays,
    Briefcase,
    Users,
    AlertCircle,
    MessageSquare,
    Info,
    Timer,
    ChevronDown,
    ChevronUp,
    Clock1,
    Clock,
    UserCheck,
    User
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Comparing from '@/utils/CommonFunctionality'
import { Approved, Escalated, Pending, Rejected } from '@/components/ui/Approval'
import { RxCross2 } from 'react-icons/rx'
import CancelLeaveRequest from './Dialogs/CancelLeaveRequest'
import { format, startOfMonth, endOfMonth } from "date-fns"
import MultipleDateSelector from '@/app/components/ReusableComponents/MultipleDateSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateAndTime } from '@/utils/DateFunctions'

const EmployeeLeave = ({ status, onCancel, shift }) => {
    const [loader, setLoader] = useState(false);
    const [dataloader, setDataloader] = useState(false);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [statustype, setStatusType] = useState(status ?? []);
    const [expandedCards, setExpandedCards] = useState({});
    const [isopen, setisopen] = useState(false);
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(today),
        to: endOfMonth(today)
    });

    useEffect(() => {
        EmployeeLeaves();
    }, []);

    const DateChange = (dateChange) => {
        if (!dateChange) return "";
        try {
            const date = new Date(dateChange);
            if (isNaN(date.getTime())) return "";
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        } catch (error) {
            console.error("Date conversion error:", error);
            return "";
        }
    }

    async function EmployeeLeaves() {
        setDataloader(true);

        const requestData = {
            fromDate: DateChange(dateRange?.from) || "",
            toDate: DateChange(dateRange?.to) || ""
        };
        console.log("Request data:", requestData)

        try {
            const response = await LeaveManagementApi.GetEmployeeLeaveRequest(requestData);
            console.log("API Response:", response)
            if (response?.success) {
                const responseData = response?.data ?? [];
                const reversedData = Array.isArray(responseData) ? [...responseData].reverse() : [];
                setData(reversedData);
                setFilteredData(reversedData);
                setExpandedCards({});
            } else {
                setData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching employee leaves:", error);
            setData([]);
            setFilteredData([]);
        } finally {
            setDataloader(false);
        }
    }

    const handleDeleteClick = (leave) => {
        if (!leave?._id) {
            console.error("Invalid leave data for cancellation");
            return;
        }
        setSelectedLeave(leave);
        setDeleteDialogOpen(true);
    };

    const handleCancelConfirm = async (id) => {
        try {
            await EmployeeLeaves();
        } catch (error) {
            console.error("Error refreshing leaves after cancellation:", error);
        } finally {
            setDeleteDialogOpen(false);
            setSelectedLeave(null);
            onCancel?.();
        }
    };

    const handleCancelCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedLeave(null);
    };

    const handleFilterChange = (newFilter) => {
        if (!newFilter) return;

        setFilter(newFilter);
        if (newFilter === 'ALL') {
            setFilteredData(data);
        } else {
            const filtered = Array.isArray(data)
                ? data.filter(item => item?.Status === newFilter)
                : [];
            setFilteredData(filtered);
        }
    };

    const toggleCardExpansion = (leaveId) => {
        if (!leaveId) return;
        setExpandedCards(prev => ({
            ...prev,
            [leaveId]: !prev?.[leaveId]
        }));
    };

    const hasReasons = (leave) => {
        return true;
    };


    const getStatusComponent = (status) => {
        const statusLower = status?.toLowerCase?.();
        switch (statusLower) {
            case "accepted": return <Approved label="Approved" />;
            case "pending": return <Pending label="Pending" />;
            case "rejected": return <Rejected label="Rejected" />;
            case "cancelled": return <Rejected label="Cancelled" />;
            case "escalated": return <Escalated label="Escalated" />;
            default: return <Pending label="Unknown" />;
        }
    };

    const canCancelLeave = (leave) => {
        const today = new Date();
        
        const leaveDate = new Date(formatDate(leave?.startDate));

        // Compare only date part (ignore time)
        const isSameDay =
            today.getFullYear() === leaveDate.getFullYear() &&
            today.getMonth() === leaveDate.getMonth() &&
            today.getDate() === leaveDate.getDate();

        // Allow cancel only if status is valid
        const validStatuses = ["accepted", "escalated", "pending"];
        if (!validStatuses.includes(leave?.Status?.toLowerCase())) return false;

        const now = new Date();
        // now.setHours(14,10,0,0)

        // Convert shift times to Date objects for easy comparison
        const [startHour, startMin] = shift?.startTime?.split(":").map(Number);
        const [breakEndHour, breakEndMin] = shift?.breakTimeEnd?.split(":").map(Number);

        const shiftStart = new Date();
        shiftStart.setHours(startHour, startMin, 0, 0);

        const breakEnd = new Date();
        breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);

        // --- 🕒 Half-Day Leave Logic ---
        if (leave?.isHalfDay) {
            if (leaveDate > today) {
                // Future half-day leave → can always cancel
                return true;
            }

            if (isSameDay) {
                if (leave.halfDayPeriod === "1STHALF") {
                    // Disable cancel if first half already started
                    return now < shiftStart;
                } else if (leave.halfDayPeriod === "2NDHALF") {
                    // Disable cancel if second half already started
                    return now < breakEnd;
                }
            }

            // Past or ongoing half-day leave → cannot cancel
            return false;
        }

        // --- 🕓 Full-Day Leave Logic ---
        if (leaveDate > today) {
            // Future full-day leave → can cancel
            return true;
        }

        if (isSameDay) {
            // Disable cancel if shift already started
            return now < shiftStart;
        }

        // Past full-day leave → cannot cancel
        return false;
    };

    const handleDateRangeApply = () => {
        try {
            EmployeeLeaves();
            setisopen(false);
        } catch (error) {
            console.error("Error applying date range:", error);
            setisopen(false);
        }
    };

    return (
        <div className="min-h-screen dark:bg-neutral-950 py-6">
            <div className="w-full mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 my-2">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                        History
                    </h1>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Date Range Picker */}
                        <Popover open={isopen} onOpenChange={setisopen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[240px] justify-start text-left font-normal"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange?.to ? (
                                            <>
                                                {format(dateRange?.from, "MMM dd, yyyy")} -{" "}
                                                {format(dateRange?.to, "MMM dd, yyyy")}
                                            </>
                                        ) : (
                                            format(dateRange?.from, "MMM dd, yyyy")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                    className="p-3"
                                />
                                <div className="flex justify-between p-3 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setDateRange({
                                                from: startOfMonth(today),
                                                to: endOfMonth(today)
                                            });
                                        }}
                                    >
                                        Reset to Default
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleDateRangeApply}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                                    <Filter size={16} />
                                    {filter ?? "ALL"}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleFilterChange('ALL')}>
                                    All LEAVES
                                </DropdownMenuItem>
                                {Array.isArray(statustype) && statustype?.map((item, index) => (
                                    <DropdownMenuItem
                                        key={item?.statusType || index}
                                        onClick={() => handleFilterChange(item?.statusType)}
                                    >
                                        {item?.statusType ?? "Unknown Status"}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button onClick={EmployeeLeaves} disabled={dataloader} className="w-full sm:w-auto">
                            {dataloader ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                </div>

                {dataloader ? (
                    <div className='flex flex-col gap-2'>
                        <Skeleton className="w-full h-[150px]" />
                        <Skeleton className="w-full h-[150px]" />
                        <Skeleton className="w-full h-[150px]" />
                        <Skeleton className="w-full h-[150px]" />
                        <Skeleton className="w-full h-[150px]" />
                    </div>
                ) : (
                    <div className='px-2'>
                        {!Array.isArray(filteredData) || filteredData?.length === 0 ? (
                            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <CalendarDays className="h-12 w-12 text-neutral-300 mb-4" />
                                    <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        No leave requests found
                                    </h3>
                                    <p className="text-neutral-500 dark:text-neutral-400">
                                        {filter !== 'ALL' ?
                                            `No ${filter?.toLowerCase?.() ?? ""} leave requests in the selected period.` :
                                            'No leave requests found for the selected period.'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 max-h-[600px] overflow-y-auto py-7 pt-5">
                                {filteredData?.map((leave, idx) => {
                                    const leaveId = leave?._id || `leave-${idx}`;
                                    const isExpanded = expandedCards?.[leaveId];
                                    const showExpandButton = hasReasons(leave);

                                    return (
                                        <Card
                                            key={leaveId}
                                            className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white/60 backdrop-blur-sm transition-all duration-200 dark:bg-neutral-900/40 dark:border-neutral-800"
                                        >
                                            <CardHeader className="flex flex-col gap-2 px-4 pt-4 pb-2">
                                                {/* Top Row */}
                                                <div className="flex items-center justify-between flex-wrap">
                                                    {/* Left Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {leave?.isHalfDay ? (
                                                            <div className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                                <Timer size={12} />
                                                                Half Day ({leave?.halfDayPeriod})
                                                            </div>
                                                        ) : null}

                                                        {leave?.consideration ? (
                                                            <div className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                                <Info size={12} />
                                                                {leave?.consideration}
                                                            </div>
                                                        ) : null}

                                                        <div className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/40 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300">
                                                            <Briefcase size={12} />
                                                            {leave?.leaveType ?? "Unknown Type"}
                                                        </div>

                                                        <div className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/40 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-400">
                                                            <CalendarDays size={12} />
                                                            Total: {leave?.totalDays ?? 0}d
                                                        </div>

                                                        {(leave?.actualWorkingDays ?? 0) > 0 && (
                                                            <div className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-transparent px-2.5 py-1 text-[11px] font-medium text-red-600 dark:border-red-700 dark:text-red-400">
                                                                <Users size={12} />
                                                                Working: {leave?.actualWorkingDays ?? 0}d
                                                            </div>
                                                        )}




                                                        {/* Move this to the far right */}

                                                    </div>

                                                    {/* Right Status + Cancel */}
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            {getStatusComponent(leave?.Status)}
                                                        </div>

                                                        {canCancelLeave(leave) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex items-center gap-1 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 px-2.5 py-1 rounded-md text-[11px] font-medium transition"
                                                                onClick={() => handleDeleteClick(leave)}
                                                            >
                                                                <RxCross2 className="text-red-500 text-sm" />
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Date Range */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-50 px-3 py-2 dark:bg-neutral-900/40">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={14} className="text-neutral-500 dark:text-neutral-400" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                                Duration
                                                            </span>
                                                            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                                                                {formatDate(leave?.startDate)} → {formatDate(leave?.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className='flex'>
                                                        <div className="ml-auto flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/40 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-400">
                                                            <Clock1 size={12} />
                                                            Posted at: {formatDateAndTime(leave?.createdAt)}
                                                        </div>
                                                        {showExpandButton && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => toggleCardExpansion(leaveId)}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Expand Button - Only show if there are reasons */}

                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-3 px-4 pb-4">
                                                {isExpanded && (
                                                    <div className="space-y-3 animate-in fade-in duration-200">
                                                        {/* Notify To */}
                                                        {leave?.notifyTo && leave.notifyTo.length > 0 && (
                                                            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <User size={12} className="text-neutral-500 dark:text-neutral-400" />
                                                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                                                        Notify To
                                                                    </h4>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {leave.notifyTo.map((person, index) => (
                                                                        <span
                                                                            key={index}
                                                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white border border-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300"
                                                                        >
                                                                            {person}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Actioned By */}
                                                        {leave?.actionedBy && (
                                                            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <UserCheck size={12} className="text-neutral-500 dark:text-neutral-400" />
                                                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                                                        Actioned By
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                                                                    {leave.actionedBy}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Leave Reason */}
                                                        {leave?.leaveReason && (
                                                            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <MessageSquare size={12} className="text-neutral-500 dark:text-neutral-400" />
                                                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                                                        Leave Reason
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                                                                    {leave.leaveReason}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Action Reason */}
                                                        {leave?.actionReason && (
                                                            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <Info size={12} className="text-neutral-500 dark:text-neutral-400" />
                                                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                                                        Action Reply
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                                                                    {leave.actionReason}
                                                                </p>

                                                            </div>
                                                        )}

                                                        {/* Updated Timestamp */}
                                                        {leave?.updatedAt != leave?.createdAt && (
                                                            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <Clock size={12} className="text-neutral-500 dark:text-neutral-400" />
                                                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                                                        Last Updated
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                                                                    {formatDateAndTime(leave.updatedAt)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <CancelLeaveRequest
                            open={deleteDialogOpen}
                            onOpenChange={setDeleteDialogOpen}
                            selectedLeave={selectedLeave}
                            onConfirm={handleCancelConfirm}
                            onCancel={handleCancelCancel}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeLeave;