"use client"
import React, { useState } from 'react'
import { BugReportDialog } from '../../components/dashboard/BugReports/bugReportDialog'
import Bugreports from '../../components/dashboard/BugReports/bugreports'
const page = () => {
    const [refresh, setRefresh] = useState(0);
    return (
        <div className='w-full px-4 md:px-6'>
            <div className='w-full h-15 justify-between flex items-center flex-wrap'>
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Bug Reports
                </h1>
                <BugReportDialog onSuccess={() => { setRefresh(prev => prev + 1) }} />
            </div>
            <Bugreports key={refresh} />
        </div>
    )
}

export default page