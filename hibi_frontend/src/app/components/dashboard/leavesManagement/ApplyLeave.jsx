"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { format, addDays, isBefore, isAfter, startOfMonth, parseISO } from "date-fns";
import LeaveManagementApi from "@/Apis/LeaveManagement";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ApplyLeaveDialog = ({ onSuccess, leaveType }) => {
    const [leavetype, setLeavetype] = useState(leaveType ?? []);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [disable, setDisable] = useState(true);
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [dayloader, setDayloader] = useState(false);
    const [formData, setFormData] = useState({
        leaveTypeId: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        leaveReason: "",
        isHalfDay: false,
        halfDayPeriod: "",
        totalDays: 1,
        actualWorkingDays: 0,
    });

    // For calendar popover open/close state
    const [calendarOpen, setCalendarOpen] = useState(false);

    const minDate = new Date().setDate(new Date().getDate()-30);
    const maxDate = addDays(new Date(), 365);

    useEffect(() => {
        TotalDays();
    }, [formData?.startDate, formData?.endDate, formData?.isHalfDay, formData?.halfDayPeriod]);

    async function TotalDays() {
        setDayloader(true);
        console.log("TotalDays called", formData);

        const isHalfDay = formData?.isHalfDay ?? false;

        if (isHalfDay) {
            const res = await LeaveManagementApi.getWorkingDays({
                startDate: formData?.startDate,
                endDate: formData?.startDate,
                isHalfDay: isHalfDay,
            });
            console.debug("getWorkingDays (half day) response", res);
            if (res?.success) {
                setFormData((prev) => ({
                    ...prev,
                    ...res?.data,
                    endDate: prev?.startDate,
                }));
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{res?.error ?? "An error occurred"}</span>
                        </div>
                    ),
                });
            }
        } else {
            if (formData?.startDate && formData?.endDate) {
                const res = await LeaveManagementApi.getWorkingDays({
                    startDate: formData?.startDate,
                    endDate: formData?.endDate,
                    isHalfDay: isHalfDay,
                });
                console.debug("getWorkingDays (full day) response", res);
                if (res?.success) {
                    setFormData((prev) => ({
                        ...prev,
                        ...res?.data,
                    }));
                } else {
                    toast({
                        title: (
                            <div className="flex gap-2 items-center">
                                <div className="text-white bg-red-500 rounded-full text-lg">
                                    <RxCross2 />
                                </div>
                                <span>{res?.error ?? "An error occurred"}</span>
                            </div>
                        ),
                    });
                }
            }
        }
        setDayloader(false);
    }

    useEffect(() => {
        validateForm(false);
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e?.target ?? {};
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        console.debug("handleChange", name, value, type, checked);
    };

    // Updated handleSelectChange for combined duration
    const handleDurationChange = (value) => {
        if (value === "full") {
            setFormData((prev) => ({
                ...prev,
                isHalfDay: false,
                halfDayPeriod: "",
                endDate: prev?.startDate === prev?.endDate ? prev?.endDate : prev?.startDate
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                isHalfDay: true,
                halfDayPeriod: value,
                endDate: prev?.startDate
            }));
        }
        console.debug("handleDurationChange", value);
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        console.debug("handleSelectChange", name, value);
    };

    // New date selection logic for start and end date (for range)
    const handleDateRangeChange = (range) => {
        if (!range || !range?.from) return;

        // For half days, only allow single date selection
        if (formData?.isHalfDay) {
            setFormData((prev) => ({
                ...prev,
                startDate: format(range?.from, "yyyy-MM-dd"),
                endDate: format(range?.from, "yyyy-MM-dd"),
            }));
        } else {
            // If only from is selected, set both start and end to from
            if (!range?.to) {
                setFormData((prev) => ({
                    ...prev,
                    startDate: format(range?.from, "yyyy-MM-dd"),
                    endDate: format(range?.from, "yyyy-MM-dd"),
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    startDate: format(range?.from, "yyyy-MM-dd"),
                    endDate: format(range?.to, "yyyy-MM-dd"),
                }));
            }
        }
        console.debug("handleDateRangeChange", range);
    };

    // For half day, still use single date selection
    const handleDateChange = (name, date) => {
        if (!date) return;
        const formattedDate = format(date, "yyyy-MM-dd");
        setFormData((prev) => ({
            ...prev,
            [name]: formattedDate,
            endDate: formattedDate,
        }));
        console.debug("handleDateChange", name, formattedDate);
    };

    const validateForm = (showErrs = false) => {
        const newErrors = {};

        if (!formData?.leaveTypeId) newErrors.leaveTypeId = "Please select a leave type";
        if (!formData?.startDate) newErrors.startDate = "Start date is required";

        // For full day, validate end date
        if (!formData?.isHalfDay && !formData?.endDate) {
            newErrors.endDate = "End date is required for a full-day leave";
        }

        // For half day, validate halfDayPeriod
        if (formData?.isHalfDay && !formData?.halfDayPeriod) {
            newErrors.halfDayPeriod = "Please select a half-day period";
        }

        if (formData?.actualWorkingDays === 0) newErrors.actualWorkingDays = "Actual working days cannot be zero";

        // Date validation
        if (!formData?.isHalfDay && formData?.startDate && formData?.endDate) {
            const start = new Date(formData?.startDate);
            const end = new Date(formData?.endDate);
            if (start > end) newErrors.endDate = "End date cannot be before the start date";
        }

        // For half day, ensure start and end dates are the same
        if (formData?.isHalfDay && formData?.startDate && formData?.endDate && formData?.startDate !== formData?.endDate) {
            newErrors.endDate = "For half-day leave, start and end date must be the same";
        }

        if (formData?.leaveReason && formData?.leaveReason?.trim()?.length < 4)
            newErrors.leaveReason = "Reason must be at least 4 characters long";
        if (formData?.leaveReason && formData?.leaveReason?.trim()?.length > 200)
            newErrors.leaveReason = "Reason cannot exceed 200 characters";

        if (showErrs) setErrors(newErrors);
        setDisable(Object.keys(newErrors).length > 0);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e?.preventDefault?.();
        setShowErrors(true);
        if (!validateForm(true)) {
            setIsLoading(false);
            return;
        }

        const submitData = { ...formData };

        // Remove halfDayPeriod if not half day
        if (!submitData?.isHalfDay) {
            delete submitData.halfDayPeriod;
        }

        // Remove empty fields (notifyTo, temporaryAssignmentId) if present
        delete submitData.notifyTo;
        delete submitData.temporaryAssignmentId;

        console.log("Submitting data:", submitData);

        try {
            const response = await LeaveManagementApi.addLeaveRequest(submitData);
            console.debug("addLeaveRequest response", response);
            if (response?.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg">
                                <TiTick />
                            </div>
                            <span>{response?.data?.message ?? "Leave request submitted successfully"}</span>
                        </div>
                    ),
                });
                setFormData({
                    leaveTypeId: "",
                    startDate: format(new Date(), "yyyy-MM-dd"),
                    endDate: format(new Date(), "yyyy-MM-dd"),
                    leaveReason: "",
                    isHalfDay: false,
                    halfDayPeriod: "",
                    totalDays: 1,
                    actualWorkingDays: 0,
                });
                setIsOpen(false);
                setErrors({});
                setShowErrors(false);
                onSuccess?.()
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{response?.data ?? response?.error ?? "An error occurred"}</span>
                        </div>
                    ),
                });
            }
        } catch (error) {
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-red-500 rounded-full text-lg">
                            <RxCross2 />
                        </div>
                        <span>{error?.message ?? "An error occurred"}</span>
                    </div>
                ),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogOpen = (open) => {
        setIsOpen(open);
        if (open) {
            setFormData({
                leaveTypeId: "",
                startDate: format(new Date(), "yyyy-MM-dd"),
                endDate: format(new Date(), "yyyy-MM-dd"),
                leaveReason: "",
                isHalfDay: false,
                halfDayPeriod: "",
                totalDays: 1,
                actualWorkingDays: 0,
            });
            TotalDays();
            setErrors({});
            setShowErrors(false);
        }
    };

    // Get current duration value for display
    const getDurationValue = () => {
        if (!formData?.isHalfDay) return "full";
        return formData?.halfDayPeriod ?? "";
    };

    // Dialog UI
    return (
        <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="border-neutral-200 dark:border-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                    Apply Leave
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg" onInteractOutside={(event) => event?.preventDefault?.()}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                        Apply for Leave
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Fill out the form below to request a leave
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-2">
                    {/* Leave Type & Consideration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="leaveType" className="text-sm font-medium">
                                Leave Type *
                            </Label>
                            <Select
                                value={formData?.leaveTypeId}
                                onValueChange={(value) => handleSelectChange("leaveTypeId", value)}
                                disabled={!leavetype || leavetype?.length === 0}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leavetype?.map((type) => (
                                        <SelectItem key={type?._id} value={type?._id}>
                                            {type?.leaveType}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {showErrors && errors?.leaveTypeId && <p className="text-sm text-red-500">{errors?.leaveTypeId}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-medium">
                                Leave Duration *
                            </Label>
                            <Select
                                value={getDurationValue()}
                                onValueChange={handleDurationChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Full Day</SelectItem>
                                    <SelectItem value="1STHALF">First Half</SelectItem>
                                    <SelectItem value="2NDHALF">Second Half</SelectItem>
                                </SelectContent>
                            </Select>
                            {showErrors && errors?.halfDayPeriod && <p className="text-sm text-red-500">{errors?.halfDayPeriod}</p>}
                        </div>
                    </div>
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="dateRange" className="text-sm font-medium">
                                {formData?.isHalfDay ? "Leave Date *" : "Leave Dates *"}
                            </Label>
                            {formData?.isHalfDay ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData?.startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData?.startDate ? format(new Date(formData?.startDate), "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData?.startDate ? new Date(formData?.startDate) : undefined}
                                            onSelect={(date) => handleDateChange("startDate", date)}
                                            disabled={(date) => isBefore(date, minDate) || isAfter(date, maxDate)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                (!formData?.startDate || !formData?.endDate) && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData?.startDate && formData?.endDate
                                                ? `${format(new Date(formData?.startDate), "PPP")} - ${format(new Date(formData?.endDate), "PPP")}`
                                                : "Pick a date range"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={{
                                                from: formData?.startDate ? parseISO(formData?.startDate) : undefined,
                                                to: formData?.endDate ? parseISO(formData?.endDate) : undefined,
                                            }}
                                            onSelect={handleDateRangeChange}
                                            disabled={(date) => isBefore(date, minDate) || isAfter(date, maxDate)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {showErrors && errors?.startDate && <p className="text-sm text-red-500">{errors?.startDate}</p>}
                            {!formData?.isHalfDay && showErrors && errors?.endDate && <p className="text-sm text-red-500">{errors?.endDate}</p>}
                        </div>
                    </div>

                    {/* Days Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Total Days</Label>
                            <div className="flex items-center bg-muted/50 rounded-lg gap-2">
                                {dayloader ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Input value={formData?.totalDays ?? 0} disabled />
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Actual Working Days</Label>
                            <div className="flex items-center bg-muted/50 rounded-lg">
                                {dayloader ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Input value={formData?.actualWorkingDays ?? 0} disabled />
                                )}
                            </div>
                            {showErrors && errors?.actualWorkingDays && <p className="text-sm text-red-500">{errors?.actualWorkingDays}</p>}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="leaveReason" className="text-sm font-medium">
                            Reason for Leave
                        </Label>
                        <Textarea
                            name="leaveReason"
                            value={formData?.leaveReason ?? ""}
                            onChange={handleChange}
                            placeholder="Please provide a reason for your leave request..."
                            className="w-full min-h-[100px]"
                            rows={3}
                        />
                        {showErrors && errors?.leaveReason && <p className="text-sm text-red-500">{errors?.leaveReason}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="px-6"
                            disable={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || disable || dayloader}
                            className="px-6"
                        >
                            {isLoading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ApplyLeaveDialog;