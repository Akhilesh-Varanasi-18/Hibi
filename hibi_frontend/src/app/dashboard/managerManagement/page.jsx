"use client"
import React, { useState, useContext } from 'react'
import HireEmployee from '../../components/dashboard/managersManagement/HireEmployee'
import BulkEmployeeUpload from '../../components/dashboard/managersManagement/BulkUpload'
import ShowEmployees from '../../components/dashboard/managersManagement/ShowEmployees'
import { UsersContext } from '@/app/context/UserContext'
import Comparing from '@/utils/CommonFunctionality'
import AllEmployessData from '../../components/dashboard/managersManagement/AllEmployessData'

/**
 * Main Employee Management Page Component
 * Conditionally renders different views based on user role and permissions
 * Handles role-based access control for HR, Manager, CEO, and other roles
 */
const Page = () => {
    // State for forcing re-renders of child components
    const [keys, setKeys] = useState(0);

    // Get user role from context with safe access
    const { role } = useContext(UsersContext);
    const { previlege } = useContext(UsersContext);

    /**
     * Handles successful employee operations (add/upload)
     * Increments key to force re-render of employee list
     */
    const handleSuccess = () => {
        setKeys(prev => (prev ?? 0) + 1);
    };

    return (
        <div className='w-full h-screen'>
            {/* 
                Role-based Access Control:
                - HR, Manager, and CEO see full employee management interface
                - Other roles see read-only employee data view
            */}

            {/* Full Management View for HR, Manager, and CEO */}
            {(Comparing?.compareStrings?.("hr", role) ||
                Comparing?.compareStrings?.("manager", role) ||
                Comparing?.compareStrings?.("ceo", role) || Comparing.compareStrings("coo", role) || Comparing.compareStrings("teamlead", role)) && (
                    <div className="w-full h-full">
                        <div className='flex justify-between items-center flex-wrap px-6 pb-10'>
                            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                Employee Management
                            </h1>
                            {/* Action Buttons Container */}
                            {(Comparing.NotEqual("teamlead", role)) && <div className='w-full h-auto flex justify-end gap-4 flex-wrap mt-2'>
                                {/* Single Employee Hire Component */}
                                <HireEmployee
                                    onSuccess={handleSuccess}
                                />

                                {/* Bulk Employee Upload Component */}
                                <BulkEmployeeUpload
                                    onSuccess={handleSuccess}
                                />
                            </div>}
                        </div>


                        {/* Employee List with Interactive Features */}
                        <ShowEmployees
                            key={keys} // Force re-render on employee changes
                        />
                    </div>
                )}

            {/* Read-only View for Non-Managerial Roles */}
            {(Comparing?.NotEqual?.("hr", role) &&
                Comparing?.NotEqual?.("manager", role) &&
                Comparing?.NotEqual?.("ceo", role) && Comparing.NotEqual("coo", role) && Comparing.NotEqual("teamlead", role)) && (
                    <AllEmployessData />
                )}
        </div>
    )
}

export default Page