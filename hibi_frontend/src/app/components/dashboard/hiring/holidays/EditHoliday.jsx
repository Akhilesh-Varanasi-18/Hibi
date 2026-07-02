import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Pencil, Loader2 } from "lucide-react"
import { HolidaysAPI } from '@/Apis/Holidays_Apis'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'

// Format as DD-MM-YYYY in local time (not UTC)
function formatDateLocal(date) {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to get UTC date string in yyyy-MM-dd (for backend)
function getUTCDateString(date) {
    if (!date) return "";
    // Convert local date to UTC date string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Parse a date string in DD-MM-YYYY format to a Date object (local time)
function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

// Helper to compare two dates (ignoring time)
function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

const EditHoliday = ({ holiday, refresh, fromDate, toDate }) => {
    const { toast } = useToast()                                                                                                                                                                                                                                                      
    const [open, setOpen] = useState(false)
    const [datePopoverOpen, setDatePopoverOpen] = useState(false)
    const [updating, setUpdating] = useState(false)

    // Parse initial dates from props (DD-MM-YYYY) to Date objects
    const initialFrom = fromDate ? parseDDMMYYYY(fromDate) : null
    const initialToRaw = toDate ? parseDDMMYYYY(toDate) : null

    // Always set initialTo to end of day for range selection
    const initialTo = initialToRaw
        ? new Date(initialToRaw.getFullYear(), initialToRaw.getMonth(), initialToRaw.getDate(), 23, 59, 59, 999)
        : null

    const [dateRange, setDateRange] = useState({
        from: initialFrom,
        to: initialTo
    })

    const form = useForm({
        defaultValues: {
            name: holiday?.name || '',
            shortCode: holiday?.shortCode || '',
        },
        mode: 'onTouched'
    })

    // When user selects a range, ensure the to date is set to the end of the day in local time
    function handleDateRangeChange(range) {
        if (!range) {
            setDateRange({ from: null, to: null });
            return;
        }
        let { from, to } = range;
        if (from && to) {
            // Set to to the end of the selected to day in local time
            to = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        }
        setDateRange({ from, to });
    }

    const onSubmit = async (data) => {
        setUpdating(true);
        // Compose edited holiday object, including _id
        let toDate = dateRange.to;
        if (toDate) {
            // Always set to end of day in local time for backend
            toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
        }
        const editedHoliday = {
            holidayId: holiday?._id,
            name: data.name,
            shortCode: data.shortCode,
            fromDate: getUTCDateString(dateRange.from),
            toDate: getUTCDateString(toDate)
        }
        const res = await HolidaysAPI.UpdateHoliday(editedHoliday);
        setUpdating(false);
        if(res.success){
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                        <span>Holiday updated successfully!</span>
                    </div>
                ),
            });
            refresh && refresh();
        }else{
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{res?.error || "Failed to update holiday."}</span>
                    </div>
                ),
            });
            // Optionally log error
        }
        setOpen(false)
    }

    const calendarLabel = dateRange.from && dateRange.to
        ? `${formatDateLocal(dateRange.from)} to ${formatDateLocal(dateRange.to)}`
        : <span>Select date range</span>

    // For Calendar's selected, always pass {from, to} with to as start-of-day (for UI highlight)
    const calendarSelected = {
        from: dateRange.from || undefined,
        to: dateRange.to
            ? new Date(
                dateRange.to.getFullYear(),
                dateRange.to.getMonth(),
                dateRange.to.getDate()
            )
            : undefined
    }

    // For Calendar's initialSelected, same as above
    const calendarInitialSelected = calendarSelected

    // For Calendar's defaultMonth, show from date if available
    const calendarDefaultMonth = dateRange.from || undefined

    // For Calendar's initialFocus, use initialFrom and initialTo (start-of-day)
    const calendarInitialFocus = {
        from: initialFrom || undefined,
        to: initialToRaw || undefined
    }

    // --- Begin: logic to check if form is unchanged ---
    // Get current form values
    const watchName = form.watch('name');
    const watchShortCode = form.watch('shortCode');
    // Compare with original
    const isNameSame = (watchName || '') === (holiday?.name || '');
    const isShortCodeSame = (watchShortCode || '') === (holiday?.shortCode || '');
    // Compare dateRange.from and dateRange.to with initialFrom and initialTo (ignore time for from, but for to, only compare date part)
    const isFromSame = isSameDay(dateRange.from, initialFrom);
    // For to, compare only date part (ignore time)
    const isToSame = isSameDay(dateRange.to, initialToRaw);
    // Button should be disabled if unchanged or if invalid
    const isUnchanged = isNameSame && isShortCodeSame && isFromSame && isToSame;
    // --- End: logic to check if form is unchanged ---

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-70 group-hover:opacity-100 transition"
                    title="Edit"
                >
                    <Pencil className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Holiday</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="name"
                            control={form.control}
                            rules={{
                                required: 'Holiday name is required',
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Holiday Name</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full px-3 py-2 rounded border focus:outline-none bg-white dark:bg-neutral-900 dark:text-white"
                                            placeholder="Enter holiday name"
                                            {...field}
                                            disabled={updating}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="shortCode"
                            control={form.control}
                            rules={{
                                required: 'Short code is required',
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Code</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full px-3 py-2 rounded border focus:outline-none bg-white dark:bg-neutral-900 dark:text-white"
                                            placeholder="e.g. PH, NH"
                                            maxLength={5}
                                            {...field}
                                            disabled={updating}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormLabel>Date Range</FormLabel>
                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={"w-full justify-start text-left font-normal" + (dateRange.from && dateRange.to ? "" : " text-muted-foreground")}
                                        disabled={updating}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {calendarLabel}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={calendarSelected}
                                        onSelect={handleDateRangeChange}
                                        className="rounded-lg border shadow-sm"
                                        defaultMonth={calendarDefaultMonth}
                                        initialSelected={calendarInitialSelected}
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateRange.from && dateRange.to && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-muted px-2 py-1 rounded text-xs border">
                                        {formatDateLocal(dateRange.from)}
                                    </span>
                                    <span className="bg-muted px-2 py-1 rounded text-xs border">
                                        {formatDateLocal(dateRange.to)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                variant="default"
                                className="ml-2 flex items-center gap-2"
                                disabled={!dateRange.from || !dateRange.to || updating || isUnchanged}
                            >
                                {updating && (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                )}
                                Update Holiday
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default EditHoliday