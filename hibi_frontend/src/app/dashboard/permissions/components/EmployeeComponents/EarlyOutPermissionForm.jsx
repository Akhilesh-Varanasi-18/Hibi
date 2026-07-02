"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import permissionsAPI from "@/Apis/Permissions_APIs";
import { getFirstOfMonth_ddmmyy, toLocalISOString } from "@/utils/DateFunctions"
import { showToast } from "@/lib/ToastService";

const EarlyOutPermissionForm = ({ id, refresh, shiftDetails }) => {
  const shift = shiftDetails?.data || null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!shift) return;
    const [eH, eM] = shift.endTime.split(":").map(Number);
    const sH = eH - 1;
    setStartTime(`${String(sH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`);
    setEndTime(`${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`);
  }, [shift]);

  const clearForm = () => {
    setReason("");
    setError("");
    setSuccess(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return setError("Please enter a reason");
    setLoading(true);

    const formData = {
      startTime: toLocalISOString(date, startTime),
      endTime: toLocalISOString(date, endTime),
      date: toLocalISOString(date, startTime),
      permissionReason: reason,
      permissionTypeId: id,
      totalHours: "1",
      isFirstHalf: false,
    };

    try {
      const res = await permissionsAPI.AddNewPermissionRequest(formData);
      if (res?.success) {
        showToast("Request Sent", "success");
        setDialogOpen(false);
        refresh();
        clearForm();
        setSuccess(true);
      } else {
        showToast(res?.error || "Failed to Apply EarlyOut Permission", "error");
      }
    } catch {
      showToast("Failed to Apply EarlyOut Permission", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-neutral-200 dark:border-neutral-800">
          New Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0">
        <form onSubmit={onSubmit} className="flex flex-col max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-bold">New EARLYOUT Permission Request</DialogTitle>
            <DialogDescription>Leave 1 hour early from shift end.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 px-6 pb-2 pt-2 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                    fromDate={new Date(getFirstOfMonth_ddmmyy())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Early Departure Slot</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium">
                  From <span className="font-mono">{startTime}</span> to <span className="font-mono">{endTime}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can leave 1 hour early.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter reason"
              />
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            {/* {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">Request submitted!</div>} */}
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={clearForm}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EarlyOutPermissionForm;
