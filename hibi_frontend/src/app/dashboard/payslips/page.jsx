"use client"
import React, { useContext } from 'react'
import BulkPayslipUpload from './Components/BuldUploadPaySlips'
import { UsersContext } from '@/app/context/UserContext'
import Comparing from '@/utils/CommonFunctionality'
import EmployeePaysSlipss from './Components/EmployeePaysSlips'
import sampleTemplate from './Components/sampleTemplate'
const page = () => {
    const { previlege } = useContext(UsersContext)
    return (
        <div className='w-full min-h-screen px-4 md:px-6'>
            <EmployeePaysSlipss />
        </div>

    )
}

export default page