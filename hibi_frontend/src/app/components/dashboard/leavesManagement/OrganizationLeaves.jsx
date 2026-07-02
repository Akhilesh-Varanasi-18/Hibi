import React, { useContext, useEffect, useState } from 'react';
import LeaveManagementApi from '@/Apis/LeaveManagement';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Comparing from '@/utils/CommonFunctionality';
import RejectLeaveDialog from '@/app/components/dashboard/leavesManagement/Dialogs/RejectLeaveRequest';
import ApproveLeaveDialog from '@/app/components/dashboard/leavesManagement/Dialogs/AcceptLeaveRequest';
; import CancelLeaveRequest from '@/app/components/dashboard/leavesManagement/Dialogs/CancelLeaveRequest';
import EscalateLeaveDialog from '@/app/components/dashboard/leavesManagement/Dialogs/EscalatedLeaveRequest';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';
import { AlertCircle, Briefcase, CalendarDays, ChevronDown, ChevronUp, Clock, Clock1, Dot, Info, MessageSquare, Timer, User, UserCheck, Users } from 'lucide-react';
import { Approved, Escalated, Pending, Rejected } from '@/components/ui/Approval';
import { format, startOfMonth, endOfMonth } from "date-fns"
import { calculatePendingAndEscalated } from '@/utils/UseFulFunctions';
import { CommonDataContext } from '../../../dashboard/context/CommonDataContext';
import { formatDate, formatDateAndTime } from '@/utils/DateFunctions';

