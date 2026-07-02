"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarCheck2 } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getEventDescription, isTodayInRange } from '@/utils/DateFunctions';
import UserCard from '../../ReusableComponents/UserCard';
import { UsersContext } from '@/app/context/UserContext';


const HolidaysDialog = ({ holidays = [] }) => {
    const [open, setOpen] = useState(false);
    const { colorPalettesFromBackend } = useContext(UsersContext);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full "
                        onClick={() => setOpen(true)}
                    >
                        View All Holidays
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg lg:max-w-2xl  border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl formatDate">
                    <DialogHeader className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
                                <CalendarCheck2 style={{ color: colorPalettesFromBackend?.todayHolidayColor || "#0B617A" }} className="h-5 w-5" />
                                All Upcoming Holidays This Year
                            </DialogTitle>
                            {/* <span className="bg-muted/60 text-xs font-medium rounded px-2 py-1 text-green-700 dark:text-green-300">
                                {holidays.length} holidays
                            </span> */}
                        </div>
                        <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            See all upcoming holidays for this year
                        </DialogDescription>
                    </DialogHeader>

                    <div className="h-[55vh] overflow-y-auto pr-2 py-2">
                        <ul className="grid grid-cols-2 gap-2 ">
                            {holidays.length === 0 ? (
                                <li className="col-span-2 text-center text-neutral-500 dark:text-neutral-400 py-10">
                                    No holidays found.
                                </li>
                            ) : (
                                holidays.map((h, i) => {
                                    return <UserCard
                                        name={h.name}
                                        desc={getEventDescription(h.fromDate, h.toDate)}
                                        showTooltip={false}
                                        highlight={isTodayInRange(h.fromDate, h.toDate)}
                                        color={colorPalettesFromBackend?.todayHolidayColor || "#0B617A"}
                                        icon={<CalendarCheck2 style={{ color: colorPalettesFromBackend?.todayHolidayColor || "#0B617A" }} className="h-4 w-4" />}
                                    />
                                })
                            )}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default HolidaysDialog;