"use client"
import React, { useEffect, useState, useCallback } from 'react'
import CustomCard from '../../ReusableComponents/CustomCard'
import { getDDMMYYDate, getFirstOfYear_ddmmyy, getToday_ddmmyy } from '@/utils/DateFunctions'
import MultipleDateSelector from '../../ReusableComponents/MultipleDateSelector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import UserCard from '../../ReusableComponents/UserCard'
import { ToDoApis } from '@/Apis/ToDoApis'

const TopTaskCompleted = () => {
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
            const res = await ToDoApis.TaskStatistics({
                fromDate: getDDMMYYDate(dateRange.from),
                toDate: getDDMMYYDate(dateRange.to),
                limit: parseInt(selectedDays)
            });
            console.log(res)
            if (res?.success && Array.isArray(res?.data?.data)) {
                setEmployeeData(res.data.data || []);
            } else {
                setEmployeeData([]);
            }
        } catch (err) {
            setEmployeeData([]);
        }
        setLoading(false);
    }, [dateRange, selectedDays]);

    useEffect(() => {
        getTopEmployees();
    }, [dateRange, selectedDays, getTopEmployees]);

    return (
        <div>
            <CustomCard
              title="Top Tasks Completed"
              desc={"Most completed tasks"}
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
                      {employeeData.map((emp,index) => {
                        return (
                          <li key={emp.employeeId || emp._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 w-full ">
                              <UserCard
                                highlight={index <= 2}
                                color={
                                  index === 0
                                    ? "#FFD700" // gold
                                    : index === 1
                                    ? "#C0C0C0" // silver
                                    : index === 2
                                    ? "#CD7F32" // bronze
                                    : "#0B617A"
                                }
                                name={emp.name}
                                url={emp.profileImage}
                                employeeId={emp.employeeId}
                                showTooltip={false}
                                hideBorder={true}
                                employeeCode={emp.employeeCode}
                                rightSection={
                                  <span
                                    className="font-semibold"
                                    style={{
                                      color: [
                                        "#B08D01",
                                        "#8D8D8D",
                                        "#8C6239",
                                      ][index] || "#084757" 
                                    }}
                                  >
                                    {emp.completedTasksCount}
                                  </span>
                                }
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-neutral-500 text-xs">No task data found.</div>
                  )
                )
              }
            />
        </div>
    )
}

export default TopTaskCompleted