const OrganizationLeaves = ({ statusTypes, shift }) => {
    const [leaveData, setLeavedata] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loader, setLoader] = useState(true);
    const [status, setstatus] = useState(statusTypes ?? []);
    const [resquestLoader, setrequestLoader] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [approvalDialog, setApprovalDialog] = useState(false);
    const [rejectionDialog, setRejectionDialog] = useState(false);
    const [escalationDialog, setEscalationDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);
    const [isopen, setisopen] = useState(false);
    const today = new Date();
    const [expandedCards, setExpandedCards] = useState({});
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(today),
        to: endOfMonth(today)
    });
    const { toast } = useToast();
    const { reqCounts, setReqCounts } = useContext(CommonDataContext);

    useEffect(() => {
        getLeaveRequests();
    }, []);

    const DateChange = (dateChange) => {
        if (!dateChange) return "";
        try {
            const date = new Date(dateChange);
            if (isNaN(date?.getTime?.())) return "";
            return date?.getFullYear?.() + "-" + ((date?.getMonth?.() ?? 0) + 1) + "-" + date?.getDate?.();
        } catch (error) {
            console.error("Date conversion error:", error);
            return "";
        }
    }

    async function getLeaveRequests() {
        setLoader(true);
        const data = {
            fromDate: DateChange(dateRange?.from) || "",
            toDate: DateChange(dateRange?.to) || ""
        };
        console.log("Request data:", data)
        try {
            const response = await LeaveManagementApi.OrganizationLeaves(data);
            console.log("API Response:", response?.data?.data);
            if (response?.success) {
                const responseData = response?.data?.data ?? [];
                const reversedData = Array.isArray(responseData) ? [...responseData]?.reverse?.() : [];
                setLeavedata(reversedData);
                setFilteredData(reversedData);
                setExpandedCards({});
            } else {
                setLeavedata([]);
                setFilteredData([]);
            }

            const pendingAndEscalatedSum = calculatePendingAndEscalated(response?.data?.data);
            // setReqCounts?.({ ...reqCounts, leaves: pendingAndEscalatedSum });
        } catch (error) {
            console.error("Error fetching leave requests:", error);
            setLeavedata([]);
            setFilteredData([]);
        } finally {
            setLoader(false);
        }
    }

    useEffect(() => {
        let result = leaveData ?? [];
        if (searchTerm) {
            result = result?.filter?.((item) =>
                item?.employee?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.())
            );
        }
        if (statusFilter !== 'all') {
            result = result?.filter?.((item) => item?.Status === statusFilter);
        }
        setFilteredData(result);
    }, [searchTerm, statusFilter, leaveData]);

    function HandleRefresh() {
        const refreshData = async () => {
            setLoader(true);
            await getLeaveRequests();
            setLoader(false);
        };
        refreshData();
    }

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

    async function handleAction(actionType, note, escalateTo = null) {
        setrequestLoader(true);

        let statusType;
        if (actionType === "APPROVE") {
            statusType = "ACCEPTED";
        } else if (actionType === "REJECT") {
            statusType = "REJECTED";
        } else if (actionType === "ESCALATE") {
            statusType = "ESCALATED";
        }

        const stat = status?.find?.((s) => s?.statusType === statusType);

        if (stat && selectedLeave) {
            const sendData = {
                leaveRequestId: selectedLeave?._id,
                statusId: stat?._id,
                actionReason: note,
            };

            try {
                const res = await LeaveManagementApi.ProcessLeaveRequest(sendData);
                if (res?.success) {
                    setApprovalDialog(false);
                    setRejectionDialog(false);
                    setEscalationDialog(false);
                    setSelectedLeave(null);
                    setrequestLoader(false);
                    HandleRefresh();
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>{res?.data?.message ?? "Action completed successfully"}</span>
                        </div>,
                    });
                } else {
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.data ?? "An error occurred"}</span>
                        </div>,
                    });
                    setrequestLoader(false);
                }
            } catch (error) {
                console.error("Error processing leave request:", error);
                toast({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{error?.message ?? "An error occurred"}</span>
                    </div>,
                });
                setrequestLoader(false);
            }
        } else {
            setrequestLoader(false);
        }
    }

    const handleCancelConfirm = async (id) => {
        try {
            HandleRefresh();
        } catch (error) {
            console.error("Error handling cancel confirmation:", error);
        } finally {
            setCancelDialog(false);
            setSelectedLeave(null);
        }
    };

    const handleCancelCancel = () => {
        setCancelDialog(false);
        setSelectedLeave(null);
    };

    const handleApproveClick = (leave) => {
        if (!leave?._id) {
            console.error("Invalid leave data for approval");
            return;
        }
        setSelectedLeave(leave);
        setApprovalDialog(true);
    };

    const handleRejectClick = (leave) => {
        if (!leave?._id) {
            console.error("Invalid leave data for rejection");
            return;
        }
        setSelectedLeave(leave);
        setRejectionDialog(true);
    };

    const handleEscalateClick = (leave) => {
        if (!leave?._id) {
            console.error("Invalid leave data for escalation");
            return;
        }
        setSelectedLeave(leave);
        setEscalationDialog(true);
    };

    const handleCancelClick = (leave) => {
        if (!leave?._id) {
            console.error("Invalid leave data for cancellation");
            return;
        }
        setSelectedLeave(leave);
        setCancelDialog(true);
    };

    const canShowApprovalActions = (leave) => {
        return Comparing?.compareStrings?.(leave?.Status, "PENDING") ||
            Comparing?.compareStrings?.(leave?.Status, "ESCALATED");
    };


    const canShowCancelAction = (leave) => {
        const today = new Date();

        const leaveDate = new Date(formatDate(leave?.startDate));

        // Compare only date part (ignore time)
        const isSameDay =
            today.getFullYear() === leaveDate.getFullYear() &&
            today.getMonth() === leaveDate.getMonth() &&
            today.getDate() === leaveDate.getDate();

        // Allow cancel only if status is valid
        const validStatuses = ["accepted"];
        if (!validStatuses.includes(leave?.Status?.toLowerCase())) return false;

        const now = new Date();
        // now.setHours(14,10,0,0)

        // Convert shift times to Date objects for easy comparison
        const [startHour, startMin] = shift.startTime.split(":").map(Number);
        const [breakEndHour, breakEndMin] = shift.breakTimeEnd.split(":").map(Number);

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
            getLeaveRequests();
            setisopen(false);
        } catch (error) {
            console.error("Error applying date range:", error);
            setisopen(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h1 className="text-2xl font-bold">Organization Leave Approvals</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto justify-end items-end ">
                    <Input
                        placeholder="Search by employee name..."
                        value={searchTerm ?? ""}
                        onChange={(e) => setSearchTerm(e?.target?.value ?? "")}
                        className="max-w-md"
                    />

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
                                        const today = new Date();
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All STATUS</SelectItem>
                            {Array.isArray(status) && status?.map?.((data, index) => (
                                <SelectItem
                                    key={data?.statusType || index}
                                    className="capitalize"
                                    value={data?.statusType ?? ""}
                                >
                                    {data?.statusType ?? "Unknown"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={HandleRefresh} className="w-full md:w-auto" disabled={loader}>
                        {loader ? "Refreshing" : "Refresh"}
                    </Button>
                </div>
            </div>

            {loader ? <div className="space-y-4 p-4">
                {[...Array(5)]?.map?.((_, i) => (
                    <Skeleton key={i} className="h-[150px] w-full" />
                ))}
            </div> :
                <div>
                    {!Array.isArray(filteredData) || filteredData?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                {!Array.isArray(leaveData) || leaveData?.length === 0 ? 'No leave requests found' : 'No matching leave requests found'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 max-h-screen overflow-y-auto py-7 pt-5">
                            {filteredData?.map?.((leave, index) => {
                                const leaveId = leave?._id || `leave-${index}`;
                                const isExpanded = expandedCards?.[leaveId];
                                const showExpandButton = hasReasons(leave);

                                const ApprovalActions = (
                                    <div>
                                        {canShowApprovalActions(leave) && (
                                            <div className="flex gap-1 shrink-0 flex-wrap w-full">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-destructive"
                                                    onClick={() => handleRejectClick?.(leave)}
                                                >
                                                    Reject
                                                </Button>
                                                {/* <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    onClick={() => handleEscalateClick?.(leave)}
                                                >
                                                    Escalate
                                                </Button> */}
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    onClick={() => handleApproveClick?.(leave)}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                        {/* && new Date(leave?.startDate?.split("T")[0])?.setHours(0, 0, 0, 0) >= new Date()?.setHours(0, 0, 0, 0) */}
                                        {(canShowCancelAction(leave)) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-1 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 px-2.5 py-1 rounded-md text-[11px] font-medium transition"
                                                onClick={() => handleCancelClick?.(leave)}
                                            >
                                                <RxCross2 className="text-red-500 text-sm" />
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                );

                                return (
                                    <Card
                                        key={leaveId}
                                        className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white/60 backdrop-blur-sm transition-all duration-200 dark:bg-neutral-900/40 dark:border-neutral-800"
                                    >
                                        <CardHeader className="flex flex-col gap-2 px-4 pt-4 pb-2">
                                            {/* Top Row */}
                                            <div className="flex flex-wrap items-center justify-between">

                                                {/* Left Badges */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate flex items-center">
                                                        {leave?.requestedBy ?? "Unknown Employee"}
                                                    </span>
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
                                                        <div className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/40 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-400">
                                                            <Users size={12} />
                                                            Working: {leave?.actualWorkingDays ?? 0}d
                                                        </div>
                                                    )}

                                                    {(leave?.lopDays ?? 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 rounded-md border border-neutral-400 bg-transparent px-2.5 py-1 text-[11px] font-medium text-red-600 dark:border-red-700 dark:text-red-400">
                                                            <AlertCircle size={12} />
                                                            LOP: {leave?.lopDays ?? 0}d
                                                        </div>
                                                    )}

                                                </div>

                                                {/* Right Status + Cancel */}
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        {getStatusComponent(leave?.Status)}
                                                    </div>
                                                    <div className="hidden md:flex">
                                                        {ApprovalActions}
                                                    </div>
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
                                                            {formatDate?.(leave?.startDate)} → {formatDate?.(leave?.endDate)}
                                                        </span>
                                                    </div>
                                                </div>


                                                <div className='flex flex-wrap'>
                                                    <div className="ml-auto flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white/40 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-400">
                                                        <Clock1 size={12} />
                                                        Requested at: {formatDateAndTime(leave?.createdAt)}
                                                    </div>
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
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 px-4 pb-4">
                                            {/* Leave Info */}

                                            {/* Expandable Reasons Section */}
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

                                        {/* Mobile actions */}
                                        <div className="flex md:hidden px-4 pb-4 justify-end w-full">
                                            {ApprovalActions}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            }

            {/* Dialog components with safety checks */}
            {selectedLeave && approvalDialog && (
                <ApproveLeaveDialog
                    data={selectedLeave}
                    onAction={handleAction}
                    loader={resquestLoader}
                    open={approvalDialog}
                    onOpenChange={setApprovalDialog}
                />
            )}

            {selectedLeave && escalationDialog && (
                <EscalateLeaveDialog
                    data={selectedLeave}
                    onAction={handleAction}
                    loader={resquestLoader}
                    open={escalationDialog}
                    onOpenChange={setEscalationDialog}
                />
            )}

            {selectedLeave && rejectionDialog && (
                <RejectLeaveDialog
                    data={selectedLeave}
                    onAction={handleAction}
                    loader={resquestLoader}
                    open={rejectionDialog}
                    onOpenChange={setRejectionDialog}
                />
            )}

            {selectedLeave && cancelDialog && (
                <CancelLeaveRequest
                    selectedLeave={selectedLeave}
                    open={cancelDialog}
                    onOpenChange={setCancelDialog}
                    onConfirm={handleCancelConfirm}
                    onCancel={handleCancelCancel}
                />
            )}
        </div>
    );
};

export default OrganizationLeaves;