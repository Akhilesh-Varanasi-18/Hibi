"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { getFirstOfMonth_ddmmyy, toLocalISOString } from "@/utils/DateFunctions";
import permissionsAPI from "@/Apis/Permissions_APIs";
import { useToast } from "@/hooks/use-toast";
import { showToast } from "@/lib/ToastService";

const GeneralPermissionForm = ({ id, refresh, shiftDetails }) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [shift, setShift] = useState(shiftDetails?.data || null);

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState("");

  const clearForm = useCallback(() => {
    setSelectedSlot(null);
    setShowCustomTime(false);
    setStartTime("");
    setEndTime("");
    setReason("");
    setError("");
    setSuccess(false);
    setTimeError("");
  }, []);

  useEffect(() => {
    if (shiftDetails) setShift(shiftDetails.data);
  }, [shiftDetails]);

  const generateSlots = useCallback(() => {
    if (!shift) return [];
    const [startH] = shift.startTime.split(":").map(Number);
    const [endH] = shift.endTime.split(":").map(Number);
    const slotsArr = [];
    for (let h = startH; h < endH; h++) {
      const s = `${String(h).padStart(2, "0")}:00`;
      const e = `${String(h + 1).padStart(2, "0")}:00`;
      slotsArr.push({ start: s, end: e, label: `${s} - ${e}` });
    }
    setSlots(slotsArr);
  }, [shift]);

  useEffect(() => generateSlots(), [generateSlots]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStartTime(slot.start);
    setEndTime(slot.end);
    setShowCustomTime(false);
  };

  const handleCustomTimeChange = (e) => {
    const val = e.target.value;
    setStartTime(val);
    if (val) {
      const [h, m] = val.split(":").map(Number);
      setEndTime(`${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !startTime) return setError("Please fill all fields");
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
      showToast("Failed to Apply General Permission", "error");
      setError("Failed to submit request");
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
            <DialogTitle className="text-lg font-bold">New GENERAL Permission Request</DialogTitle>
            <DialogDescription>Select a 1-hour slot or set custom time.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 px-6 pb-2 pt-2 space-y-4">
            {/* Date Picker */}
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

            {/* Slot Selector */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold">Select Time Slot (1 hour)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                {slots.map((slot, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                    onClick={() => handleSlotSelect(slot)}
                    className="h-10 text-xs w-full"
                    disabled={loading}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>

              {/* Custom Time Toggle */}
              <Button
                type="button"
                variant={showCustomTime ? "default" : "outline"}
                onClick={() => setShowCustomTime(!showCustomTime)}
                className="w-full"
                disabled={loading}
              >
                {showCustomTime ? "Hide Custom Time" : "Custom Time"}
              </Button>

              {showCustomTime && (
                <div className="space-y-2 p-3 border rounded-md">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={handleCustomTimeChange}
                      className="w-full dark:[color-scheme:light]"
                      min={shift?.startTime}
                      max={shift?.endTime}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">End Time</Label>
                    <Input value={endTime} disabled className="w-full bg-muted" />
                    <p className="text-xs text-muted-foreground">End time auto 1 hour after start</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                placeholder="Enter reason"
                required
                className="min-h-[100px]"
              />
            </div>

            {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded">{error}</div>}
            {/* {success && <div className="text-green-600 text-sm font-medium p-3 bg-green-50 rounded">Request submitted!</div>} */}
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={clearForm}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !!timeError}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GeneralPermissionForm;
