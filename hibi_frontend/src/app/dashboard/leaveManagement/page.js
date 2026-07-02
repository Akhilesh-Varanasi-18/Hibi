"use client"
import React, { useContext, useState, useEffect } from 'react'
import Comparing from '@/utils/CommonFunctionality'
import { UsersContext } from '@/app/context/UserContext'
import { getAllStatusTypes, getEmployeeShifts } from '@/Apis/Common_APIs'
import ApplyLeaveDialog from '../../components/dashboard/leavesManagement/ApplyLeave'
import OdandCl from '../../components/dashboard/leavesManagement/OdandCl'
import EmployeeLeave from '../../components/dashboard/leavesManagement/EmployeeLeave'
import LeaveApprovals from '../../components/dashboard/leavesManagement/LeaveApprovals'
import ApplyVacationDialog from '../../components/dashboard/leavesManagement/ApplyVacation'
import LeaveManagementApi from '@/Apis/LeaveManagement'
import { CommonDataContext } from '../context/CommonDataContext'
import PageHeader from '@/app/components/ReusableComponents/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OrganizationLeaves from '../../components/dashboard/leavesManagement/OrganizationLeaves'
import permissionApi from '@/Apis/permission_Api'
import permissionsAPI from '@/Apis/Permissions_APIs'
import { differenceInDays } from 'date-fns'
const page = () => {
    const { role, user, previlege } = useContext(UsersContext);
    const { statusTypes } = useContext(CommonDataContext);
    const [statustype, setstatusType] = useState(null);
    const [update, setupdate] = useState(0);
    const [refresh, setRefresh] = useState(100);
    const [ApplyLeave, setApplyLeave] = useState(null);
    const [ApplyVacation, setApplyVacation] = useState(null);
    const [shift, setshift] = useState(null);
    const [showVacation, setshowVacation] = useState(false);


    useEffect(() => {
        const today = new Date();
        const doj = new Date(user?.dateOfJoining);

        const numberOfDays = differenceInDays(today, doj);
        console.log("Days since joining:", numberOfDays);

        if (numberOfDays >= 365) {
            setshowVacation(true);
        } else {
            setshowVacation(false);
        }
    }, [user]);
    // console.log(user?.dateOfJoining)
    async function GettingStatus() {
        if (statusTypes) {
            const FilterData = statusTypes.filter(item =>
                item && item?.statusType && (
                    Comparing.compareStrings(item?.statusType, "ACCEPTED") ||
                    Comparing.compareStrings(item?.statusType, "REJECTED") ||
                    Comparing.compareStrings(item?.statusType, "ESCALATED") ||
                    Comparing.compareStrings(item?.statusType, "PENDING") ||
                    Comparing.compareStrings(item?.statusType, "CANCELLED")
                )
            )
            setstatusType(FilterData);
        }
        else {
            setstatusType([]);
        }
    }

    async function getShiftData() {
        const res = await getEmployeeShifts();
        if (res.success) {
            setshift(res.data);
            console.log(res.data);
        }
    }

    const fetchAllData = async () => {
        const res = await LeaveManagementApi.getLeavetypes();
        if (res.success) {
            setApplyLeave(res?.data?.filter((e) => e?.leaveType !== "VACATION"));
            setApplyVacation(res?.data?.filter((e) => e?.leaveType == "VACATION"));
        }
    };

    useEffect(() => {
        GettingStatus();
        fetchAllData();
        getShiftData()
    }, [])


    return (
        <div className="min-h-screen px-6">
            {
                // EMPLOYEE, INTERN, ACCOUNTANT, DESIGNER: Employee Leaves
                (Comparing.compareStrings(role, "EMPLOYEE") ||
                    Comparing.compareStrings(role, "INTERN") ||
                    Comparing.compareStrings(role, "ACCOUNTANT") ||
                    Comparing.compareStrings(role, "DESIGNER")) ? (
                    <div>
                        <PageHeader
                            title={"Leave Management"}
                            rightContent={
                                <div className="flex gap-2 flex-wrap w-full justify-end sm:justify-end">
                                    {ApplyLeave &&
                                        <ApplyLeaveDialog onSuccess={() => { setupdate(prev => prev + 1); setRefresh(prev => prev + 1) }} leaveType={ApplyLeave} />
                                    }
                                    {ApplyVacation && showVacation &&
                                        <ApplyVacationDialog onSuccess={() => { setupdate(prev => prev + 1); setRefresh(prev => prev + 1) }} leaveType={ApplyVacation} />
                                    }
                                </div>
                            }
                        />
                        <OdandCl key={refresh} />
                        <div>
                            {statustype && shift && (
                                <EmployeeLeave status={statustype} key={update} onCancel={() => { setRefresh(prev => prev + 1) }} shift={shift} />
                            )}
                        </div>
                    </div>
                ) : Comparing.compareStrings(previlege, "SUPERADMIN") ? (
                    // SUPERADMIN: Show Approvals Tabs
                    <Tabs defaultValue="Leave Approvals" className="w-full">
                        <TabsList>
                            <TabsTrigger value="Leave Approvals">Leave Approvals</TabsTrigger>
                            <TabsTrigger value="Organization Leaves">Organization Leaves</TabsTrigger>
                        </TabsList>
                        <TabsContent value="Leave Approvals" className="space-y-6 mt-6">
                            {statustype && shift && (
                                <LeaveApprovals statusTypes={statustype} shift={shift} />
                            )}
                        </TabsContent>
                        <TabsContent value="Organization Leaves" className="space-y-6 mt-6">
                            {statustype && shift && (
                                <OrganizationLeaves statusTypes={statustype} shift={shift} />
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    // All Others: Show Approvals Only
                    statustype && shift && (
                        <LeaveApprovals statusTypes={statustype} shift={shift} />
                    )
                )
            }
        </div>
    )
}

export default page;