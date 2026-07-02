"use client";
import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CommonDataContext } from "../../context/CommonDataContext";
import { formatDate, getDDMMYYDate, getEndOfMonth_ddmmyy, getFirstOfMonth_ddmmyy } from "@/utils/DateFunctions";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { showToast } from "@/lib/ToastService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/Approval";
import ProcessRequestIcon from "@/components/ui/ProcessRequestIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import odapi from "@/Apis/odapi";
import { calculatePendingAndEscalated } from "@/utils/UseFulFunctions";
import { ApproveConfig, EscalateConfig, RejectConfig } from "@/utils/ProcessRequestsConfig";
import { CustomActionDialog } from "@/app/components/ReusableComponents/CustomActionDialog";
import Comparing from "@/utils/CommonFunctionality";
import { FilterStatusTypesForProcessing } from "@/utils/FilterStatusTypes";



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
        <span className="font-semibold text-base">{request.employee || "-"}</span>
        <div className="flex items-center gap-2">
          <StatusBadge label={request?.Status} />
          {(Comparing.compareStrings(request.Status, "ESCALATED") ||
            Comparing.compareStrings(request.Status, "PENDING")) &&
            FilterStatusTypesForProcessing(FilteredStatusTypes)?.map((item, i) => (
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
        <span className="text-sm text-muted-foreground">{request.odType || request.requestType}</span>
        <span className="text-xs text-muted-foreground">
          {formatDate(request.fromDate)}
          {(request.toDate && request.toDate !== request.fromDate) ? ` - ${formatDate(request.toDate)}` : ""}
        </span>
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
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

// SKELETON CARDS
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

const FilterSkeleton = () => (
  <div className="w-[160px]">
    <Skeleton className="h-9 w-full" />
  </div>
);

const GetActionRequests = () => {
  const [requests, setRequests] = useState(null);
  const { statusTypes, reqCounts, setReqCounts } = useContext(CommonDataContext);
  const [formConfig, setFormConfig] = useState();
  const [dateRange, setDateRange] = useState({
    from: new Date(getFirstOfMonth_ddmmyy()),
    to: new Date(getEndOfMonth_ddmmyy()),
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [statusTypesLoading, setStatusTypesLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    setStatusTypesLoading(!Array.isArray(statusTypes) || statusTypes.length === 0);
  }, [statusTypes]);

  const getConfigData = (type) => {
    let config;
    if (type === "ACCEPTED") config = ApproveConfig;
    else if (type === "ESCALATED") config = EscalateConfig;
    else if (type === "REJECTED") config = RejectConfig;
    else config = {};

    config.onSubmit = async (data) => {
      const res = await odapi.ProcessActionRequests(data);
      if (res.success) {
        showToast(res.message || "Request processed", "success");
      } else {
        showToast(res.error || "Failed to process request", "error");
      }
      await getRequests();
    };
    return config;
  };

  // OD fetch
  const getRequests = async () => {
    setLoading(true);
    setRequests(null);

    try {
        console.log(dateRange)
      const response = await odapi.GetActionRequests({
        fromDate: getDDMMYYDate(dateRange.from),
        toDate: getDDMMYYDate(dateRange.to),
      });
      if (response?.success) {
        setRequests(response.data ?? []);
        // set od counts (if needed)
        if (setReqCounts && typeof calculatePendingAndEscalated === "function") {
          const pendingAndEscalatedSum = calculatePendingAndEscalated(response?.data);
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
  }

  useEffect(() => {
    getRequests();
  }, [refresh]);

  // Map statusTypes in allowed order to find only OD processing statuses
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
  // For the status dropdown (same as thumb, but different context)
  const allStatusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Statuses" },
      ...filteredStatusTypes.map((st) => ({
        value: (st.statusType || "").toUpperCase(),
        label: STATUS_LABELS[(st.statusType || "").toUpperCase()] ||
          (st.statusType.charAt(0).toUpperCase() + st.statusType.slice(1).toLowerCase()),
      })),
    ],
    [filteredStatusTypes]
  );

  const handleStatusChange = (val) => {
    setSelectedStatus(val ? val.toUpperCase() : "ALL");
  };

  // Filtering & ordering requests (pending/escalated first)
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    let results = requests;
    if (selectedStatus !== "ALL") {
      results = results.filter((r) => {
        const stat = (r?.Status || "").toUpperCase();
        return stat === selectedStatus;
      });
    }
    const PENDING = "PENDING";
    const ESCALATED = "ESCALATED";
    const pendingAndEscalated = [];
    const others = [];
    for (const r of results) {
      const stat = (r?.Status || "").toUpperCase();
      if (stat === PENDING || stat === ESCALATED) {
        pendingAndEscalated.push(r);
      } else {
        others.push(r);
      }
    }
    return [...pendingAndEscalated, ...others];
  }, [requests, selectedStatus]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header: */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <h1 className="text-base capitalize text-foreground/80 tracking-tight">
          Your Action Required OD Requests
        </h1>
        <div className="flex gap-4 items-center flex-wrap">
          {statusTypesLoading ? (
            <FilterSkeleton />
          ) : (
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {allStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <MultipleDateSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            showUpcoming={true}
          />
          <Button onClick={() => setRefresh((p) => !p)}>
            <RefreshCcw />
          </Button>
        </div>
      </div>

      {loading || requests === null ? (
        <RequestsSkeleton />
      ) : filteredRequests.length > 0 ? (
        filteredRequests.map((r) => (
          <Card key={r._id} className="w-full mx-auto shadow-sm p-0">
            <CardHeader className=" flex flex-col items-start gap-0 pb-0">
              <SummaryHeader
                request={r}
                FilteredStatusTypes={filteredStatusTypes}
                open={open}
                setOpen={setOpen}
                getConfigData={getConfigData}
                setFormConfig={setFormConfig}
              />
            </CardHeader>
            <CardContent className="py-0">
              <DetailsAccordion request={r} />
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-sm text-muted-foreground py-8 w-full text-center">
          No action required OD requests found for the selected filters.
        </div>
      )}

      <CustomActionDialog config={formConfig} open={open} setOpen={setOpen} />
    </div>
  );
};

export default GetActionRequests;
