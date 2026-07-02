"use client"
import React, { useEffect, useState, useCallback } from 'react'
import CustomCard from '../../ReusableComponents/CustomCard'
import { getDDMMYYDate, getEndOfYear_ddmmyy, getFirstOfYear_ddmmyy, getToday_ddmmyy } from '@/utils/DateFunctions'
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

const TopLeavesEmployees = () => {
    const [dateRange, setDateRange] = useState({
        from: new Date(getFirstOfYear_ddmmyy()),
        to: new Date(getToday_ddmmyy())
    });
    const [selectedDays, setSelectedDays] = useState('5');
    const [employeeData, setEmployeeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getTopEmployees = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await StatisticsAPI.getTopLeavesEmployees({
                fromDate: getDDMMYYDate(dateRange.from),
                toDate: getDDMMYYDate(dateRange.to),
                limit: parseInt(selectedDays)
            });
            if (res?.success && res?.data?.data) {
                setEmployeeData(res.data.data || []);
            } else {
                setEmployeeData([]);
                // setError(res?.error || "Failed to fetch data.");
            }
        } catch (err) {
            setEmployeeData([]);
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
              title="Most Leaves"
              desc="Employees who have taken the most leaves in the selected period"
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
                  <MultipleDateSelector showUpcoming={true} dateRange={dateRange} setDateRange={setDateRange} />
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
                      {employeeData.map((emp) => (
                        <li key={emp._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCard
                              name={emp.employeeName}
                              desc={`Leaves taken: ${emp.totalLeaveDays} day${emp.totalLeaveDays > 1 ? 's' : ''}`}
                              url={emp.employeeImage}
                              employeeId={emp._id}
                              showTooltip={false}
                              hideBorder={true}
                            />
                          </div>
                          <span className="text-red-600 font-semibold">
                            {emp.totalLeaveDays}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-neutral-500 text-xs">No employee leave data found.</div>
                  )
                )
              }
              footerContent={
                <div className="text-xs text-neutral-500">
                  Leave data for selected range.
                </div>
              }
            />
        </div>
    )
}

export default TopLeavesEmployees