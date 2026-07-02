"use client"
import odapi from '@/Apis/odapi';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/Approval";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, FileText, X } from "lucide-react";
import AddOd from "./addOd";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { formatDate } from '@/utils/DateFunctions';

const RequestsSkeleton = () => (
    <>
        {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full mx-auto shadow-sm">
                <CardHeader className="pb-2 flex flex-col gap-0 items-start">
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-4 w-20 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-12 w-full mt-2" />
                </CardContent>
            </Card>
        ))}
    </>
);

// These tabs for on-duty status
const STATUS_TABS = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "ESCALATED", label: "Escalated" },
    { key: "CANCELLED", label: "Cancelled" }
];

const EmployeeOds = () => {
    const [requests, setRequests] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(0);

    // Date range default: last 30 days to today
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 30);
        const to = new Date(today);
        return { from, to };
    });

    const [filterStatus, setFilterStatus] = useState("ALL");

    // Format for backend API: "yyyy/mm/dd"
    function formatDateToYMD(date) {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
    }

    // Fetch data from API
    const fetchRequests = async (from, to) => {
        setLoading(true);
        setError(null);
        setRequests(null);
        try {
            const res = await odapi.getemployeeRequest({
                fromDate: formatDateToYMD(from),
                toDate: formatDateToYMD(to)
            });
            // Accept both: sometimes res?.data?.data, sometimes res?.data
            let data =
                res && res.data
                    ? Array.isArray(res.data.data)
                        ? res.data.data
                        : Array.isArray(res.data)
                            ? res.data
                            : []
                    : [];
            setRequests(data);
        } catch {
            setError("Failed to fetch requests");
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // On refresh: set dates, fetch
    useEffect(() => {
        fetchRequests(dateRange.from, dateRange.to);
    }, [refresh]);

    // On clicking "Apply Filters" (date), fetch
    const handleApplyFilters = () => {
        fetchRequests(dateRange.from, dateRange.to);
    };

    // Filtering by tab
    const filteredRequests = useMemo(() => {
        if (!Array.isArray(requests)) return [];
        if (filterStatus === "ALL") return requests;
        if (filterStatus === "APPROVED") {
            return requests.filter(
                (item) =>
                    (item.Status || item.status) === "APPROVED" ||
                    (item.Status || item.status) === "ACCEPTED"
            );
        }
        return requests.filter(
            (item) =>
                ((item.Status || item.status) || "")
                    .toUpperCase()
                    .replace(" ", "") === filterStatus
        );
    }, [requests, filterStatus]);

    // Card List
    return (
        <div className="flex flex-col gap-5 w-full mb-10">
            {/* Header */}
            <div className="flex gap-4 items-center flex-wrap justify-between">
                <h1 className="text-base capitalize text-foreground/80 tracking-tight">
                    Your Requests
                </h1>
                <div className="flex gap-4 items-center flex-wrap">
                    <MultipleDateSelector
                        showUpcoming={true}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />
                    <Button variant="outline" onClick={handleApplyFilters} disabled={loading}>
                        <RefreshCcw className={loading ? "animate-spin" : ""} />
                    </Button>
                    <AddOd refresh={() => setRefresh((x) => x + 1)} />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 w-full overflow-scroll pb-2">
                {STATUS_TABS.map((tab) => (
                    <Button
                        key={tab.key}
                        variant={filterStatus === tab.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus(tab.key)}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* List / Loading / Error / Empty States */}
            {loading ? (
                <RequestsSkeleton />
            ) : error ? (
                <div className="flex flex-col items-center py-12">
                    <X className="h-8 w-8 text-red-500" />
                    <span className="mt-2 text-red-500">{error}</span>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <span className="mt-2 text-muted-foreground">No requests found.</span>
                </div>
            ) : (
                filteredRequests.map((req) => (
                    <Card key={req._id || req.id} className="w-full mx-auto shadow-sm">
                        <CardHeader className="pb-4 flex flex-col gap-1 items-start">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 w-full justify-between">
                                    <div className="flex items-center justify-between w-full mt-1">
                                        <span className="text-sm text-foreground">
                                            {formatDate(req.fromDate)}
                                            {req.toDate && req.toDate !== req.fromDate
                                                ? ` - ${formatDate(req.toDate)}`
                                                : ""}
                                        </span>
                                    </div>
                                    <StatusBadge label={req.Status || req.status} />
                                </div>
                            </div>
                            {/* Compact details */}

                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 text-sm">
                                <div>
                                    <span className="text-sm text-muted-foreground">Reason : {req.reason || "-"}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-foreground/60">Status:</span>{" "}
                                    {req.Status || req.status || "-"}
                                </div>
                                {typeof req.totalDays !== "undefined" && (
                                    <div>
                                        <span className="font-medium text-foreground/60">
                                            Duration:
                                        </span>{" "}
                                        {req.totalDays} day{req.totalDays === 1 ? "" : "s"}
                                    </div>
                                )}
                                {req.actionReason && (
                                    <div>
                                        <span className="font-medium text-foreground/60">Action Reason:</span>{" "}
                                        {req.actionReason}
                                    </div>
                                )}
                                {req.actionedBy && (
                                    <div>
                                        <span className="font-medium text-foreground/60">Actioned By:</span>{" "}
                                        {req.actionedBy}
                                    </div>
                                )}
                                {Array.isArray(req.notifyTo) && req.notifyTo.length > 0 && (
                                    <div>
                                        <span className="font-medium text-foreground/60">Notify To:</span>{" "}
                                        {req.notifyTo.join(", ")}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

export default EmployeeOds;