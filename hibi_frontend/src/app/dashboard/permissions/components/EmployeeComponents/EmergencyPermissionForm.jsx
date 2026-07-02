"use client";
import React, { useState } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import permissionsAPI from "@/Apis/Permissions_APIs";
import { useToast } from "@/hooks/use-toast";
import { getFirstOfMonth_ddmmyy, toLocalISOString } from "@/utils/DateFunctions";
import { showToast } from "@/lib/ToastService";

const EmergencyPermissionForm = ({ id, refresh, shiftDetails }) => {
  const { toast } = useToast();
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

  const clearForm = () => {
    setStartTime("");
    setEndTime("");
    setReason("");
    setError("");
    setSuccess(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime || !reason) return setError("All fields required");
    setLoading(true);

    const formData = {
      startTime: toLocalISOString(date, startTime),
      endTime: toLocalISOString(date, endTime),
      date: toLocalISOString(date, startTime),
      permissionReason: reason,
      permissionTypeId: id,
      totalHours: "1",
      isFirstHalf: startTime < shift.breakTimeStart,
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
        showToast("Failed to Apply Emergency Permission", "error");
    //   setError("Failed to submit");
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
            <DialogTitle className="text-lg font-bold">New EMERGENCY Permission Request</DialogTitle>
            <DialogDescription>Set your custom start and end times.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 px-6 pb-2 pt-2 space-y-4">
            {/* Date */}
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

            {/* Time Inputs */}
            <div>
              <Label className="text-xs font-semibold">Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={shift?.startTime}
                max={shift?.endTime}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
                max={shift?.endTime}
                required
              />
            </div>

            {/* Reason */}
            <div>
              <Label className="text-xs font-semibold">Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                placeholder="Enter reason"
                required
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

export default EmergencyPermissionForm;
