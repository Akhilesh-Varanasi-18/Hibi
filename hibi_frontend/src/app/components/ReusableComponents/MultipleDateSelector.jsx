"use client"
import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from 'lucide-react'
import { isAfter, isSameDay, format } from 'date-fns'
import { Button } from '@/components/ui/button'

const MultipleDateSelector = ({ dateRange, setDateRange, showUpcoming , blockSundays}) => {
    const [rangePopoverOpen, setRangePopoverOpen] = useState(false);
    // Handle range selection from calendar
    const handleRangeChange = (range) => {
        if (!range) return;
        // Only update if both from and to are selected
        if (range.from && range.to) {
            // If showUpcoming is false, prevent selecting future dates
            if (!showUpcoming) {
                const today = new Date();
                let from = range.from > today ? today : range.from;
                let to = range.to > today ? today : range.to;
                // Ensure from is not after to
                if (isAfter(from, to)) {
                    [from, to] = [to, from];
                }
                setDateRange({ from, to });
            } else {
                // Allow any range if showUpcoming is true
                let from = range.from;
                let to = range.to;
                setDateRange({ from, to });
            }
        } else {
            setDateRange(range);
        }
    };

    // Helper for displaying the range in the button
    const getRangeLabel = () => {
        if (dateRange.from && dateRange.to) {
            if (isSameDay(dateRange.from, dateRange.to)) {
                return format(dateRange.from, "PPP");
            }
            return `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`;
        }
        if (dateRange.from) {
            return format(dateRange.from, "PPP");
        }
        return <span>Pick a date range</span>;
    };

    return (
        <Popover open={rangePopoverOpen} onOpenChange={setRangePopoverOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex w-fit items-center justify-start overflow-x-scroll overflow-y-hidden gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                    <CalendarIcon className="mr-2" />
                    {getRangeLabel()}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={dateRange}
                    captionLayout="dropdown"
                    onSelect={handleRangeChange}
                    // If showUpcoming is true, allow all dates except Sundays if blockSundays is enabled; else, disable future dates and Sundays if blockSundays
                    disabled={
                        showUpcoming
                            ? (blockSundays
                                ? (date) => date.getDay() === 0 // 0 is Sunday
                                : undefined)
                            : (date) =>
                                isAfter(date, new Date()) ||
                                (blockSundays ? date.getDay() === 0 : false)
                    }
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

export default MultipleDateSelector