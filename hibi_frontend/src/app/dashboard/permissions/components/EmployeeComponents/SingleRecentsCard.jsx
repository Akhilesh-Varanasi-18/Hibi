"use client";
import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Approved,
  Pending,
  Rejected,
  Escalated,
} from "@/components/ui/Approval";
import moment from "moment-timezone";
import { Clock, Zap, Home } from "lucide-react";
import permissionsAPI from "@/Apis/Permissions_APIs";
import WFHApis from "@/Apis/WFHApis";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
} from "@/components/ui/timeline";
import Comparing from "@/utils/CommonFunctionality";
import { CommonDataContext } from "@/app/dashboard/context/CommonDataContext";
import { CustomActionDialog } from "@/app/components/ReusableComponents/CustomActionDialog";
import { Button } from "@/components/ui/button";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { CancelConfig } from "@/utils/ProcessRequestsConfig";
import { useToast } from "@/hooks/use-toast";
import { formatDateRangeToIST, formatDateToIST, getDDMMYYDate } from "@/utils/DateFunctions";
import { getPermissionIconAndBg, getStatusComponent, getWFHIconAndBg } from "@/utils/PermissionsIcons";


const formatTime = (t) => {
  return t ? moment.utc(t).format("hh:mm A") : "";
};


// Component
const SingleRecentsCard = ({ approval, refresh, isWFH }) => {
  const { toast } = useToast();
  useContext(CommonDataContext); // statusTypes not used
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState([]);

  // Toast Function
  const showToast = useCallback(
    (success, message) => {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className={`text-white ${success ? "bg-green-500" : "bg-red-500"} rounded-full text-lg`}>
              {success ? <TiTick /> : <RxCross2 />}
            </div>
            <span>{message}</span>
          </div>
        ),
      });
    },
    [toast]
  );

  // Cancel Handler with closure
  const handleCancel = useCallback(
    async ({ apiFunc, data, refresh, setOpen }) => {
      const res = await apiFunc(data);
      if (res?.success) {
        showToast(true, res?.message || "Request cancelled successfully.");
        if (typeof refresh === "function") refresh();
        setOpen(false);
      } else {
        showToast(false, res?.error || "Failed to cancel request.");
      }
    },
    [showToast]
  );

  // Approval flow (permission only)
  useEffect(() => {
    let mounted = true;
    if (!isWFH && approval && approval._id) {
      (async () => {
        try {
          const res = await permissionsAPI.getPermissionRequestFlow(approval._id);
          if (mounted) setFlow(res?.success ? res.data || [] : []);
        } catch {
          if (mounted) setFlow([]);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [approval?._id, isWFH]);

  // WFH Card
  if (isWFH) {
    return (
      <div className="flex flex-col p-2 sm:p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 w-full">
            {getWFHIconAndBg()}
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-neutral-800 dark:text-neutral-200">
                Work From Home
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                {approval?.wfhReason && (
                  <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {approval.wfhReason}
                  </span>
                )}

                {approval?.totalDays && (
                  <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-500">
                    {approval.totalDays} Day{approval.totalDays > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {approval?.notifyTo && (
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 lowercase">
                  notify to : <span className="opacity-70">{approval?.notifyTo?.join(" , ")}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded font-medium">
                  <Clock className="h-3 w-3" />
                  {formatDateRangeToIST(approval.startDate, approval.endDate)}
                  {/* <br /> */}
                  {/* {approval.startDate + " - " + approval.endDate} */}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-3 justify-end sm:ml-2">
            {getStatusComponent(approval?.Status)}
            {(Comparing.compareStrings(approval?.Status, "PENDING") ||
              Comparing.compareStrings(approval?.Status, "ESCALATED")) && (
                <div>
                  <Button onClick={() => setOpen(true)}>Cancel</Button>
                  <CustomActionDialog
                    open={open}
                    setOpen={setOpen}
                    config={{
                      ...CancelConfig,
                      ExtraValues: { wfhRequestId: approval._id },
                      onSubmit: (data) =>
                        handleCancel({
                          apiFunc: WFHApis.CancelWFH,
                          data,
                          refresh,
                          setOpen,
                        }),
                    }}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  // Permission Card
  return (
    <div className="flex flex-col p-2 sm:p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 w-full">
          {getPermissionIconAndBg(approval?.permissionType)}
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-medium text-neutral-800 dark:text-neutral-200">
              {approval?.permissionType
                ? approval.permissionType.charAt(0).toUpperCase() +
                approval.permissionType.slice(1).toLowerCase()
                : "Permission"}
            </p>

            {approval?.permissionReason && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {approval.permissionReason}
              </p>
            )}
            {approval?.notifyTo && (
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 lowercase">
                notify to : <span className="opacity-70">{approval?.notifyTo?.join(" , ")}</span>
              </p>
            )}
            {(approval?.startTime || approval?.endTime) && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded font-medium">
                  <Clock className="h-3 w-3" />
                  {formatTime(approval.startTime)} - {formatTime(approval.endTime)}
                </span>
                <span className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500">
                  {getDDMMYYDate(approval.startTime)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-3 justify-end sm:ml-2">
          {getStatusComponent(approval?.Status)}
          {(Comparing.compareStrings(approval?.Status, "PENDING") ||
            Comparing.compareStrings(approval?.Status, "ESCALATED")) && (
              <div>
                <Button onClick={() => setOpen(true)}>Cancel</Button>
                {/* cancel dialog */}
                <CustomActionDialog
                  open={open}
                  setOpen={setOpen}
                  config={{
                    ...CancelConfig,
                    ExtraValues: { permissionRequestId: approval._id },
                    onSubmit: (data) =>
                      handleCancel({
                        apiFunc: permissionsAPI.cancelPermissionRequest,
                        data,
                        refresh,
                        setOpen,
                      }),
                  }}
                />
              </div>
            )}
        </div>
      </div>
      {/* Approval Flow */}
      {Array.isArray(flow) && flow.length > 1 && (
        <div className="w-full overflow-x-auto px-4">
          <Timeline
            orientation="horizontal"
            className="mt-4 min-w-[500px] flex-nowrap"
            style={{ minWidth: flow.length * 180 + "px" }}
          >
            {flow.map((item, i) => (
              <TimelineItem
                key={i}
                step={i + 1}
                className="flex flex-col items-center min-w-[160px] px-2"
                style={{ flex: "0 0 160px" }}
              >
                <TimelineHeader className="flex flex-col items-center w-full">
                  <TimelineDate className="text-xs text-center">
                    {getDDMMYYDate(item.sendAt)}
                  </TimelineDate>
                  <TimelineTitle className="!text-[10px] mt-2 text-center">
                    {(item.actionedBy || "").slice(0, 18)}
                    {item.actionedBy && item.actionedBy.length > 17 && "..."}
                  </TimelineTitle>
                  <TimelineIndicator className="mt-2" />
                </TimelineHeader>
                <TimelineContent className="w-full flex flex-col items-center mt-2">
                  {item.actionReason && (
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 italic text-center break-words w-full">
                      &quot;{item.actionReason}&quot;
                    </span>
                  )}
                  <div className="mt-2 flex justify-center w-full">
                    {getStatusComponent(item.status)}
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      )}
    </div>
  );
};

export default SingleRecentsCard;
