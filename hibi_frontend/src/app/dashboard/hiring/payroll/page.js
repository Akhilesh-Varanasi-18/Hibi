"use client"
import DataTable from '@/app/components/dashboard/hiring/payroll/DataTable'
import DownloadExcel from '@/app/components/dashboard/hiring/payroll/DownloadExcel'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { payrollApis } from '@/Apis/Payroll_Apis'
import { AiOutlineLoading } from "react-icons/ai";
import SalaryStatementGenerator from '@/app/components/dashboard/hiring/payroll/DownloadExcel'
import RefreshAttendence from '@/app/components/dashboard/hiring/payroll/RefreshAttendence'

const months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const getStartAndEndDate = (year, month) => {
  // month is 0-indexed
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  // Format as YYYY-MM-DD
  const format = d => d.toISOString().slice(0, 10);
  return {
    startDate: format(start),
    endDate: format(end),
  };
};

const Page = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [payloadData, setPayloadData] = useState();
  const [loading, setLoading] = useState(true );

  const years = useMemo(
    () => Array.from({ length: 4 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const payload = useMemo(
    () => getStartAndEndDate(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const getPayrollData = async () => {
    setLoading(true);
    try {
      const res = await payrollApis.GetPayrollReports(payload);
      console.log(res)
      setPayloadData(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getPayrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='px-6 overflow-hidden h-screen overflow-y-auto'>
      <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 ">
          Payroll Management
        </h1>
        <div className="flex flex-wrap items-center md:gap-1 gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium text-muted-foreground"></label>
            <Select
              value={String(selectedMonth)}
              onValueChange={val => setSelectedMonth(Number(val))}
              disabled={false}
            >
              <SelectTrigger id="month-select" className="w-[120px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-muted-foreground"></label>
            <Select
              value={String(selectedYear)}
              onValueChange={val => setSelectedYear(Number(val))}
              disabled={false}
            >
              <SelectTrigger id="year-select" className="w-[100px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-2 text-xs text-muted-foreground flex items-center gap-2">
            <Button onClick={getPayrollData} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <AiOutlineLoading className="animate-spin" />
                  Loading...
                </span>
              ) : (
                "Get Payroll Data"
              )}
            </Button>
            {/* <span className="font-semibold">Payload:</span> {JSON.stringify(payload)} */}
          </div>
          {/* <RefreshAttendence/> */}
          <SalaryStatementGenerator data={payloadData} loading={loading} payload={payload}/>
        </div>
      </div>

      <div className='w-full'>
        {
          payload && <DataTable payloadData={payloadData} loading={loading} />
        }
      </div>
    </div>
  )
}

export default Page