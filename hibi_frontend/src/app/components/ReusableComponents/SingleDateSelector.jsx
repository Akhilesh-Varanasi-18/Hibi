"use client"
import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from 'lucide-react'
import { isAfter, isSameDay, format } from 'date-fns'
import { Button } from '@/components/ui/button'

const SingleDateSelector = ({
    selectedDate,
    setSelectedDate,
    showUpcoming,
    blockSundays
}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleDateChange = (date) => {
        if (!date) return;
        // If showUpcoming is false, prevent selecting future dates
        if (!showUpcoming) {
            const today = new Date();
            let selected = date > today ? today : date;
            // If Sundays are blocked, skip if it's a Sunday
            if (blockSundays && selected.getDay() === 0) return;
            setSelectedDate(selected);
        } else {
            if (blockSundays && date.getDay() === 0) return;
            setSelectedDate(date);
        }
    };

    // Helper for displaying the date in the button
    const getLabel = () => {
        if (selectedDate) {
            return format(selectedDate, "PPP");
        }
        return <span>Pick a date</span>;
    };

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex w-fit items-center justify-start gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                    <CalendarIcon className="mr-2" />
                    {getLabel()}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    onSelect={handleDateChange}
                    disabled={
                        showUpcoming
                            ? (blockSundays
                                ? (date) => date.getDay() === 0
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
};

export default SingleDateSelector
