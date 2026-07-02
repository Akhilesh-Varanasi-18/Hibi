"use client";
import React, { useEffect, useState, useCallback } from "react";
import permissionsAPI from "@/Apis/Permissions_APIs";
import RecentApprovals from "./RecentApprovals";
import PermissionTrends from "./PermissionTrends";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import WFHApis from "@/Apis/WFHApis";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";

const StatisticsCards = ({ refresh }) => {
  const [history, setHistory] = useState([]);
  const [wfhHistory, setWfhHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTypes, setStatusTypes] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    const to = new Date(today);
    to.setDate(today.getDate() + 30);
    return { from, to };
  });

  // Fetch permissions and WFH requests based on dateRange
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = dateRange.from;
      const toDate = dateRange.to;

      const [res, resWFH] = await Promise.all([
        permissionsAPI.getAllEmployeePermissions({ fromDate, toDate }),
        WFHApis.GetEmployeeWFHReq({ fromDate, toDate }),
      ]);

      setHistory(res?.success ? res?.data?.data || [] : []);
      setWfhHistory(resWFH && resWFH.success && Array.isArray(resWFH.data) ? resWFH.data : []);
    } catch (error) {
      setHistory([]);
      setWfhHistory([]);
    } finally {
      setLoading(false);
    }
    
  }, []);

  // Fetch when dateRange changes or refresh prop changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions, refresh]);

  // Loading skeletons
  const SkeletonCards = () => (
    <div className="flex md:flex-nowrap flex-wrap gap-6 w-full relative">
      <div className="flex-1 min-w-[320px]">
        <Skeleton className="h-[220px] w-full rounded-xl mb-4" />
      </div>
      <div className="flex-1 min-w-[320px]">
        <Skeleton className="h-[220px] w-full rounded-xl mb-4" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="z-10 flex py-4 items-center justify-between flex-wrap">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-300">
          Statistics
        </h1>
        <div className="flex items-center gap-2 flex-wrap w-full justify-end">
          <div>
          <MultipleDateSelector
            showUpcoming={true}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPermissions}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="flex md:flex-nowrap flex-wrap gap-6 w-full relative">
          <RecentApprovals
            data={history}
            wfhData={wfhHistory}
            refresh={fetchPermissions}
            statusTypes={statusTypes}
          />
          <PermissionTrends data={history} wfhData={wfhHistory} />
        </div>
      )}
    </div>
  );
};

export default StatisticsCards;