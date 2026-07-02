import React, { useState } from "react";
import { MdCancel, MdOutlineCheckCircle } from "react-icons/md";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { useToast } from "@/hooks/use-toast";
import statusApi from "@/Apis/status_Api";
import { Thumb_Apis } from "@/Apis/Thumb_Apis";

// Add ESCALATED action
const STATUS_ICON_MAP = {
  ACCEPTED: {
    icon: MdOutlineCheckCircle,
    color: "#22c55e", // green-500
    label: "Accept",
    actionReason: "Accepted",
    dialogTitle: "Accept Request",
    dialogDescription: "Are you sure you want to accept this request? You can provide a reason (optional).",
    buttonVariant: "default",
  },
  REJECTED: {
    icon: MdCancel,
    color: "#ef4444", // red-500
    label: "Reject",
    actionReason: "Rejected",
    dialogTitle: "Reject Request",
    dialogDescription: "Are you sure you want to reject this request? Please provide a reason.",
    buttonVariant: "destructive",
  },
  ESCALATED: {
    icon: MdCancel,
    color: "#f59e42", // orange-500
    label: "Escalate",
    actionReason: "Escalated",
    dialogTitle: "Escalate Request",
    dialogDescription: "Are you sure you want to escalate this request? Please provide a reason.",
    buttonVariant: "outline",
  },
};

// Show all three actions, with ESCALATED first
const ACTION_ORDER = ["ESCALATED", "REJECTED", "ACCEPTED"];

const TakeAction = ({ data, statusTypes, refresh }) => {
  // Show all actions in ACTION_ORDER that are present in statusTypes, including ESCALATED
  const filteredStatusTypes = ACTION_ORDER
    .map((type) => statusTypes?.find((st) => st.statusType === type))
    .filter(Boolean);

  return (
    <div className="flex gap-2 items-center justify-end">
      {filteredStatusTypes.map((st) => (
        <TakeActionDialog
          key={st._id}
          statusType={st.statusType}
          statusId={st._id}
          data={data}
          icon={STATUS_ICON_MAP[st.statusType].icon}
          color={STATUS_ICON_MAP[st.statusType].color}
          label={STATUS_ICON_MAP[st.statusType].label}
          actionReason={STATUS_ICON_MAP[st.statusType].actionReason}
          dialogTitle={STATUS_ICON_MAP[st.statusType].dialogTitle}
          dialogDescription={STATUS_ICON_MAP[st.statusType].dialogDescription}
          buttonVariant={STATUS_ICON_MAP[st.statusType].buttonVariant}
          refresh={refresh}
        />
      ))}
    </div>
  );
};

function TakeActionDialog({
  statusType,
  statusId,
  data,
  icon: Icon,
  color,
  label,
  actionReason,
  dialogTitle,
  dialogDescription,
  buttonVariant,
  refresh,
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Only close dialog, don't refresh here
  const handleDialogClose = (nextOpen) => {
    setOpen(nextOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      (statusType === "REJECTED" || statusType === "ESCALATED") &&
      !reason.trim()
    ) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>
            <span>
              Reason is required for {statusType === "REJECTED" ? "rejection" : "escalation"}.
            </span>
          </div>
        ),
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        thumbRequestId: data._id || data.id,
        statusId: statusId,
        actionReason: reason.trim() || actionReason,
      };
      const res = await Thumb_Apis.processThumbRequest(payload);
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>{res?.message || "Action completed successfully."}</span>
            </div>
          ),
        });
        setOpen(false);
        setReason("");
        refresh(); // Always refresh immediately after success
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{res?.error || "Failed to process action."}</span>
            </div>
          ),
        });
      }
    } catch (err) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>Something went wrong.</span>
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogTrigger asChild>
        {statusType === "ACCEPTED" ? (
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs min-w-[80px] flex items-center gap-1"
            style={{ color: undefined }}
            title={label}
          >
            {label}
          </Button>
        ) : statusType === "REJECTED" ? (
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs min-w-[80px] flex items-center gap-1"
            style={{ color: undefined }}
            title={label}
          >
            {label}
          </Button>
        ) : statusType === "ESCALATED" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs min-w-[80px] flex items-center gap-1"
            style={{ color: undefined }}
            title={label}
          >
            {label}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            style={{ color, fontSize: 22, minWidth: 36, minHeight: 36 }}
            title={label}
          >
            {/* <Icon /> */}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {dialogDescription}
            </div>
          </AlertDialogHeader>
          <div>
            <Label
              htmlFor="actionReason"
              className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-1"
            >
              Reason{" "}
              {(statusType === "REJECTED" || statusType === "ESCALATED") ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-muted-foreground">(optional)</span>
              )}
            </Label>
            <Textarea
              id="actionReason"
              name="actionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder={
                statusType === "REJECTED"
                  ? "Enter reason for rejection"
                  : statusType === "ESCALATED"
                  ? "Enter reason for escalation"
                  : "Enter reason (optional)"
              }
              required={statusType === "REJECTED" || statusType === "ESCALATED"}
              className="resize-none min-h-[64px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="submit"
              size="sm"
              variant={buttonVariant}
              className="h-8 text-xs min-w-[80px]"
              disabled={loading}
            >
              {loading ? "Submitting..." : label}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TakeAction;