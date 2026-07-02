import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AllEmployeesAttendence from './AllEmployees'
import TeamAttendence from './TeamAttendence'

const AttendenceTabs = () => {
    return (
        <div className='p-6'>
            <Tabs defaultValue="Teams" className="w-full">
                <TabsList className="w-full justify-start rounded-xl p-1.5 h-auto bg-muted/30">
                    <TabsTrigger
                        value="All Employee Attendence"
                    >
                        All Employee Attendance
                    </TabsTrigger>
                    <TabsTrigger
                        value="Teams"
                    >
                        Teams Attendance
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="All Employee Attendence" className="space-y-6 mt-6">
                    <AllEmployeesAttendence />
                </TabsContent>
                <TabsContent value="Teams" className="space-y-6 mt-6">
                    <TeamAttendence/>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AttendenceTabs