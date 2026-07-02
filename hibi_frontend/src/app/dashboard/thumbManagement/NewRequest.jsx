'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Attendance_Apis } from '@/Apis/Attendance_Apis'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import { Thumb_Apis } from '@/Apis/Thumb_Apis'

// shadcn date picker imports
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

export default function NewRequest({ refresh }) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [statusTypes, setStatusTypes] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingTypes, setLoadingTypes] = useState(true)
    const [fetchError, setFetchError] = useState(false)

    // For popover open/close for thumbDate
    const [datePopoverOpen, setDatePopoverOpen] = useState(false)

    // Helper to get local date string in yyyy-MM-dd (fixes timezone offset issue)
    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const form = useForm({
        defaultValues: {
            requestFor: '',
            thumbDate: '',
            punchType: '',
            reason: ''
        },
        mode: 'onTouched'
    })

    useEffect(() => {
        setLoadingTypes(true)
        Attendance_Apis.getAttendanceStatusTypes().then((res) => {
            if (res.success && Array.isArray(res.data)) {
                // Only keep FIRST HALF and SECOND HALF
                const filtered = res.data.filter(
                    t => t.name === "FIRST HALF" || t.name === "SECOND HALF" 
                )
                setStatusTypes(filtered)
                setFetchError(false)
            } else {
                setStatusTypes([])
                setFetchError(true)
            }
        }).catch(() => {
            setStatusTypes([])
            setFetchError(true)
        }).finally(() => setLoadingTypes(false))
    }, [])

    useEffect(() => {
        if (open) {
            form.reset({
                requestFor: '',
                thumbDate: '',
                punchType: '',
                reason: ''
            })
        }
    }, [open])

    const onSubmit = async (data) => {
        // Only allow if requestFor is in allowed list
        if (!statusTypes.some(t => t._id === data.requestFor)) {
            form.setError('requestFor', { type: 'manual', message: 'Invalid status type selected.' })
            return
        }
        setLoading(true)
        // Log the payload as requested
        console.log("Thumb Request Payload:", data)
        // Only send punchType (IN/OUT), not punchTime
        const sendingData = {
            requestFor: data.requestFor,
            thumbDate: data.thumbDate,
            punchType: data.punchType,
            reason: data.reason
        }
        // console.log(sendingData)
        const res = await Thumb_Apis.addThumbRequest(sendingData);
        console.log(res)
        if (res.success) {
            refresh();
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                        <span>Thumb request submitted successfully!</span>
                    </div>
                ),
            })
            setOpen(false)
            setLoading(false)
            form.reset()
        } else {
            setLoading(false)
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{res?.error || "Something went wrong."}</span>
                    </div>
                ),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Thumb Request</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Thumb Request</DialogTitle>
                </DialogHeader>
                {loadingTypes ? (
                    <div className="flex flex-col gap-2">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="w-full h-10" />
                        ))}
                    </div>
                ) : fetchError ? (
                    <div className="text-red-500 py-4">Failed to load status types.</div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                name="requestFor"
                                control={form.control}
                                rules={{
                                    required: 'Status type is required',
                                    validate: value =>
                                        statusTypes.some(t => t._id === value) || 'Invalid status type selected.',
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status Type</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={loading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusTypes.map(type => (
                                                        <SelectItem key={type._id} value={type._id}>
                                                            {type.name || type.label || type._id}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="thumbDate"
                                control={form.control}
                                rules={{
                                    required: 'Date is required',
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={"w-full justify-start text-left font-normal" + (field.value ? "" : " text-muted-foreground")}
                                                        disabled={loading}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value
                                                            ? format(new Date(field.value + "T00:00:00"), "yyyy-MM-dd")
                                                            : <span>Select date</span>
                                                        }
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                        onSelect={date => {
                                                            if (date) {
                                                                // Use local date string to avoid timezone issues
                                                                const localDateStr = getLocalDateString(date);
                                                                field.onChange(localDateStr)
                                                                setDatePopoverOpen(false)
                                                            }
                                                        }}
                                                        initialFocus
                                                        disabled={{
                                                            after: new Date(),
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Punch Type Field */}
                            <FormField
                                name="punchType"
                                control={form.control}
                                rules={{
                                    required: 'Punch type is required',
                                    validate: value =>
                                        value === 'IN' || value === 'OUT' || 'Invalid punch type selected.',
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Punch Type</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={loading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select punch type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="IN">IN</SelectItem>
                                                    <SelectItem value="OUT">OUT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="reason"
                                control={form.control}
                                rules={{
                                    required: 'Reason is required',
                                    minLength: { value: 3, message: 'Reason must be at least 3 characters.' }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                            <textarea
                                                className="input input-bordered w-full rounded-md border px-3 py-2 min-h-[80px] dark:bg-neutral-900"
                                                {...field}
                                                disabled={loading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Submitting..." : "Submit"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
