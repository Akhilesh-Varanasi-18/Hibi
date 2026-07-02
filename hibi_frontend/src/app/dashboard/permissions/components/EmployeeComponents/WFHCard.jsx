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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
    format,
    addDays,
    isBefore,
    isAfter,
    startOfMonth,
    parseISO,
    differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WFHApis from "@/Apis/WFHApis";
import { useToast } from "@/hooks/use-toast";
import { RxCross2 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";


const calculateTotalDays = (startDateStr, endDateStr, isHalfDay) => {
    if (isHalfDay) {
        return 0.5;
    }
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    if (isNaN(startDate) || isNaN(endDate) || isBefore(endDate, startDate)) {
        return 0;
    }
    return differenceInDays(endDate, startDate) + 1;
};

const WFHCard = ({refresh}) => {
    const {toast} = useToast();
    const defaultStartDate = format(new Date(), "yyyy-MM-dd");

    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        startDate: defaultStartDate,
        endDate: defaultStartDate,
        isHalfDay: false,
        halfDayPeriod: "",
        wfhReason: "",
        totalDays: 1,
    });
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const minDate = startOfMonth(new Date());
    const maxDate = addDays(new Date(), 365);

    useEffect(() => {
        const total = calculateTotalDays(formData.startDate, formData.endDate, formData.isHalfDay);
        setFormData((prev) => ({
            ...prev,
            totalDays: total,
        }));
    }, [formData.startDate, formData.endDate, formData.isHalfDay]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => {
            if (name === "isHalfDay") {
                const isHalf = value === true;
                let newState = {
                    ...prev,
                    isHalfDay: isHalf,
                };
                if (isHalf) {
                    newState.endDate = prev.startDate;
                } else {
                    newState.halfDayPeriod = "";
                }
                return newState;
            }
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleDateRangeChange = (range) => {
        if (!range || !range.from) return;
        const endDate = range.to || range.from;
        setFormData((prev) => ({
            ...prev,
            startDate: format(range.from, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
        }));
    };

    const handleDateChange = (name, date) => {
        if (!date) return;
        const formattedDate = format(date, "yyyy-MM-dd");
        setFormData((prev) => {
            let newState = {
                ...prev,
                [name]: formattedDate,
            };
            if (prev.isHalfDay) {
                newState.endDate = formattedDate;
            }
            return newState;
        });
        setCalendarOpen(false);
    };

    const validateForm = (showErrs = false) => {
        const newErrors = {};
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.isHalfDay && !formData.endDate) newErrors.endDate = "End date is required for a full-day WFH";
        if (formData.isHalfDay && !formData.halfDayPeriod) newErrors.halfDayPeriod = "Please select a half-day period";
        if (!formData.wfhReason || formData.wfhReason.trim().length < 4)
            newErrors.wfhReason = "Reason must be at least 4 characters long";
        if (formData.wfhReason && formData.wfhReason.trim().length > 200)
            newErrors.wfhReason = "Reason cannot exceed 200 characters";
        if (formData.totalDays <= 0) newErrors.totalDays = "Total days must be greater than 0";

        if (!formData.isHalfDay && formData.startDate && formData.endDate) {
            const start = parseISO(formData.startDate);
            const end = parseISO(formData.endDate);
            if (isAfter(start, end)) newErrors.endDate = "End date cannot be before the start date";
        }

        if (showErrs) setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowErrors(true);

        if (!validateForm(true)) {
            return;
        }
        console.log(formData)
        setIsLoading(true);
        try {
            const res = await WFHApis.addWFHRequest(formData);

            if (res.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg">
                                <TiTick />
                            </div>
                            <span>{res?.data?.message}</span>
                        </div>
                    ),
                });

                setFormData({
                    startDate: defaultStartDate,
                    endDate: defaultStartDate,
                    isHalfDay: false,
                    halfDayPeriod: "",
                    wfhReason: "",
                    totalDays: 1,
                });
                setIsOpen(false);
                refresh();
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{res?.error || "Unexpected error"}</span>
                        </div>
                    ),
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error?.message || "An error occurred while submitting your request.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogOpen = (open) => {
        setIsOpen(open);
        if (open) {
            setFormData({
                startDate: defaultStartDate,
                endDate: defaultStartDate,
                isHalfDay: false,
                halfDayPeriod: "",
                wfhReason: "",
                totalDays: 1,
            });
            setShowErrors(false);
            setErrors({});
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full border-neutral-200 dark:border-neutral-800"
                >
                    Request WFH
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                        Work From Home Request
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Fill out the form below to request WFH
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-2">
                    {/* Duration & Half Day */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-medium">
                                WFH Duration *
                            </Label>
                            <Select
                                value={formData.isHalfDay ? "half" : "full"}
                                onValueChange={(value) => handleSelectChange("isHalfDay", value === "half")}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Full Day</SelectItem>
                                    <SelectItem value="half">Half Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.isHalfDay && (
                            <div className="space-y-2">
                                <Label htmlFor="halfDayPeriod" className="text-sm font-medium">
                                    Half Day Period *
                                </Label>
                                <Select
                                    name="halfDayPeriod"
                                    value={formData.halfDayPeriod}
                                    onValueChange={(value) => handleSelectChange("halfDayPeriod", value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1STHALF">First Half</SelectItem>
                                        <SelectItem value="2NDHALF">Second Half</SelectItem>
                                    </SelectContent>
                                </Select>
                                {showErrors && errors.halfDayPeriod && <p className="text-sm text-red-500">{errors.halfDayPeriod}</p>}
                            </div>
                        )}
                    </div>
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="dateRange" className="text-sm font-medium">
                                {formData.isHalfDay ? "WFH Date *" : "WFH Dates *"}
                            </Label>
                            {formData.isHalfDay ? (
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.startDate && "text-muted-foreground"
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.startDate ? format(parseISO(formData.startDate), "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.startDate ? parseISO(formData.startDate) : undefined}
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
                                                (!formData.startDate || !formData.endDate) && "text-muted-foreground"
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.startDate && formData.endDate
                                                ? `${format(parseISO(formData.startDate), "PPP")} - ${format(parseISO(formData.endDate), "PPP")}`
                                                : "Pick a date range"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={{
                                                from: formData.startDate ? parseISO(formData.startDate) : undefined,
                                                to: formData.endDate ? parseISO(formData.endDate) : undefined,
                                            }}
                                            onSelect={handleDateRangeChange}
                                            disabled={(date) => isBefore(date, minDate) || isAfter(date, maxDate)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {showErrors && errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                            {!formData.isHalfDay && showErrors && errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                        </div>
                    </div>
                    {/* Days Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Total Days</Label>
                            <div className="flex items-center bg-muted/50 rounded-lg gap-2">
                                <Input value={formData.totalDays} disabled />
                            </div>
                            {showErrors && errors.totalDays && <p className="text-sm text-red-500">{errors.totalDays}</p>}
                        </div>
                    </div>
                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="wfhReason" className="text-sm font-medium">
                            Reason for WFH *
                        </Label>
                        <Textarea
                            name="wfhReason"
                            value={formData.wfhReason}
                            onChange={handleChange}
                            placeholder="Please provide a reason for your WFH request..."
                            className="w-full min-h-[100px]"
                            rows={3}
                            disabled={isLoading}
                        />
                        {showErrors && errors.wfhReason && <p className="text-sm text-red-500">{errors.wfhReason}</p>}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="px-6"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="px-6"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WFHCard;