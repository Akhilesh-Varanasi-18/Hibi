'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import shiftsApi from '@/Apis/shifts_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

// --- Validation helpers ---
function parseTimeToMinutes(timeStr) {
    // timeStr: "HH:MM"
    if (!timeStr || typeof timeStr !== "string") return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

const validateShiftName = (value) => {
    if (!value || typeof value !== "string" || value.trim() === "") {
        return "Shift name is required";
    }
    if (value.trim().length < 2 || value.trim().length > 30) {
        return "Shift name must be 2–30 characters";
    }
    // Optionally, restrict to alphabets, numbers, spaces
    if (!/^[A-Za-z0-9 _-]+$/.test(value.trim())) {
        return "Only alphabets, numbers, spaces, hyphens, and underscores allowed";
    }
    return true;
};

const validateTimeFields = (fieldName, allValues) => (value) => {
    // Only validate if both start and end are present
    const { startTime, endTime } = allValues;
    if (fieldName === "startTime" && (!value || value === "")) {
        return "Start time is required";
    }
    if (fieldName === "endTime" && (!value || value === "")) {
        return "End time is required";
    }
    if (startTime && endTime) {
        const start = parseTimeToMinutes(startTime);
        const end = parseTimeToMinutes(endTime);
        if (start === null || end === null) {
            return "Invalid time format";
        }
        if (start >= end) {
            return "Start time must be before end time";
        }
        if ((end - start) < 60) {
            return "Shift duration must be at least 1 hour";
        }
    }
    return true;
};

// --- Break time must be between start and end time ---
const validateBreakTimeRange = (breakTimeStart, breakTimeEnd, startTime, endTime) => {
    if (!breakTimeStart || !breakTimeEnd) {
        return "Both Break Time Start and Break Time End are required";
    }

    const breakStartMin = parseTimeToMinutes(breakTimeStart);
    const breakEndMin = parseTimeToMinutes(breakTimeEnd);

    if (breakStartMin === null || breakEndMin === null) {
        return "Invalid break time format";
    }
    if (breakEndMin <= breakStartMin) {
        return "Break Time End must be after Break Time Start";
    }
    if (startTime && endTime) {
        const startMin = parseTimeToMinutes(startTime);
        const endMin = parseTimeToMinutes(endTime);
        if (startMin === null || endMin === null) {
            return "Invalid start or end time format";
        }
        if (breakStartMin <= startMin || breakEndMin >= endMin) {
            return "Break must be strictly within shift time";
        }
    }
    return true;
};

const validateGracePeriodMin = (value) => {
    if (value === undefined || value === null || value === "") {
        return "Grace period is required";
    }
    if (isNaN(Number(value)) || Number(value) < 0) {
        return "Grace period must be a non-negative number";
    }
    return true;
};

export default function CreateShift({ refresh, close }) {
    const { toast } = useToast();
    const form = useForm({
        defaultValues: {
            name: '',
            startTime: '',
            endTime: '',
            breakTimeStart: '',
            breakTimeEnd: '',
            gracePeriodMin: '',
        },
        mode: 'onTouched',
    });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Convert gracePeriodMin to number before sending
            const payload = {
                name: data.name,
                startTime: data.startTime,
                endTime: data.endTime,
                breakTimeStart: data.breakTimeStart,
                breakTimeEnd: data.breakTimeEnd,
                gracePeriodMin: data.gracePeriodMin ? Number(data.gracePeriodMin) : 0,
            };
            const res = await shiftsApi.createShift(payload);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Shift created successfully!</span>
                        </div>
                    ),
                });
                refresh();
                close();
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error || "Failed to create shift."}</span>
                        </div>
                    ),
                });
                console.error('Error creating shift:', res.error);
            }
        } catch (err) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Something went wrong.</span>
                    </div>
                ),
            });
            console.error('Error creating shift:', err);
        } finally {
            setLoading(false);
        }
    };

    // For cross-field validation, get all values from form
    const getAllValues = () => form.getValues();

    // Validate break time as a range (used in both inputs)
    const validateBreakTimeFields = () => {
        const { breakTimeStart, breakTimeEnd, startTime, endTime } = getAllValues();
        return validateBreakTimeRange(breakTimeStart, breakTimeEnd, startTime, endTime);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="name"
                    control={form.control}
                    rules={{
                        validate: validateShiftName
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Shift Name
                                <span className="text-xs text-muted-foreground ml-2">(e.g. Morning, Night, General)</span>
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="Enter shift name" {...field} disabled={loading} autoComplete="off" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        name="startTime"
                        control={form.control}
                        rules={{
                            validate: (value) => validateTimeFields("startTime", getAllValues())(value)
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Start Time
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="endTime"
                        control={form.control}
                        rules={{
                            validate: (value) => validateTimeFields("endTime", getAllValues())(value)
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    End Time
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="breakTimeStart"
                        control={form.control}
                        // rules={{
                        //     validate: () => {
                        //         const v = validateBreakTimeFields();
                        //         if (typeof v === "string") return v;
                        //         return true;
                        //     }
                        // }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Break Time Start
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="breakTimeEnd"
                        control={form.control}
                        // rules={{
                        //     validate: () => {
                        //         const v = validateBreakTimeFields();
                        //         if (typeof v === "string") return v;
                        //         return true;
                        //     }
                        // }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Break Time End
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="gracePeriodMin"
                        control={form.control}
                        rules={{
                            validate: validateGracePeriodMin
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Grace Period (minutes)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Enter grace period in minutes"
                                        {...field}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
