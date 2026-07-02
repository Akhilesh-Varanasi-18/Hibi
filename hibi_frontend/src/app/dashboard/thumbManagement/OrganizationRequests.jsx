"use client";
import { Thumb_Apis } from "@/Apis/Thumb_Apis";
import { getDDMMYYDate, getEndOfYear_ddmmyy, getFirstOfYear_ddmmyy } from "@/utils/DateFunctions";
import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CommonDataContext } from "../context/CommonDataContext";
import { FilterStatusTypesForCEOandCOO } from "@/utils/FilterStatusTypes";
import { CustomActionDialog } from "@/app/components/ReusableComponents/CustomActionDialog";
import { ApproveConfig, EscalateConfig, RejectConfig } from "@/utils/ProcessRequestsConfig";
import { showToast } from "@/lib/ToastService";
import MultipleDateSelector from "@/app/components/ReusableComponents/MultipleDateSelector";
import { RefreshCcw } from "lucide-react";
import ProcessRequestIcon from "@/components/ui/ProcessRequestIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/Approval";
import Comparing from "@/utils/CommonFunctionality";

// Just a basic animated skeleton placeholder for loading states
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`}></div>
);

// Converts date string to something friendlier like "Jan 2, 2024"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// This renders the top part of the card, including status, actions (if allowed), and requestor
const SummaryHeader = ({ request, FilteredStatusTypes, setOpen, setFormConfig, getConfigData }) => {
  // This is called when a dialog should open for an action (approve, reject, escalate)
  const handleDialogOpen = (type, statusId, requestId) => {
    const config = getConfigData(type); // Each dialog (approve, escalate, reject) gets its config here
    config.ExtraValues = { statusId, thumbRequestId: requestId };
    setFormConfig(config);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="font-semibold text-base">{request.requestedBy || "-"}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge label={request?.Status || request?.status} />
          {/* if request is pending or escalated, show action buttons for each available action */}
          {(Comparing.compareStrings(request?.Status || request?.status, "ESCALATED") ||
            Comparing.compareStrings(request?.Status || request?.status, "PENDING")) &&
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
        <span className="text-sm text-muted-foreground">
          {request.punchType} - {request.requestFor}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(request.thumbDate)}</span>
      </div>
    </div>
  );
};

// This accordion shows more details including reason etc, when opened
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
            <span className="font-medium text-foreground/60">Status:</span> {request.status || "-"}
          </div>
          {request.actionReason && (
            <div>
              <span className="font-medium text-foreground/60">Action Reason:</span> {request.actionReason}
            </div>
          )}
          <div>
            <span className="font-medium text-foreground/60">Actioned By:</span> {request.actionedBy || "-"}
          </div>
          {Array.isArray(request.notifyTo) && request.notifyTo.length > 0 && (
            <div>
              <span className="font-medium text-foreground/60">Notify To:</span> {request.notifyTo.join(", ")}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

// Only these statuses can be used as filters (as dropdown options)
const ALLOWED_STATUS_FILTERS = ["ACCEPTED", "REJECTED", "ESCALATED", "PENDING", "CANCELLED"];

const OrganizationRequests = () => {
  const { statusTypes } = useContext(CommonDataContext);
  const [requests, setRequests] = useState(null);
  const [formConfig, setFormConfig] = useState();
  const [dateRange, setDateRange] = useState({
    from: new Date(getFirstOfYear_ddmmyy()),
    to: new Date(getEndOfYear_ddmmyy()),
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Here we build the dialog configs (title, submit, etc) for approve/reject/escalate
  const getConfigData = (type) => {
    let config =
      type === "ACCEPTED"
        ? ApproveConfig
        : type === "ESCALATED"
        ? EscalateConfig
        : type === "REJECTED"
        ? RejectConfig
        : {};
    // Attach dialog submit callback (actually calls API and triggers reload etc)
    config.onSubmit = async (data) => {
      const res = await Thumb_Apis.processThumbRequest(data);
      showToast(
        res.success ? res.message || "Request processed" : res.error || "Failed to process",
        res.success ? "success" : "error"
      );
      await getRequests();
    };
    return config;
  };

  // This makes the API call to get the requests visible in this tab
  const getRequests = useCallback(async () => {
    setLoading(true);
    setRequests(null);
    try {
      const res = await Thumb_Apis.getOrganizationActionRequiredThumbRequests({
        fromDate: getDDMMYYDate(dateRange.from),
        toDate: getDDMMYYDate(dateRange.to),
      });
      if (res?.data) setRequests(res.data);
      else setRequests([]);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  // Fetch data when date range or filters change
  useEffect(() => {
    getRequests();
  }, [getRequests]);

  // Here we only show statuses allowed for CEO/COO, turned into dropdown options
  const filteredStatusTypes = useMemo(
    () =>
      Array.isArray(statusTypes)
        ? ALLOWED_STATUS_FILTERS.map((allowed) =>
            statusTypes.find((st) => (st.statusType || "").toUpperCase() === allowed)
          ).filter(Boolean)
        : [],
    [statusTypes]
  );

  // Make our dropdown options (starts with "All Statuses", then the allowed ones)
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

  // Filter and order so that "pending" and "escalated" are always at the top, the rest after
  // 1) We first filter by status if user chose a dropdown status
  // 2) Then we collect all PENDING and ESCALATED at the top, everything else goes after
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    let results = requests;
    if (selectedStatus !== "ALL") {
      results = results.filter((r) => {
        const stat = (r?.Status || r?.status || "").toUpperCase();
        return stat === selectedStatus;
      });
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
    // In summary: show pending and escalated requests first, then others.
    return [...pendingAndEscalated, ...others];
  }, [requests, selectedStatus]);

  // User changes the status dropdown (we always keep it upper-case in state)
  const handleStatusChange = (val) => setSelectedStatus(val ? val.toUpperCase() : "ALL");

  // Just render some blank skeleton cards while loading
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

  // While status types load, this is the placeholder filter
  const FilterSkeleton = () => <div className="w-[160px]"><Skeleton className="h-9 w-full" /></div>;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* The top area: title, status filter, date selector, refresh */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <h1 className="text-base capitalize text-foreground/80 tracking-tight">Organization Requests</h1>
        <div className="flex gap-4 items-center flex-wrap">
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
          <MultipleDateSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            showUpcoming={false}
          />
          <Button onClick={getRequests}><RefreshCcw /></Button>
        </div>
      </div>

      {/* This is the main area: cards for each request, or loading, or empty */}
      {loading || requests === null ? (
        <RequestsSkeleton />
      ) : filteredRequests.length > 0 ? (
        filteredRequests.map((r) => (
          <Card key={r._id} className="w-full mx-auto shadow-sm">
            <CardHeader className=" flex flex-col items-start gap-0 pb-0">
              <SummaryHeader
                request={r}
                FilteredStatusTypes={FilterStatusTypesForCEOandCOO(statusTypes)}
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
          No requests found for selected filters.
        </div>
      )}

      {/* This is the dialog for taking action (approve/reject/escalate), controlled by state & config */}
      <CustomActionDialog config={formConfig} open={open} setOpen={setOpen} />
    </div>
  );
};

export default OrganizationRequests;
