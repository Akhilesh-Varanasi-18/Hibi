"use client";
import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Thumb_Apis } from "@/Apis/Thumb_Apis";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CommonDataContext } from "../context/CommonDataContext";
import { FilterStatusTypesForProcessing } from "@/utils/FilterStatusTypes";
import { CustomActionDialog } from "@/app/components/ReusableComponents/CustomActionDialog";
import { ApproveConfig, EscalateConfig, RejectConfig } from "@/utils/ProcessRequestsConfig";
import { showToast } from "@/lib/ToastService";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { RefreshCcw } from "lucide-react";
import ProcessRequestIcon from "@/components/ui/ProcessRequestIcon";
import { getDDMMYYDate, getEndOfMonth_ddmmyy, getFirstOfMonth_ddmmyy } from "@/utils/DateFunctions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/Approval";
import Comparing from "@/utils/CommonFunctionality";

// This is just a simple animated placeholder for loading states
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`}></div>
);

// Helper to nicely format a date string
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Card section showing summary up top (employee, current status, action buttons for each further possible action)
const SummaryHeader = ({ request, FilteredStatusTypes, setOpen, setFormConfig, getConfigData }) => {
  // On action icon click, open the dialog with config for this action and request
  const handleDialogOpen = async (type, statusId, requestId) => {
    // 2) Here we are building the config for the dialog. This contains all necessary dialog config (like title, description, etc)
    const config = getConfigData(type);
    config.ExtraValues = { statusId, thumbRequestId: requestId };
    setFormConfig(config);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="font-semibold text-base">{request.employee || "-"}</span>
        <div className="flex items-center gap-2">
          <StatusBadge label={request?.Status} />
          {/* Show "action" icons (accept, reject...) only when status is escalated or pending */}
          {(Comparing.compareStrings(request.Status, "ESCALATED") ||
            Comparing.compareStrings(request.Status, "PENDING")) &&
            FilteredStatusTypes?.map((item, i) => (
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
        <span className="text-sm text-muted-foreground">{request.punchType}</span>
        <span className="text-xs text-muted-foreground">{formatDate(request.thumbDate)}</span>
      </div>
    </div>
  );
};

// Accordion section to show request details (reason, status, action reason)
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

const ALLOWED_STATUS_FILTERS = ["ACCEPTED", "REJECTED", "CANCELLED", "PENDING", "ESCALATED"];

const GetActionRequests = () => {
  const [requests, setRequests] = useState(null);
  const { statusTypes } = useContext(CommonDataContext);
  const [formConfig, setFormConfig] = useState();
  const [dateRange, setDateRange] = useState({
    from: new Date(getFirstOfMonth_ddmmyy()),
    to: new Date(getEndOfMonth_ddmmyy()),
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [statusTypesLoading, setStatusTypesLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // 1) Here we check if the status types array is ready. If not, we show a skeleton for the status filter dropdown.
  useEffect(() => {
    setStatusTypesLoading(!Array.isArray(statusTypes) || statusTypes.length === 0);
  }, [statusTypes]);

  // 2) This function builds the dialog configuration for processing a request (accept/reject/escalate).
  // The config contains things like dialog title, description, which fields, and what to do on submit.
  const getConfigData = (type) => {
    let config;
    if (type === "ACCEPTED") config = ApproveConfig;
    else if (type === "ESCALATED") config = EscalateConfig;
    else if (type === "REJECTED") config = RejectConfig;
    else config = {};

    // The onSubmit handler will process the actual API call and refresh the list if successful.
    config.onSubmit = async (data) => {
      const res = await Thumb_Apis.processThumbRequest(data);
      if (res.success) {
        showToast(res.message || "Request processed", "success");
      } else {
        showToast(res.error || "Failed to process request", "error");
      }
      await getRequests();
    };
    return config;
  };

  // Fetch action-required thumb requests for the selected date range
  const getRequests = useCallback(async () => {
    setLoading(true);
    setRequests(null);
    try {
      const res = await Thumb_Apis.getActionRequiredThumbRequests({
        fromDate: getDDMMYYDate(dateRange.from),
        toDate: getDDMMYYDate(dateRange.to),
      });
      if (res?.success) setRequests(res.data?.data ?? []);
      else setRequests([]);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  // This maps allowed status types in order and builds dropdown options using only those, filtered from all status types in context.
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

  // For the status dropdown - one "All" option + available statuses from filteredStatusTypes (with capitalized display)
  const allStatusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Statuses" },
      ...filteredStatusTypes.map((st) => ({
        value: (st.statusType || "").toUpperCase(),
        label:
          st.statusType.charAt(0).toUpperCase() +
          st.statusType.slice(1).toLowerCase(),
      })),
    ],
    [filteredStatusTypes]
  );

  // 1) We are filtering all requests so that pending and escalated requests appear at the top, and others below.
  //    Additionally, if user selects a specific status, only those requests will show (but still with pending/escalated first).
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    // If user picks a status filter, only requests with that status will show
    let results = requests;
    if (selectedStatus !== "ALL") {
      results = results.filter((r) => {
        const stat = (r?.Status || "").toUpperCase();
        return stat === selectedStatus;
      });
    }
    // Now we want pending and escalated requests showing at the top for action
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

  // For the status filter dropdown
  const handleStatusChange = (val) => {
    setSelectedStatus(val ? val.toUpperCase() : "ALL");
  };

  // The default skeleton cards shown when requests are loading
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

  // This is the skeleton for the filter dropdown before status types load
  const FilterSkeleton = () => (
    <div className="w-[160px]">
      <Skeleton className="h-9 w-full" />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* The header section including filters and refresh */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <h1 className="text-base capitalize text-foreground/80 tracking-tight">
          Your Action Required Requests
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
            showUpcoming={false}
          />
          <Button onClick={getRequests}>
            <RefreshCcw />
          </Button>
        </div>
      </div>

      {/* Here's the main list of requests (or skeletons if loading).
          We show requests, or a 'no data found' message if empty. */}
      {loading || requests === null ? (
        <RequestsSkeleton />
      ) : filteredRequests.length > 0 ? (
        filteredRequests.map((r) => (
          <Card key={r._id} className="w-full mx-auto shadow-sm p-0">
            <CardHeader className=" flex flex-col items-start gap-0 pb-0">
              <SummaryHeader
                request={r}
                FilteredStatusTypes={FilterStatusTypesForProcessing(statusTypes)}
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
          No action required requests found for the selected filters.
        </div>
      )}

      {/* Dialog used for actions (accept/reject/escalate), config set via state */}
      <CustomActionDialog config={formConfig} open={open} setOpen={setOpen} />
    </div>
  );
};

export default GetActionRequests;
