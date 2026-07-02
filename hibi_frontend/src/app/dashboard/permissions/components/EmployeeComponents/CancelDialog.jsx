import React, { useState } from "react";
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
import permissionsAPI from "@/Apis/Permissions_APIs";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

const CancelDialog = ({
  permissionRequestId,
  refresh,
  label = "Cancel",
  variant = "destructive",
  dialogTitle = "Cancel Permission Request",
  dialogDescription = "Are you sure you want to cancel this permission request?",
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!permissionRequestId) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>{" "}
            <span>Permission Request ID is required.</span>
          </div>
        ),
      });
      setLoading(false);
      return;
    }

    // Do NOT send actionReason
    const formData = {
      permissionRequestId,
    };

    const res = await permissionsAPI.cancelPermissionRequest(formData);
    if (res.success) {
      if (typeof refresh === "function") refresh();
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>{" "}
            <span>{res?.message || "Request cancelled successfully."}</span>
          </div>
        ),
      });
      setOpen(false); // Close the dialog after success
    } else {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>{" "}
            <span>{res?.error || "Failed to cancel request."}</span>
          </div>
        ),
      });
    }
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={variant}
          className="text-red-500 bg-red-100 dark:bg-red-900/20"
          onClick={() => setOpen(true)}
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
          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Close
            </AlertDialogCancel>
            <Button
              type="submit"
              size="sm"
              variant={variant}
              className="h-8 text-xs min-w-[80px]"
              disabled={loading}
            >
              {loading ? "Cancelling..." : label}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelDialog;
