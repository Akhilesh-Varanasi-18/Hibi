'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Trash2, Plus } from "lucide-react"
import { HolidaysAPI } from "@/Apis/Holidays_Apis"

export default function AddHoliday({refresh}) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [datePopoverOpen, setDatePopoverOpen] = useState(false)
    const [dateRange, setDateRange] = useState({ from: null, to: null })
    const [holidays, setHolidays] = useState([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)

    // Helper to get local date string in yyyy-MM-dd (fixes timezone offset issue)
    function getLocalDateString(date) {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const form = useForm({
        defaultValues: {
            name: '',
            shortCode: '',
        },
        mode: 'onTouched'
    })

    // Add holiday with range
    const onSubmit = (data) => {
        if (!data.name) {
            form.setError('name', { type: 'manual', message: 'Holiday name is required.' })
            return
        }
        if (!data.shortCode) {
            form.setError('shortCode', { type: 'manual', message: 'Short code is required.' })
            return
        }
        if (!dateRange.from || !dateRange.to) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Please select a date range.</span>
                    </div>
                ),
            })
            return
        }
        setLoading(true)
        // Build new holiday object
        const newHoliday = {
            name: data.name,
            shortCode: data.shortCode,
            fromDate: getLocalDateString(dateRange.from),
            toDate: getLocalDateString(dateRange.to)
        }
        setHolidays(prev => {
            // Remove duplicates (by name + fromDate + toDate)
            const merged = [...prev, newHoliday]
            const unique = Array.from(
                new Map(
                    merged.map(h => [`${h.name}|${h.shortCode}|${h.fromDate}|${h.toDate}`, h])
                ).values()
            )
            // Log the array as requested in backend format
            console.log("holidaysArray:", unique)
            return unique
        })
        // toast({
        //     title: (
        //         <div className='flex gap-2 items-center'>
        //             <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
        //             <span>Holiday added!</span>
        //         </div>
        //     ),
        // })
        setDateRange({ from: null, to: null })
        form.reset()
        setLoading(false)
    }

    // Remove a holiday from the list
    const removeHoliday = (idx) => {
        setHolidays(prev => prev.filter((_, i) => i !== idx))
    }

    // Create holidays API call
    const handleCreateHolidays = async () => {
        if (holidays.length === 0) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>No holidays to create. Please add at least one holiday.</span>
                    </div>
                ),
            })
            return
        }
        setCreating(true)
        try {
            const res = await HolidaysAPI.createHolidays({holidaysArray : holidays})
            if (res?.success) {
                refresh && refresh();
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>{res.message || "Holidays created successfully!"}</span>
                        </div>
                    ),
                })
                setHolidays([])
                setOpen(false)
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error || "Failed to create holidays."}</span>
                        </div>
                    ),
                })
            }
        } catch (err) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{"An error occurred while creating holidays."}</span>
                    </div>
                ),
            })
        }
        setCreating(false)
    }

    // Calendar button label
    const calendarLabel = dateRange.from && dateRange.to
        ? `${format(dateRange.from, "yyyy-MM-dd")} to ${format(dateRange.to, "yyyy-MM-dd")}`
        : <span>Select date range</span>

    // Handler to clear form and state when dialog closes
    const handleDialogOpenChange = (isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Clear form and state when dialog closes
            form.reset();
            setDateRange({ from: null, to: null });
            setHolidays([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Add Holiday(s)</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Holiday(s)</DialogTitle>
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
                                            disabled={loading || creating}
                                            {...field}
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
                                            disabled={loading || creating}
                                            maxLength={5}
                                            {...field}
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
                                        disabled={loading || creating}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {calendarLabel}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={range => setDateRange(range || { from: null, to: null })}
                                        initialFocus
                                        className="rounded-lg border shadow-sm"
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateRange.from && dateRange.to && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-muted px-2 py-1 rounded text-xs border">
                                        {format(dateRange.from, "yyyy-MM-dd")}
                                    </span>
                                    <span className="bg-muted px-2 py-1 rounded text-xs border">
                                        {format(dateRange.to, "yyyy-MM-dd")}
                                    </span>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={loading || creating}
                                variant="outline"
                                className="flex items-center justify-center"
                                style={{ padding: "0.5rem 0.75rem" }}
                                title="Add Holiday"
                            >
                                {loading ? (
                                    "Adding..."
                                ) : (
                                    <Plus className="w-5 h-5" />
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                className="ml-2"
                                disabled={creating || holidays.length === 0}
                                onClick={handleCreateHolidays}
                            >
                                {creating ? "Creating..." : "Create Holidays"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>

                {holidays.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-medium mb-2 text-sm">Added Holidays</h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {holidays.map((h, idx) => (
                                <div key={`${h.name}-${h.shortCode}-${h.fromDate}-${h.toDate}`} className="flex items-center justify-between bg-muted rounded px-3 py-2 text-sm">
                                    <div>
                                        <span className="font-semibold">{h.name}</span>
                                        <span className="ml-2 text-muted-foreground">{h.shortCode}</span>
                                        <span className="ml-2 text-muted-foreground">{h.fromDate}</span>
                                        <span className="mx-1 text-muted-foreground">to</span>
                                        <span className="text-muted-foreground">{h.toDate}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        title="Remove"
                                        onClick={() => removeHoliday(idx)}
                                        disabled={creating}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {/* <div className="mt-2 text-xs text-muted-foreground">
                            <span>holidaysArray: </span>
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(holidays, null, 2)}</pre>
                        </div> */}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
