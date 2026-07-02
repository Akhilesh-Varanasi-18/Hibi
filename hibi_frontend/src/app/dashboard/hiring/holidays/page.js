"use client"
import React, { useState } from 'react'
import ExcelUpload from '../../../components/dashboard/hiring/holidays/ExcelUpload'
import AddHoliday from '../../../components/dashboard/hiring/holidays/AddHoliday'
import HolidaysList from '../../../components/dashboard/hiring/holidays/HolidaysList'

const page = () => {
  const [refresh,setRefresh] = useState(0)
  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      <div className='flex justify-between items-center flex-wrap'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Holidays Management
        </h1>
        <div className='flex gap-3 flex-row'>
          <ExcelUpload refresh={() => setRefresh(p => p+1)} />
          <AddHoliday refresh={() => setRefresh(p => p+1)} />
        </div>
      </div>
      <HolidaysList refreshFromExcelUploadOrAddHoliday={refresh}/>
    </div>
  )
}

export default page