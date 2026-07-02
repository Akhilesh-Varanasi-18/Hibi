"use client"
import React, { useContext } from 'react'
import AddOd from './addOd'
import EmployeeOds from './employeeOds'
import GetActionRequests from './Admincomponents/GetActionRequests'
import { UsersContext } from '@/app/context/UserContext'
import GetOrganizationRequests from './Admincomponents/getOrganizationRequests'
import Comparing from '@/utils/CommonFunctionality'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/app/components/ReusableComponents/PageHeader'
const page = () => {
  const { role, user, previlege } = useContext(UsersContext);
  return (
    <div className="px-6 pb-10 min-h-screen ">
      <PageHeader title={"OD Management"} />

      {/* First check role */}
      {(Comparing.compareStrings(role, "EMPLOYEE") ||
        Comparing.compareStrings(role, "INTERN") ||
        Comparing.compareStrings(role, "ACCOUNTANT") ||
        Comparing.compareStrings(role, "DESIGNER")) ? (
        <EmployeeOds />
      ) : Comparing.compareStrings(previlege, "SUPERADMIN") ? (
        // Then, if SUPERADMIN privilege, show Approval Tabs
        <Tabs defaultValue="OD Approvals" className="w-full">
          <TabsList>
            <TabsTrigger value="OD Approvals">OD Approvals</TabsTrigger>
            <TabsTrigger value="Organization OD">Organization OD's</TabsTrigger>
          </TabsList>
          <TabsContent value="OD Approvals" className="space-y-6 mt-6">
            <GetActionRequests />
          </TabsContent>
          <TabsContent value="Organization OD" className="space-y-6 mt-6">
            <GetOrganizationRequests />
          </TabsContent>
        </Tabs>
      ) : (
        // Else, for all others, show GetActionRequests
        <GetActionRequests />
      )}
    </div>
  )
}

export default page