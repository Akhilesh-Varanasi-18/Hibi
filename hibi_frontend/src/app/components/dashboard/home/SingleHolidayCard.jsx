import React from "react";
import { CalendarCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper to format date as DD-MM-YYYY
function formatDateUTC(date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to check if today is within the holiday range
function isTodayHoliday(fromDate, toDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);

  return today >= from && today <= to;
}

const SingleHolidayCard = ({ h }) => {
  const isToday = isTodayHoliday(h.fromDate, h.toDate);

  return (
    <li
      className={`flex items-start gap-2 rounded px-2 py-2 text-xs justify-between transition flex-col
        ${isToday
          ? "bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-200 dark:border-green-700 shadow"
          : "bg-muted/60"
        }`}
    >
      <div className="flex items-center gap-2">
        <CalendarCheck2 className={`w-4 h-4 flex-shrink-0 ${isToday ? "text-green-600 dark:text-green-300" : "text-green-500"}`} />
        <span className={`font-semibold truncate max-w-[120px] text-xs ${isToday ? "text-green-800 dark:text-green-200" : ""}`}>{h.name}</span>
        {isToday && (
          <Badge className="ml-2 bg-green-500 text-white text-[10px] px-1 py-0">
            Today
          </Badge>
        )}
      </div>
      <span className={`text-muted-foreground ${isToday ? "font-semibold text-green-700 dark:text-green-300" : ""}`}>
        {formatDateUTC(new Date(h.fromDate))}
        {h.fromDate !== h.toDate && <> - {formatDateUTC(new Date(h.toDate))}</>}
      </span>
    </li>
  );
};

export default SingleHolidayCard;