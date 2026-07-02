"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import permissionsAPI from "@/Apis/Permissions_APIs";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { getDDMMYYDate, getFirstOfYear_ddmmyy, getEndOfYear_ddmmyy } from "@/utils/DateFunctions";
import PendingParent from "./PendingParent";
import HistoryParent from "./HistoryParent";
import WFHApis from "@/Apis/WFHApis";

// this splits requests by their status for both permissions and Wfh requests
const splitByStatus = (data = []) => ({
    pending: data?.filter((i) => ["PENDING", "ESCALATED"].includes(i.Status)),
    actioned: data?.filter((i) => ["ACCEPTED", "REJECTED"].includes(i.Status)),
});

// for loading skeletons
const ListSkeleton = ({ count = 3 }) => (
    <div className="flex flex-col gap-6 w-full">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="w-full rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-5"
            >
                <div className="flex items-center gap-5">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/6" />
                    </div>
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
            </div>
        ))}
    </div>
);

const OrganizationApprovalsCards = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        permissions: { pending: [], actioned: [] },
        wfh: { pending: [], actioned: [] }
    });

    const [dateRange, setDateRange] = useState(() => {
        return {
            from: new Date(getFirstOfYear_ddmmyy()),
            to: new Date(getEndOfYear_ddmmyy()),
        };
    });

    // fetch both permissions and wfh using Promise.all
    const fetchOrganizationApprovals = useCallback(async () => {
        setLoading(true);
        const fromDate = getDDMMYYDate(dateRange.from);
        const toDate = getDDMMYYDate(dateRange.to);

        try {
            const [permissionsRes, wfhRes] = await Promise.all([
                permissionsAPI.OrganizationActionRequiredRequests({
                    fromDate,
                    toDate,
                }),
                WFHApis.OrganizationActionRequired({
                    fromDate,
                    toDate,
                }),
            ]);
            // this is for permissions
            const permissionsData = splitByStatus(permissionsRes?.data?.data || []);
            // this is for Wfh requests
            const wfhData = splitByStatus(wfhRes?.data?.data || []);
            setData({
                permissions: permissionsData,
                wfh: wfhData,
            });
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchOrganizationApprovals();
    }, []);

    return (
        <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-3">
                <MultipleDateSelector
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    showUpcoming={true}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchOrganizationApprovals}
                    disabled={loading}
                    className="flex items-center gap-1 mt-2 md:mt-0"
                >
                    <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            {loading ? (
                <ListSkeleton />
            ) : (
                <PendingParent
                    hideEscalated={true}
                    refresh={fetchOrganizationApprovals}
                    data={data.permissions.pending}
                    wfhData={data.wfh.pending}
                />
            )}

            {loading ? (
                <ListSkeleton count={2} />
            ) : (
                <HistoryParent
                    data={data?.permissions?.actioned}
                    wfhData={data?.wfh?.actioned}
                />
            )}
        </div>
    );
};

export default OrganizationApprovalsCards;