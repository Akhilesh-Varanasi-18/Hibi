import { format, parseISO } from "date-fns";
// date options used for displaying date and time
const dateOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
};

// get date like 2024-03-10
export const getDDMMYYDate = (date) => {
    try {
        if (!date) return "";
        const d = (typeof date === "string" || typeof date === "number") ? new Date(date) : date;
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        // fallback to input if error
        return date;
    }
}

// returns something like "Nov 19 - Nov 21"
export function formatDateRangeToIST(startISO, endISO) {
    if (!startISO || !endISO) return "";
    const getDatePart = (iso) => {
        if (!iso) return "";
        let dateString = iso.split("T")[0];
        dateString = dateString.split(" ")[0];
        dateString = dateString.split(":")[0];
        return dateString;
    };
    const startDateStr = getDatePart(startISO);
    const endDateStr = getDatePart(endISO);
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
    const startStr = format(startDate, "MMM d");
    const endStr = format(endDate, "MMM d");
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
}

// get date with month name and time (always UTC)
export const GetDateFormatInDateMonth = (dateOrString) => {
    if (!dateOrString) return '';
    let d;
    if (
        typeof dateOrString === 'object' &&
        dateOrString !== null &&
        dateOrString.hasOwnProperty('startTime')
    ) {
        d = new Date(dateOrString.startTime);
    } else {
        d = new Date(dateOrString);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', { ...dateOptions, timeZone: 'UTC' });
}

// get today's date as yyyy-mm-dd
export function getToday_ddmmyy() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// get first date of this month as yyyy-mm-dd
export function getFirstOfMonth_ddmmyy() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = "01";
    return `${yyyy}-${mm}-${dd}`;
}

// get first date of this year as yyyy-mm-dd
export function getFirstOfYear_ddmmyy() {
    const now = new Date();
    const yyyy = now.getFullYear();
    return `${yyyy}-01-01`;
}

// get last date of this year as yyyy-mm-dd
export function getEndOfYear_ddmmyy() {
    const now = new Date();
    const yyyy = now.getFullYear();
    return `${yyyy}-12-31`;
}

// get last date of this month as yyyy-mm-dd
export function getEndOfMonth_ddmmyy() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(yyyy, now.getMonth() + 1, 0);
    const dd = String(lastDay.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// get last date of next month as yyyy-mm-dd
export function getNextMonthEnd_ddmmyy() {
    const now = new Date();
    const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const month = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
    const lastDay = new Date(year, month + 1, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, "0");
    const dd = String(lastDay.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// turn FormData or object into plain JSON
export const formdataToJSON = (formdata) => {
    try {
        if (formdata instanceof FormData) {
            const jsonData = {};
            for (let [key, value] of formdata.entries()) {
                if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
                    if (Array.isArray(jsonData[key])) {
                        jsonData[key].push(value);
                    } else {
                        jsonData[key] = [jsonData[key], value];
                    }
                } else {
                    jsonData[key] = value;
                }
            }
            console.log(jsonData)
            return jsonData;
        } else if (typeof formdata === "object" && formdata !== null) {
            // clone if already object
            return { ...formdata };
        } else if (formdata === null || formdata === undefined) {
            // return blank object for null/undefined
            return {};
        } else {
            // return as value for string, number
            return { value: formdata };
        }
    } catch (error) {
        // log error
        console.error("Error in formdataToJSON:", error);
        return {};
    }
}
// show date + time in short readable format
export const formatDateAndTime = (dateString) => {
    if (!dateString) return 'Invalid date';
    try {
        const date = new Date(dateString);
        const datePart=new Date(dateString?.split?.("T")?.[0]);
        if (isNaN(date.getTime())) return 'Invalid date';
        const Time = dateString?.split("T")[1]?.split(".")[0];
        return datePart.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }) + " " + Time;
    } catch (error) {
        console.error("Date formatting error:", error);
        return 'Invalid date';
    }
};
//covnverts date into dateTime format 
export const toLocalISOString = (date, time) => {
    if (!date || !time) return "";
    const [h, m] = time.split(":").map(Number);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = h.toString().padStart(2, "0");
    const minute = m.toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  };
// show only date in US short format
export const formatDate = (dateString) => {
    if (!dateString) return 'Invalid date';
    try {
        const datePart = dateString?.split?.("T")?.[0];
        if (!datePart) return 'Invalid date';

        const date = new Date(datePart);
        if (isNaN(date.getTime())) return 'Invalid date';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error("Date formatting error:", error);
        return 'Invalid date';
    }
};

// check if today is in date range (ignoring year, used for bdays/holidays)
export const isTodayInRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return false;
    }

    // just month and day, not year
    const parseMonthDay = dateStr => {
        const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
        return { month, day };
    };

    const { month: startM, day: startD } = parseMonthDay(startDate);
    const { month: endM, day: endD } = parseMonthDay(endDate);

    // get today's month and day
    const today = new Date();
    const todayM = today.getMonth() + 1;
    const todayD = today.getDate();

    // make comparable number for range
    const toMDNum = (m, d) => m * 100 + d;

    const startNum = toMDNum(startM, startD);
    const endNum = toMDNum(endM, endD);
    const todayNum = toMDNum(todayM, todayD);

    if (startNum <= endNum) {
        // for ranges in same year
        return todayNum >= startNum && todayNum <= endNum;
    } else {
        // for ranges that cross year end
        return todayNum >= startNum || todayNum <= endNum;
    }
};

// days from today to date (ignores year)
export const daysToGo = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    const [tYear, tMonth, tDay] = targetDate?.split("T")[0].split("-");
    const thisYear = today.getFullYear();
    let target = new Date(thisYear, Number(tMonth) - 1, Number(tDay));
    if (
        target.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
    ) {
        target = new Date(thisYear + 1, Number(tMonth) - 1, Number(tDay));
    }
    const oneDayMs = 1000 * 60 * 60 * 24;
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.ceil((target - todayStart) / oneDayMs);
    return diff >= 0 ? diff : 0;
};

// make "Nov 19 - Nov 21" for two dates
export const formatDateRange = (startDate, endDate) => {
    // skip if blank
    if (!startDate || !endDate) {
        return "";
    }

    // only use date part, ignore time and timezone stuff
    const parseLocalDate = (isoString) => {
        const [datePart] = isoString.split("T");
        const [year, month, day] = datePart.split("-");
        return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    const startStr = format(start, "MMM d");
    const endStr = format(end, "MMM d");

    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
};

// make event text, like 'Nov 12 • 3 days to go'
export const getEventDescription = (startDate, endDate) => {
    const range = formatDateRange(startDate, endDate);
    const remaining = daysToGo(startDate);

    if (isTodayInRange(startDate, endDate)) {
        return `${range} • Happening today`;
    } else if (remaining === 0) {
        return `${range} • Happening today`;
    } else if (remaining === 1) {
        return `${range} • 1 day to go`;
    } else {
        return `${range} • ${remaining} days to go`;
    }
};
// calculates number of days between 2 days
export const calculateTotalDays = (start, end) => {
    try {
      if (!start || !end) return 0;
      const startDate = new Date(start);
      const endDate = new Date(end);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return daysDiff > 0 ? daysDiff : 1;
    } catch {
      return 1;
    }
  };