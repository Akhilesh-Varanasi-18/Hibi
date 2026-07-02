import LeaveManagementApi from '@/Apis/LeaveManagement';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react'
import { RxCross2 } from 'react-icons/rx';
import { TiTick } from 'react-icons/ti';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import CustomAlert from '@/app/components/ReusableComponents/CustomAlert';

const ApplyVacationDialog = ({ leaveType, onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date().setDate(new Date().getDate() + 5));
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const handleOpen = (open) => {
        if (open) {
            setStartDate(new Date());
            setReason("");
            setCalendarOpen(false);
        }
        setOpen(open);
    }

    const handleDateSelect = (date) => {
        if (!date) return; // Handle null/undefined date
        setStartDate(date);
        setCalendarOpen(false);
    }

    const { toast } = useToast();

    useEffect(() => {
        if (startDate) {
            const newEndDate = new Date(startDate);
            newEndDate.setDate(newEndDate.getDate() + 5);
            setEndDate(newEndDate.getTime());
        }
    }, [startDate]);

    const HandleSubmit = async () => {
        setIsLoading(true);

        try {
            // Validate required fields
            if (!startDate) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>Please select a start date</span>
                        </div>
                    ),
                });
                setIsLoading(false);
                return;
            }

            // Validate leaveType exists
            if (!leaveType?.[0]?._id) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>No leave type available</span>
                        </div>
                    ),
                });
                setIsLoading(false);
                return;
            }

            const response = await LeaveManagementApi.addLeaveRequest({
                leaveTypeId: leaveType[0]?._id || "",
                startDate: format(startDate, "yyyy-MM-dd"),
                endDate: endDate ? format(new Date(endDate), "yyyy-MM-dd") : "",
                leaveReason: reason || "",
                isHalfDay: false,
                halfDayPeriod: "",
                totalDays: 6,
                actualWorkingDays: 6,
            });

            if (response?.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg">
                                <TiTick />
                            </div>
                            <span>{response?.data?.message ?? "Vacation request submitted successfully"}</span>
                        </div>
                    ),
                });
                onSuccess?.();
                setOpen(false);
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{response?.data ?? response?.error ?? "An error occurred while submitting your request"}</span>
                        </div>
                    ),
                });
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-red-500 rounded-full text-lg">
                            <RxCross2 />
                        </div>
                        <span>{error?.message ?? "An error occurred while submitting your request"}</span>
                    </div>
                ),
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Safe date formatting for display
    const formatDateSafe = (date) => {
        if (!date) return "Invalid date";
        try {
            return format(new Date(date), "PPP");
        } catch (error) {
            return "Invalid date";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-neutral-200 dark:border-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                    Apply Vacation
                </Button>
            </DialogTrigger>
            <DialogContent 
                className="max-h-[90vh] overflow-y-auto max-w-lg" 
                onInteractOutside={(event) => event?.preventDefault?.()}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                        Apply for Vacation Leave
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Fill out the form below to request a Vacation leave
                    </DialogDescription>
                </DialogHeader>

                {/* Alert Message */}
                <CustomAlert 
                    type="lowalert" 
                    text="Your vacation will automatically take the next 6 days starting from your selected date." 
                />

                {/* Date Selection with Popover */}
                <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start Date
                    </Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? formatDateSafe(startDate) : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Selected start date: {formatDateSafe(startDate)}
                    </p>
                </div>

                {/* Leave Duration Display */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-800 dark:text-gray-300">
                        <strong>Leave Duration:</strong> {formatDateSafe(startDate)} to {formatDateSafe(endDate)}
                        <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">(6 days total)</span>
                    </p>
                </div>

                {/* Reason Input */}
                <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason for Vacation
                    </Label>
                    <Input
                        id="reason"
                        placeholder="Enter the reason for your vacation leave"
                        value={reason ?? ""}
                        onChange={(e) => setReason(e?.target?.value ?? "")}
                        className="w-full"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="px-6"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={HandleSubmit}
                        disabled={isLoading || !startDate}
                        className="px-6"
                    >
                        {isLoading ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ApplyVacationDialog;