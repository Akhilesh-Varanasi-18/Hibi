'use client'
import { HolidaysAPI } from '@/Apis/Holidays_Apis';
import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, CalendarDays, CalendarCheck2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import EditHoliday from './EditHoliday';
import DeleteHoliday from './DeleteHoliday';

// Format as DD-MM-YYYY in UTC
function formatDateUTC(date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}


const HolidaysList = ({ refreshFromExcelUploadOrAddHoliday }) => {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 4 }, (_, i) => currentYear - i),
    [currentYear]
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [holidays, setHolidays] = useState([]);

  async function getHolidays(year) {
    setLoading(true);
    setHolidays([]);
    const janFirst = new Date(year, 0, 1);
    const decLast = new Date(year, 11, 31);
    const res = await HolidaysAPI.getHolidays({ fromDate: janFirst, toDate: decLast });
    if (res.success) {
      setHolidays(res.data);
    } else {
      setHolidays([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    getHolidays(selectedYear);
  }, [selectedYear, refresh, refreshFromExcelUploadOrAddHoliday]);

  return (
    <section className="w-full mx-auto mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h2 className="font-semibold text-2xl text-neutral-900 dark:text-neutral-100 tracking-tight">
            Holidays <span className="font-normal text-base text-muted-foreground">({selectedYear})</span>
          </h2>
        </div>
        <Select
          value={selectedYear.toString()}
          onValueChange={val => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="w-36 border-muted-foreground/30 shadow-sm focus:ring-2 focus:ring-primary/30 transition">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()} className="cursor-pointer">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-muted-foreground/10 bg-background shadow-sm p-4 min-h-[120px]">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/60 rounded-lg px-4 py-3 text-base animate-pulse">
                <div className="flex gap-3 items-center">
                  <Skeleton className="h-5 w-36 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-3 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                </div>
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            ))}
          </div>
        ) : holidays.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {holidays.map((h, idx) => (
              <li
                key={`${h.name}-${h.shortCode}-${h.fromDate}-${h.toDate}`}
                className="flex items-center justify-between bg-muted/60 hover:bg-muted transition rounded-lg px-4 py-3 text-base group"
              >
                {/* {console.log(new Date(h.toDate), new Date() , new Date("2021-01-19") < new Date()
)} */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <CalendarCheck2 className="w-4 h-4 text-green-500" />
                    {h.name}
                  </span>
                  <span className="ml-0 sm:ml-2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium tracking-wide">
                    {h.shortCode}
                  </span>
                  <span className="ml-0 sm:ml-2 text-muted-foreground text-sm">
                    {formatDateUTC(new Date(h.fromDate))}
                  </span>
                  <span className="mx-1 text-muted-foreground text-sm">to</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDateUTC(new Date(h.toDate))}
                  </span>
                </div>
                <div className='flex items-center gap-4'>
                  {
                    new Date() > new Date(h.fromDate) ||
                    <>
                      <EditHoliday holiday={h} refresh={() => setRefresh(refresh + 1)} fromDate={formatDateUTC(new Date(h.fromDate))} toDate={formatDateUTC(new Date(h.toDate))} />
                      <DeleteHoliday id={h?._id} refresh={() => setRefresh(refresh + 1)} />
                    </>
                  }

                </div>
              </li>
            ))}
          </ul>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CalendarDays className="w-10 h-10 mb-2 text-muted-foreground/40" />
              <span className="text-lg font-medium">No holidays in {selectedYear}</span>
              <span className="text-sm mt-1">Try selecting a different year or add new holidays.</span>
            </div>
          )
        )}
      </div>
    </section>
  )
}

export default HolidaysList