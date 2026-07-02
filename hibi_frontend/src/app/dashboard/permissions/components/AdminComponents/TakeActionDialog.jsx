import React, { useState /*, useEffect*/ } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import permissionsAPI from "@/Apis/Permissions_APIs";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

const TakeActionDialog = ({
  // flow,
  // notifyToRes,
  refresh,
  status,
  label,
  variant,
  dialogTitle,
  dialogDescription,
  handleActionTaken,
  permissionRequestId,
  statusId,
  employee,
}) => {
  // Form state

  // --- notifyTo related code commented out below ---
  // const [notifyTo, setNotifyTo] = useState(""); // This will hold the _id of the selected person
  // const [notifyToList, setNotifyToList] = useState([]);
  // const [notifyToError, setNotifyToError] = useState(null);
  // const [showEscalated, setShowEscalated] = useState(true);
  const allowedStatuses = ["ACCEPTED", "REJECTED", "ESCALATED"];
  const statusType = (status?.statusType || status)?.toUpperCase?.() || "";

  if (!allowedStatuses.includes(statusType)) {
    return null;
  }
  const [loading, setLoading] = useState(false);

  // Reason state: only required for rejecting
  const [approverReason, setApproverReason] = useState("");

  // --- notifyTo useEffect commented out below ---
  /*
  useEffect(() => {
    if (status?.statusType === "ESCALATED") {
      if (notifyToRes?.success && Array.isArray(notifyToRes.data)) {
        setNotifyToList(notifyToRes.data);
        setNotifyToError(null);
        setShowEscalated(employee !== notifyToRes?.data[0].notifyToName);
      } else {
        setNotifyToList([]);
        setNotifyToError(
          notifyToRes?.error ||
            notifyToRes?.message ||
            "Failed to fetch notify list."
        );
      }
    }
  }, [status, notifyToRes, employee, flow, label]);
  */

  // Form submit handler
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // If rejecting, reason is required
    if (
      label &&
      label.toLowerCase().includes("reject") &&
      (!approverReason || approverReason.trim() === "")
    ) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>{" "}
            <span>Reason is required for rejection.</span>
          </div>
        ),
      });
      setLoading(false);
      return;
    }

    const formData = {
      permissionRequestId: permissionRequestId,
      statusId: statusId,
      // notifyTo: status?.statusType === "ESCALATED" ? notifyTo : "",
      approverReason:
        label && label.toLowerCase().includes("reject") ? approverReason : "",
    };
    // console.log(formData)
    const res = await permissionsAPI.processPermissionRequest(formData);
    if (res.success) {
      refresh();
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>{" "}
            <span>{res?.message}</span>
          </div>
        ),
      });
      handleActionTaken();
    } else {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>{" "}
            <span>{res?.error}</span>
          </div>
        ),
      });
    }
    setLoading(false);
  };

  // --- notifyTo logic for hiding escalate button commented out below ---
  // If showEscalated is false and label is "Escalate", do not render the action button/dialog at all

  return (
    <>
      {/* {label === "Escalate" && showEscalated === false ? (
        <></>
      ) : ( */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant={variant}
            className="h-8 text-xs min-w-[80px]"
          >
            {label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {dialogDescription}
              </div>
            </AlertDialogHeader>
            {/* Only show notifyTo if statusType is ESCALATED */}
            {/* --- notifyTo UI commented out below ---
              {status?.statusType === "ESCALATED" && (
                <div className="space-y-1">
                  <Label htmlFor="notifyTo" className="text-xs font-semibold">
                    Notify To *
                  </Label>
                  {notifyToError ? (
                    <div className="px-3 py-2 text-sm text-red-500">{notifyToError}</div>
                  ) : notifyToList.length === 1 ? (
                    <div className="px-3 py-2 text-sm text-green-700 bg-green-50 rounded">
                      Notifying to:{" "}
                      <span className="font-semibold">
                        {notifyToList[0].notifyToName ||
                          notifyToList[0].name ||
                          notifyToList[0].fullName ||
                          notifyToList[0].displayName ||
                          JSON.stringify(notifyToList[0])}
                      </span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-zinc-500">
                      No one to notify. You cannot submit a request.
                    </div>
                  )}
                   If there is exactly one notifyTo, set notifyTo automatically 
                  {notifyToList.length === 1 && !notifyTo && (
                    setNotifyTo(
                      notifyToList[0].notifyToId ||
                        notifyToList[0].id ||
                        ""
                    )
                  )}
                </div>
              )} 
              --- end notifyTo UI --- */}
            {/* Reason field: only required for rejection */}
            {label && label.toLowerCase().includes("reject") && (
              <div>
                <Label
                  htmlFor="approverReason"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-1"
                >
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="approverReason"
                  name="approverReason"
                  value={approverReason}
                  onChange={(e) => setApproverReason(e.target.value)}
                  disabled={loading}
                  placeholder="Enter reason for rejection"
                  required
                  className="resize-none min-h-[64px]"
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={loading}>
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                size="sm"
                variant={variant}
                className="h-8 text-xs min-w-[80px]"
                // disabled={
                //   loading ||
                //   (status?.statusType === "ESCALATED" &&
                //     (!notifyTo || notifyToList.length !== 1))
                // }
                disabled={loading}
              >
                {loading ? "Submitting..." : label}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      {/* )} */}
    </>
  );
};

export default TakeActionDialog;
