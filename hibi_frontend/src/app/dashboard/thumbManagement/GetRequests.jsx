"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Thumb_Apis } from "@/Apis/Thumb_Apis";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/Approval"; // Import StatusBadge for status rendering
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, FileText, X } from "lucide-react";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { getFirstOfMonth_ddmmyy } from "@/utils/DateFunctions";

// Format date to readable string
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Cards loading skeleton
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

// Main "My Thumb Requests" page as Card UI using date-range picker
const GetRequests = ({ refresh }) => {
  // Default range: today
  const today = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState({
    from: new Date(getFirstOfMonth_ddmmyy()),
    to: today,
  });
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format for backend
  function formatDateToYMD(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  }

  // Fetch user's thumb requests
  const fetchRequests = async (from, to) => {
    setLoading(true);
    setError(null);
    setRequests(null);
    try {
      const response = await Thumb_Apis.getThumbRequest({
        fromDate: formatDateToYMD(from),
        toDate: formatDateToYMD(to)
      });
      if (response.success) {
        setRequests(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setError(response.error || "Failed to fetch requests");
        setRequests([]);
      }
    } catch {
      setError("Failed to fetch requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // On mount and refresh, set dates to today and fetch
  useEffect(() => {
    fetchRequests(dateRange.from, dateRange.to);
  }, [refresh]);

  // On date range change, do NOT auto-fetch (wait for user "Apply")
  const handleApplyFilters = () => {
    fetchRequests(dateRange.from, dateRange.to);
  };

  // Memoize final requests array
  const requestsList = Array.isArray(requests) ? requests : [];

  return (
    <div className="flex flex-col gap-5 w-full mb-10">
      {/* Header */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <h1 className="text-base capitalize text-foreground/80 tracking-tight">Your Thumb Requests</h1>
        <div className="flex gap-4 items-center flex-wrap">
          <MultipleDateSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            showUpcoming={false}
          />
          <Button
            variant="outline"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            <RefreshCcw className={loading ? "animate-spin" : ""} />
            <span className="ml-2">Apply Filters</span>
          </Button>
        </div>
      </div>

      {/* Loading/Error/Empty states OR Cards */}
      {loading ? (
        <RequestsSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <X className="h-8 w-8 text-red-500" />
          <span className="mt-2 text-red-500">{error}</span>
        </div>
      ) : requestsList.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <span className="mt-2 text-muted-foreground">
            No requests found for the selected date range.
          </span>
        </div>
      ) : (
        requestsList?.map((req) => (
          <Card key={req._id || req.id} className="w-full mx-auto shadow-sm">
            <CardHeader className="pb-2 flex flex-col gap-1 items-start">
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-base">{req.requestFor || "-"}</span>
                <div className="flex items-center gap-2">
                  {/* Use StatusBadge instead of renderApprovalStatus */}
                  <StatusBadge label={req?.Status || req?.status} />
                </div>
              </div>
              {/* Compact details */}
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm text-muted-foreground">{req.reason || "-"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(req.thumbDate)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div>
                  <span className="font-medium text-foreground/60">Punch Type:</span>{" "}
                  {req.punchType || "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground/60">Status:</span>{" "}
                  {req.status || "-"}
                </div>
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

export default GetRequests;
