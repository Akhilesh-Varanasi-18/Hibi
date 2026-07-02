"use client";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import permissionsAPI from "@/Apis/Permissions_APIs";
import WFHApis from "@/Apis/WFHApis";
import PendingParent from "./PendingParent";
import HistoryParent from "./HistoryParent";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { getDDMMYYDate, getEndOfMonth_ddmmyy } from "@/utils/DateFunctions";
import { CommonDataContext } from "@/app/dashboard/context/CommonDataContext";

// This function returns pending and actioned requests as an object of arrays
const splitByStatus = (data = []) => ({
  pending: data.filter((i) => ["PENDING", "ESCALATED"].includes(i.Status)),
  actioned: data.filter((i) => ["ACCEPTED", "REJECTED"].includes(i.Status)),
});

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

const ApprovalsCard = () => {
  const [loading, setLoading] = useState(false);
  const { reqCounts, setReqCounts} = useContext(CommonDataContext);
  const [data, setData] = useState({
    permissions: { pending: [], actioned: [] },
    wfh: { pending: [], actioned: [] },
  });

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      from: new Date(today.setDate(today.getDate() - 30)),
      to: new Date(getEndOfMonth_ddmmyy()),
    };
  });

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    const fromDate = getDDMMYYDate(dateRange.from);
    const toDate = getDDMMYYDate(dateRange.to);

    try {
      const [permissionsRes, wfhRes] = await Promise.all([
        permissionsAPI.getActionRequiredPermissions({ fromDate, toDate }),
        WFHApis.ActionRequired({ fromDate, toDate }),
      ]);

      const permissionsData = splitByStatus(permissionsRes?.data || []);
      const wfhData = splitByStatus(wfhRes?.data?.data || []);

      setData({ permissions: permissionsData, wfh: wfhData });
      // This is context in which the counts are displayed on the sidebar
      setReqCounts({...reqCounts, permissions : (permissionsData?.pending?.length + wfhData?.pending?.length) || 0})
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchApprovals()
  },[])

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-3">
        <MultipleDateSelector dateRange={dateRange} setDateRange={setDateRange}
        showUpcoming={true}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchApprovals}
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
          refresh={fetchApprovals}
          data={data.permissions.pending}
          wfhData={data.wfh.pending}
        />
      )}

      {loading ? (
        <ListSkeleton count={2} />
      ) : (
        <HistoryParent
          data={data.permissions.actioned}
          wfhData={data.wfh.actioned}
        />
      )}
    </div>
  );
};

export default ApprovalsCard;
