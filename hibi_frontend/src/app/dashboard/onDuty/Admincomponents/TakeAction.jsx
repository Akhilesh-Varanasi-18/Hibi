import React, { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import statusApi from "@/Apis/status_Api";
import odapi from "@/Apis/odapi";

const STATUS_ICON_MAP = {
  ACCEPTED: {
    label: "Accept",
    actionReason: "Accepted",
    dialogTitle: "Accept OD Request",
    dialogDescription: "Are you sure you want to accept this OD request? You can provide a reason (optional).",
    buttonVariant: "default",
  },
  REJECTED: {
    label: "Reject",
    actionReason: "Rejected",
    dialogTitle: "Reject OD Request",
    dialogDescription: "Are you sure you want to reject this OD request? Please provide a reason.",
    buttonVariant: "destructive",
  },
  ESCALATED: {
    label: "Escalate",
    actionReason: "Escalated",
    dialogTitle: "Escalate OD Request",
    dialogDescription: "Are you sure you want to escalate this OD request? Please provide a reason.",
    buttonVariant: "outline",
  },
};


const TakeAction = ({ data, statusTypes, refresh, escalate }) => {
  // Show all actions in ACTION_ORDER that are present in statusTypes, including ESCALATED
  var ACTION_ORDER;
  if (escalate) {
    ACTION_ORDER = ["ESCALATED", "REJECTED", "ACCEPTED"];
  }
  else {
    ACTION_ORDER = ["REJECTED", "ACCEPTED"];
  }

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
    if (statusType === "REJECTED" && !reason.trim()) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <span>Reason is required for OD rejection.</span>
          </div>
        ),
      });
      return;
    }
    if (statusType === "ESCALATED" && !reason.trim()) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <span>Reason is required for OD escalation.</span>
          </div>
        ),
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ODRequestId: data._id || data.id,
        statusId: statusId,
        actionReason: reason.trim() || actionReason,
      };
      const res = await odapi.ProcessActionRequests(payload);
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <span>{res?.message || "OD action completed successfully."}</span>
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
              <span>{res?.error || "Failed to process OD action."}</span>
            </div>
          ),
        });
        refresh();
      }
    } catch (err) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <span>Something went wrong with OD management.</span>
          </div>
        ),
      });
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={buttonVariant}
          className="h-8 text-xs min-w-[80px] flex items-center gap-1"
          title={label}
        >
          {label}
        </Button>
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
              OD Reason{" "}
              {statusType === "REJECTED" || statusType === "ESCALATED" ? (
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
                  ? "Enter reason for OD rejection"
                  : statusType === "ESCALATED"
                    ? "Enter reason for OD escalation"
                    : "Enter reason for OD (optional)"
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