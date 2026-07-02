"use client"
import React, { useEffect, useState, useCallback } from 'react'
import CustomCard from '../../ReusableComponents/CustomCard'
import { getDDMMYYDate, getFirstOfMonth_ddmmyy, getToday_ddmmyy } from '@/utils/DateFunctions'
import MultipleDateSelector from '../../ReusableComponents/MultipleDateSelector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatisticsAPI } from '@/Apis/StatisticsApis'
import UserCard from '../../ReusableComponents/UserCard'

const TopAttendanceEmployees = () => {
    const [dateRange, setDateRange] = useState({
        from: new Date(getFirstOfMonth_ddmmyy()),
        to: new Date(getToday_ddmmyy())
    });
    const [selectedDays, setSelectedDays] = useState('5');
    const [employeeData, setEmployeeData] = useState([]);
    const [totalWorkingDays, setTotalWorkingDays] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getTopEmployees = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await StatisticsAPI.getTopAttendedEmployees({
                fromDate: getDDMMYYDate(dateRange.from),
                toDate: getDDMMYYDate(dateRange.to),
                limit: parseInt(selectedDays)
            });
            if (res?.success && res?.data?.data) {
                setEmployeeData(res.data.data || []);
                setTotalWorkingDays(res.data.totalWorkingDays);
            } else {
                setEmployeeData([]);
                setTotalWorkingDays(null);
                // setError(res?.error || "Failed to fetch data.");
            }
        } catch (err) {
            setEmployeeData([]);
            setTotalWorkingDays(null);
            // setError("Failed to fetch data.");
        }
        setLoading(false);
    }, [dateRange, selectedDays]);

    useEffect(() => {
        getTopEmployees();
    }, [dateRange, selectedDays, getTopEmployees]);

    return (
        <div>
            <CustomCard
              title="Top Attendance"
              desc={
                totalWorkingDays !== null
                  ? `Most regular employees (out of ${totalWorkingDays} days)`
                  : "Most regular employees"
              }
              rightSection={
                <div className="flex items-center gap-2">
                  <Select value={selectedDays} onValueChange={setSelectedDays}>
                    <SelectTrigger className="w-[60px] h-8">
                      <SelectValue placeholder="5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                  <MultipleDateSelector dateRange={dateRange} setDateRange={setDateRange} />
                </div>
              }
              content={
                loading ? (
                  <div className="flex items-center justify-center h-20 text-sm text-gray-400">Loading...</div>
                ) : error ? (
                  <div className="text-red-500 text-sm">{error}</div>
                ) : (
                  employeeData && employeeData.length > 0 ? (
                    <ul className="space-y-2">
                      {employeeData.map((emp) => {
                        const percent =
                          totalWorkingDays && emp.attendanceCount != null
                            ? Math.floor((emp.attendanceCount / totalWorkingDays) * 100)
                            : 0;
                        return (
                          <li key={emp._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserCard
                                name={emp.employeeName}
                                desc={`Present: ${emp.attendanceCount}/${totalWorkingDays} days`}
                                url={emp.employeeImage}
                                employeeId={emp._id}
                                showTooltip={false}
                                hideBorder={true}
                              />
                            </div>
                            <span className="text-green-600 font-semibold">{percent}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-neutral-500 text-xs">No employee attendance data found.</div>
                  )
                )
              }
              footerContent={
                <div className="text-xs text-neutral-500">
                  {totalWorkingDays
                    ? `Based on ${totalWorkingDays} working day${totalWorkingDays > 1 ? 's' : ''} in the selected period.`
                    : "Attendance data for selected range."}
                </div>
              }
            />
        </div>
    )
}

export default TopAttendanceEmployees