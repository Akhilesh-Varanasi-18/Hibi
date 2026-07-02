'use client';
import PrivilegeCard from '../../components/dashboard/hiring/Privilege/PrivilegeCard';
import DesignationCard from '../../components/dashboard/hiring/Designation/DesignationCard';
import DepartmentCard from '../../components/dashboard/hiring/Department/DepartmentCard';
import ShiftCard from '../../components/dashboard/hiring/Shift/ShiftCard';
import RoleCard from '../../components/dashboard/hiring/roles/RoleCard';
import StatusTypeCard from '../../components/dashboard/hiring/Status/StatusTypeCard';
import LeaveTypeCard from '../../components/dashboard/hiring/Leaves/LeaveTypeCard';
import PermissionCard from '@/app/components/dashboard/hiring/Permissions/PermissionCard';
import { UsersContext } from '@/app/context/UserContext';
import React from 'react';
import HireEmployee from '../../components/dashboard/hiring/HireEmployee';
import BulkEmployeeUpload from '../../components/dashboard/hiring/BulkUpload';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AttendenceTypeCard from '../../components/dashboard/hiring/AttendenceTypes/attendenceTypeCard';
import UnauthorizedPage from '@/app/components/ReusableComponents/UnauthorizedPage';

export default function PrivilegeManagement() {
  const { previlege } = React.useContext(UsersContext);

  if (previlege !== "SUPERADMIN") {
    return (
      <UnauthorizedPage />
    );
  }

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      <div className='flex justify-between items-center flex-wrap'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Hiring Management
        </h1>
        <div className='flex gap-3 flex-row'>
          <HireEmployee />
          {/* <EditEmployee /> */}
          {/* <HireManager /> */}
          <BulkEmployeeUpload />
        </div>
      </div>
      <PrivilegeCard />
      <DesignationCard />
      <DepartmentCard />
      <ShiftCard />
      <RoleCard />
      <StatusTypeCard />
      <LeaveTypeCard />
      <PermissionCard />
      <AttendenceTypeCard/>
    </div>
  );
}
