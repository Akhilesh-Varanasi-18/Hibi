"use client";
import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import odapi from "@/Apis/odapi";
import { Button } from "@/components/ui/button";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { CommonDataContext } from "../../context/CommonDataContext";
import { calculatePendingAndEscalated } from "@/utils/UseFulFunctions";
import {
  formatDate,
  getDDMMYYDate,
  getEndOfMonth_ddmmyy,
  getFirstOfMonth_ddmmyy,
} from "@/utils/DateFunctions";
import { StatusBadge } from "@/components/ui/Approval";
import ProcessRequestIcon from "@/components/ui/ProcessRequestIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CustomActionDialog } from "@/app/components/ReusableComponents/CustomActionDialog";
import { ApproveConfig, EscalateConfig, RejectConfig } from "@/utils/ProcessRequestsConfig";
import Comparing from "@/utils/CommonFunctionality";
import { FilterStatusTypesForCEOandCOO, FilterStatusTypesForProcessing } from "@/utils/FilterStatusTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Shared with GetActionRequests (order, filter, etc.)
const ALLOWED_STATUS_FILTERS = [
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "PENDING",
  "ESCALATED",
];

const STATUS_LABELS = {
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  ESCALATED: "Escalated",
};

const RequestsSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
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

// SummaryHeader now matches GetActionRequests-style, with org-level info *plus* action buttons/logic
const SummaryHeader = ({ request, FilteredStatusTypes, setOpen, setFormConfig, getConfigData }) => {
  const handleDialogOpen = async (type, statusId, requestId) => {
    const config = getConfigData(type);
    config.ExtraValues = { statusId, ODRequestId: requestId };
    setFormConfig(config);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="font-semibold text-base">
          {request.employee || request.requestedBy || "-"}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge label={request?.Status} />
          {(Comparing.compareStrings(request.Status, "ESCALATED") ||
            Comparing.compareStrings(request.Status, "PENDING")) && 
            FilterStatusTypesForCEOandCOO(FilteredStatusTypes)?.map((item, i) => (
              <div
                key={item?._id || i}
                onClick={() =>
                  handleDialogOpen(item?.statusType, item?._id, request?._id)
                }
              >
                <ProcessRequestIcon label={item.statusType} />
              </div>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-between w-full mt-1">
        <span className="text-sm text-muted-foreground">
          {request.odType || request.requestType}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(request.fromDate)}
          {(request.toDate && request.toDate !== request.fromDate) ? ` - ${formatDate(request.toDate)}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-1 flex-wrap">
        {request.actionedBy && (
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/60">Actioned By: </span>
            {request.actionedBy}
          </span>
        )}
        {(Array.isArray(request.notifyTo) && request.notifyTo.length > 0) && (
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/60">Notify To: </span>
            {request.notifyTo.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
};

const DetailsAccordion = ({ request }) => (
  <Accordion type="single" collapsible className="w-full mt-2">
    <AccordionItem value={`details-${request._id}`} className="border-none">
      <AccordionTrigger className="text-sm px-0 no-underline hover:no-underline font-normal text-foreground/40">
        Show Details
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-foreground/60">Reason:</span> {request.reason || "-"}
          </div>
          <div>
            <span className="font-medium text-foreground/60">Status:</span> {request.Status || "-"}
          </div>
          {request.actionReason && request.actionReason.trim() && (
            <div>
              <span className="font-medium text-foreground/60">Action Reason:</span>{" "}
              {request.actionReason}
            </div>
          )}
          {request.createdAt && (
            <div>
              <span className="font-medium text-foreground/60">Requested On:</span>{" "}
              {formatDate(request.createdAt)}
            </div>
          )}
          {request.requestedBy && (
            <div>
              <span className="font-medium text-foreground/60">Requested By:</span>{" "}
              {request.requestedBy}
            </div>
          )}
          {request.updatedAt && (
            <div>
              <span className="font-medium text-foreground/60">Last Updated:</span>{" "}
              {formatDate(request.updatedAt)}
            </div>
          )}
          {request.totalDays !== undefined && (
            <div>
              <span className="font-medium text-foreground/60">Total Days:</span> {request.totalDays}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

const GetOrganizationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(getFirstOfMonth_ddmmyy()),
    to: new Date(getEndOfMonth_ddmmyy()),
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [formConfig, setFormConfig] = useState();
  const [open, setOpen] = useState(false);
  const { statusTypes, reqCounts, setReqCounts } = useContext(CommonDataContext);

  // Used to match/process allowed org-level actions in the correct order
  const filteredStatusTypes = useMemo(
    () =>
      Array.isArray(statusTypes)
        ? ALLOWED_STATUS_FILTERS.map((allowed) =>
            statusTypes.find(
              (st) => (st.statusType || "").toUpperCase() === allowed
            )
          ).filter(Boolean)
        : [],
    [statusTypes]
  );

  // Action dialog config setup (copied/adjusted from GetActionRequests)
  const getConfigData = useCallback((type) => {
    let config;
    if (type === "ACCEPTED") config = ApproveConfig;
    else if (type === "ESCALATED") config = EscalateConfig;
    else if (type === "REJECTED") config = RejectConfig;
    else config = {};

    config.onSubmit = async (data) => {
      const res = await odapi.ProcessActionRequests(data);
      // Show toast, refetch, etc.
      if (res.success) {
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast(res.message || "Request processed", "success");
        }
      } else {
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast(res.error || "Failed to process request", "error");
        }
      }
      await getRequests();
    };
    return config;
  // eslint-disable-next-line
  }, [reqCounts]);


  // Fetch requests
  const getRequests = useCallback(async () => {
    setLoading(true);
    setRequests([]);
    try {
      const response = await odapi.getOrganizationRequest({
        fromDate: getDDMMYYDate(dateRange.from),
        toDate: getDDMMYYDate(dateRange.to),
      });
      if (response?.success) {
        const dataArr = Array.isArray(response?.data?.data) ? response?.data?.data : [];
        setRequests(dataArr);
        if (setReqCounts && typeof calculatePendingAndEscalated === "function") {
          const pendingAndEscalatedSum = calculatePendingAndEscalated(dataArr);
          setReqCounts({ ...reqCounts, ods: pendingAndEscalatedSum });
        }
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [dateRange.from, dateRange.to, setReqCounts, reqCounts]);

  useEffect(() => {
    getRequests();
    // eslint-disable-next-line
  }, [refresh, dateRange.from, dateRange.to]);

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Statuses" },
      ...ALLOWED_STATUS_FILTERS.map((stat) => ({
        value: stat,
        label: STATUS_LABELS[stat] || stat,
      })),
    ],
    []
  );

  // Filtered and ordered like GetActionRequests: "pending"/"escalated" first
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    let results = requests;
    if (selectedStatus !== "ALL") {
      results = results.filter((r) =>
        (r.Status || r.status || "").toUpperCase() === selectedStatus
      );
    }
    const PENDING = "PENDING";
    const ESCALATED = "ESCALATED";
    const pendingAndEscalated = [];
    const others = [];
    for (const r of results) {
      const stat = (r?.Status || r?.status || "").toUpperCase();
      if (stat === PENDING || stat === ESCALATED) {
        pendingAndEscalated.push(r);
      } else {
        others.push(r);
      }
    }
    return [...pendingAndEscalated, ...others];
  }, [requests, selectedStatus]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header: */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <h1 className="text-base capitalize text-foreground/80 tracking-tight">
          Organization OD Requests
        </h1>
        <div className="flex gap-4 items-center flex-wrap">
          <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val ? val.toUpperCase() : "ALL")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MultipleDateSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            showUpcoming={true}
          />
          <Button onClick={() => setRefresh((p) => !p)}>
            <RefreshCcw />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {loading || !Array.isArray(requests) ? (
        <RequestsSkeleton />
      ) : filteredRequests.length > 0 ? (
        filteredRequests.map((r) => (
          <Card key={r._id} className="w-full mx-auto shadow-sm p-0">
            <CardHeader className="flex flex-col items-start gap-0 pb-0">
              <SummaryHeader
                request={r}
                FilteredStatusTypes={filteredStatusTypes}
                setOpen={setOpen}
                setFormConfig={setFormConfig}
                getConfigData={getConfigData}
              />
            </CardHeader>
            <CardContent className="py-0">
              <DetailsAccordion request={r} />
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-sm text-muted-foreground py-8 w-full text-center">
          No OD requests found for the selected filters.
        </div>
      )}
      <CustomActionDialog config={formConfig} open={open} setOpen={setOpen} />
    </div>
  );
};

export default GetOrganizationRequests;
