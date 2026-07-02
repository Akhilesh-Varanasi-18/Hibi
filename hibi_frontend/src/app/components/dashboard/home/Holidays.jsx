"use client";
import { useContext, useEffect, useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getHolidays } from "@/Apis/Common_APIs";
import HolidaysSkeleton from "./HolidaysSkeleton";
import EventCard from "./EventCard";
import HolidaysDialog from "./HolidaysDialog";
import { UsersContext } from "@/app/context/UserContext";
import CustomCard from "../../ReusableComponents/CustomCard";
import { getEventDescription, isTodayInRange } from "@/utils/DateFunctions";
import { CalendarCheck2, Sparkles } from "lucide-react";
import UserCard from "../../ReusableComponents/UserCard";

export default function HolidaysCard() {
    const { colorPalettesFromBackend } = useContext(UsersContext);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    async function getHolidaysList(year) {
        setLoading(true);
        try {
            const decLast = new Date(year, 11, 31);
            const res = await getHolidays({ fromDate: new Date(), toDate: decLast });
            if (res.success) {
                const sortedHolidays = res.data.sort((a, b) => {
                    const fromA = new Date(a.fromDate);
                    const fromB = new Date(b.fromDate);

                    if (fromA.getTime() !== fromB.getTime()) {
                        return fromA - fromB;
                    }
                    return new Date(a.toDate) - new Date(b.toDate);
                });
                setHolidays(sortedHolidays);
            } else {
                setHolidays([]);
            }
        } catch (err) {
            setHolidays([]);
        }
        setLoading(false);
    }

    useEffect(() => {
        getHolidaysList(new Date().getFullYear());
    }, []);

    const initialHolidays = holidays.slice(0, 2);

    return (
        <div>
            <CustomCard
                title={"Upcoming Holidays"}
                desc={" Find out the upcoming holidays here."}
                content={
                    <div>
                        <div className="flex-1 rounded-xl">
                            {loading ? (
                                <HolidaysSkeleton />
                            ) : holidays.length > 0 ? (
                                <ul className="flex flex-col gap-2">
                                    {initialHolidays.map((h, index) => (
                                        <li key={h.name + index}>
                                            {console.log(h)}
                                            <UserCard
                                                name={h.name}
                                                desc={getEventDescription(h.fromDate, h.toDate)}
                                                showTooltip={false}
                                                highlight={isTodayInRange(h.fromDate, h.toDate)}
                                                color={colorPalettesFromBackend?.todayHolidayColor || "#0B617A"}
                                                icon={<CalendarCheck2 style={{ color: colorPalettesFromBackend?.todayHolidayColor || "#0B617A" }} className="h-4 w-4" />}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                                    <span className="text-lg font-medium">No holidays this year</span>
                                    <span className="text-sm mt-1">Try selecting a different year or add new holidays.</span>
                                </div>
                            )}
                        </div>

                    </div>
                }
                footerContent={
                    holidays.length > 2 ? (
                        <div className="absolute w-[90%] bottom-3 left-1/2 -translate-x-1/2">
                            <HolidaysDialog holidays={holidays} />
                        </div>
                    ) : null
                }
            />
        </div>
    );
}