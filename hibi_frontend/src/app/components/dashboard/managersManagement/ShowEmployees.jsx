'use client';
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search,
  Mail,
  Phone,
  Building,
  Briefcase,
  Shield,
  Clock,
  Cake,
  Calendar,
  MoreVertical,
  ShieldCheck,
  ShieldOff,
  Edit,
  Key,
  View,
  ViewIcon,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TiTick } from "react-icons/ti";
import { useToast } from "@/hooks/use-toast";
import { RxCross2 } from 'react-icons/rx';
import { UsersContext } from '@/app/context/UserContext';
import Comparing from '@/utils/CommonFunctionality';
import employeeApi from '@/Apis/Employees';
import roleApi from "@/Apis/role_Api";
import privilegeApi from "@/Apis/previlege_Api";
import designationApi from "@/Apis/designation_Api";
import departmentApi from "@/Apis/department_Api";
import shiftsApi from '@/Apis/shifts_Api';
import MFA_api from '@/Apis/twofactor';
import PasswordApi from '@/Apis/password_Api';
import { EditEmployeeDialog } from './editEmployee';
import { getAllEmployeesData, getAllStatusTypes } from '@/Apis/Common_APIs';
import { useRouter } from 'next/navigation';
import EmployeeProfileDataDialog from './employeeProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaLinkedinIn } from 'react-icons/fa6';

const ShowEmployees = () => {
  const { toast } = useToast();
  const { role,previlege } = useContext(UsersContext);
  // const router = useRouter();
  const [profiledialog, setprofileDialog] = useState(false);
  const [selectedId, setSelectedid] = useState(null);
  // State declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [mfaloader, setmfaloader] = useState(false);
  const [loader, setloader] = useState(false);
  const [status, setstatus] = useState([]);

  /**
   * Fetches all required data for the component
   */
  async function fetchAllData() {
    setloader(true);
    try {
      const employee = await employeeApi.allEmployessUnder();
      console.log(employee);

      if (employee?.success) {
        setEmployees(employee?.data ?? []);
        console.log(employee?.data);
      }

      const [
        rolesRes,
        privilegesRes,
        designationsRes,
        departmentsRes,
        shiftsRes,
        statusRes
      ] = await Promise.all([
        roleApi.GettingRoles(),
        privilegeApi.getPrivileges(),
        designationApi.getDesignations(),
        departmentApi.getDepartments(),
        shiftsApi.getShifts(),
        getAllStatusTypes(),
      ]);

      if (rolesRes?.success) {
        if (Comparing.compareStrings("manager", role)) {
          const value = rolesRes?.data?.filter(dat =>
            dat?.name !== "ORGANIZATIONHEAD" &&
            dat?.name !== "HR" &&
            dat?.name !== "CEO" &&
            dat?.name !== "COO" &&
            dat?.name !== "MANAGER"
          ) ?? [];
          setRoles(value);
        }
        else if (Comparing.compareStrings("hr", role)) {
          const value = rolesRes?.data?.filter(dat =>
            dat?.name !== "ORGANIZATIONHEAD" &&
            dat?.name !== "HR" &&
            dat?.name !== "CEO" &&
            dat?.name !== "COO"
          ) ?? [];
          setRoles(value);
        }
        else if (Comparing.compareStrings("coo", role) || Comparing.compareStrings("ceo", role)) {
          const value = rolesRes?.data?.filter(dat =>
            dat?.name !== "ORGANIZATIONHEAD" 
            // dat?.name !== "CEO" &&
            // dat?.name !== "COO"
          ) ?? [];
          setRoles(value);
        }
        else {
          setRoles([]);
        }
      }

      if (statusRes.success) {
        const data = statusRes.data.filter(status => status && status.statusType && (Comparing.compareStrings("active", status.statusType)
          || Comparing.compareStrings("inactive", status.statusType)));
        setstatus(data);
      }

      if (privilegesRes?.success) {
        if (Comparing.compareStrings(previlege, "superAdmin")) {
          const filteredPrivileges = privilegesRes?.data?.filter(
            (dat) => dat?.name !== "ULTIMATEADMIN"
          ) ?? [];
          setPrivileges(filteredPrivileges);
        }
        else if (Comparing.compareStrings(previlege, "admin")) {
          const filteredPrivileges = privilegesRes?.data?.filter(
            (dat) => dat?.name !== "ULTIMATEADMIN" && dat?.name !== "SUPERADMIN" && dat?.name !== "ADMIN"
          ) ?? [];
          setPrivileges(filteredPrivileges);
        }
        else {
          setPrivileges([]);
        }
      }

      if (designationsRes?.success) setDesignations(designationsRes?.data ?? []);
      if (departmentsRes?.success) setDepartments(departmentsRes?.data ?? []);
      if (shiftsRes?.success) setShifts(shiftsRes?.data ?? []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    }
    setloader(false);
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  /**
   * Filters employees based on search term
   */
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees?.filter(employee => {
      if (!employee) return false;

      const search = searchTerm?.trim().toLowerCase();
      const fullName = `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.toLowerCase();
      const employeeCode = employee?.employeeCode?.toLowerCase() ?? '';
      const personalEmail = employee?.personalEmail?.toLowerCase() ?? '';
      const departmentName = employee?.departmentInfo?.name?.toLowerCase() ?? '';
      const designationTitle = employee?.designationInfo?.title?.toLowerCase() ?? '';
      const privilegeName = employee?.privilegeInfo?.name?.toLowerCase() ?? '';
      const shiftName = employee?.shiftInfo?.name?.toLowerCase() ?? '';
      const gender = employee?.gender?.toLowerCase() ?? '';
      const phone = employee?.phone?.toString() ?? '';
      const role = employee?.roleInfo?.name.toLowerCase() ?? ''

      return (
        fullName?.includes(search) ||
        employeeCode?.includes(search) ||
        personalEmail?.includes(search) ||
        departmentName?.includes(search) ||
        designationTitle?.includes(search) ||
        privilegeName?.includes(search) ||
        shiftName?.includes(search) ||
        gender?.includes(search) ||
        phone?.includes(search) ||
        role?.includes(search)
      );
    }) ?? [];
  }, [employees, searchTerm]);

  /**
   * Formats date string to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString)?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  /**
   * Opens edit dialog for an employee
   */
  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setEditDialogOpen(true);
  };

  /**
   * Handles employee update after successful edit
   */
  const handleEmployeeUpdate = async () => {
    setloader(true);
    const employee = await employeeApi.allEmployessUnder();
    if (employee?.success) {
      setEmployees(employee?.data ?? []);
    }
    setloader(false);
  };

  /**
   * Toggles 2FA for an employee
   */
  async function Handle2faChange(ismfa, employeeid) {
    setmfaloader(true)
    const data = {
      enable: !ismfa,
      employeeId: employeeid
    }
    const res = await MFA_api.toggle_2fa(data);
    if (res.success) {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
          <span>{res?.message}</span>
        </div>,
      });
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp._id === employeeid
            ? { ...emp, twofaEnabled: !ismfa }
            : emp
        )
      );
    }
    else {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
          <span>{res?.error || 'Something went wrong'}</span>
        </div>,
      });
    }
    setmfaloader(false);
  }

  /**
   * Resends password for an employee
   */
  async function resendPassword(code) {
    const res = await PasswordApi.resendPassword(code);
    if (res.success) {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
          <span>{res?.message}</span>
        </div>,
      });
    }
    else {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
          <span>{res?.error || 'Something went wrong'}</span>
        </div>,
      });
    }
  }

  async function HandleprofileRouting(id) {
    setSelectedid(id);
    setprofileDialog(true);
  }

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      {/* Header Section */}
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search employees by name, code, email, department, role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEmployees?.length ?? 0} of {employees?.length ?? 0} employees
      </div>

      {/* Employee Cards Grid */}
      {loader ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-screen overflow-auto'>
          {[...Array(6)]?.map((_, i) => (
            <Skeleton key={i} className="h-[325px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
          {filteredEmployees?.map((employee) => (
            <Card key={employee?._id} className="hover:shadow-md transition-shadow relative flex flex-col justify-center lg:max-h-[300px] md:max-h-[300px]">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className='flex items-center gap-3'>
                      <Avatar className="shadow-xl">
                        <AvatarImage src={employee.profileImage} />
                        <AvatarFallback>{employee?.firstName[0]} {employee?.lastName[0]}</AvatarFallback>
                      </Avatar>

                      <CardTitle className="text-xl truncate cursor-pointer" onClick={() => { HandleprofileRouting(employee?._id) }}>
                        {employee?.firstName} {employee?.lastName}
                      </CardTitle>
                    </div>
                    <div className='flex gap-2'>
                      <p className="text-sm text-muted-foreground">{employee?.employeeCode ?? 'No Code'}</p>
                      {employee?.linkedInProfile &&
                        <a href={employee?.linkedInProfile} target='_blank'>
                          <FaLinkedinIn />
                        </a>}
                    </div>
                  </div>

                  {/* Action Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { HandleprofileRouting(employee?._id) }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Info
                      </DropdownMenuItem>

                      {Comparing.NotEqual(role, "teamLead") &&
                        <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Employee
                        </DropdownMenuItem>}

                      {Comparing.NotEqual(role, "teamLead") &&
                        <DropdownMenuItem onClick={() => resendPassword(employee?.employeeCode)}>
                          <Key className="h-4 w-4 mr-2" />
                          Resend Password
                        </DropdownMenuItem>}

                      {Comparing.NotEqual(role, "teamLead") &&
                        <DropdownMenuItem
                          onClick={() => Handle2faChange(employee?.twofaEnabled, employee?._id)}
                          disabled={mfaloader}
                        >
                          {employee.twofaEnabled ? (
                            <ShieldOff className="h-4 w-4 mr-2" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 mr-2" />
                          )}
                          {employee.twofaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Privilege Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={employee?.statusInfo?.statusType === 'active' ? 'default' : 'secondary'}>
                    {employee?.statusInfo?.statusType ?? 'N/A'}
                  </Badge>
                  <Badge variant={employee?.privilegeInfo?.name === 'ADMIN' ? 'default' : 'outline'}>
                    {employee?.privilegeInfo?.name ?? 'N/A'}
                  </Badge>
                  <Badge
                    variant={employee?.twofaEnabled ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {employee?.twofaEnabled ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <ShieldOff className="h-3 w-3" />
                    )}
                    2FA
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm cursor-pointer" title='mail'>
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{employee?.personalEmail ?? 'No email'}</span>
                  </div>

                  <div className="flex items-center text-sm cursor-pointer" title='phone'>
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{employee?.phone ?? 'No phone'}</span>
                  </div>
                </div>

                {/* Department, Designation, Role, Shift */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center cursor-pointer" title='department'>
                    <Building className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={employee?.departmentInfo?.name}>
                      {employee?.departmentInfo?.name ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center cursor-pointer" title='designation'>
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={employee?.designationInfo?.title}>
                      {employee?.designationInfo?.title ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center cursor-pointer" title='role'>
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={employee?.roleInfo?.name}>
                      {employee?.roleInfo?.name ?? 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center cursor-pointer" title='shift'>
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={employee?.shiftInfo?.name}>
                      {employee?.shiftInfo?.name ?? 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Date Information */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center cursor-pointer" title='date of birth'>
                    <Cake className="mr-1 h-3 w-3" />
                    <span>{formatDate(employee?.dateOfBirth)}</span>
                  </div>
                  <div className="flex items-center cursor-pointer" title='date of joining'>
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>Joined {formatDate(employee?.dateOfJoining)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {filteredEmployees?.length === 0 && employees?.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No employees found matching your search</p>
        </div>
      )}

      {employees?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No employees found</p>
        </div>
      )}

      {/* Edit Employee Dialog */}
      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={editingEmployee}
        roles={roles}
        privileges={privileges}
        designations={designations}
        departments={departments}
        shifts={shifts}
        status={status}
        currentUserRole={role}
        onEmployeeUpdate={handleEmployeeUpdate}
      />

      {profiledialog && <EmployeeProfileDataDialog
        open={profiledialog}
        setopen={setprofileDialog}
        id={selectedId}
      />}

    </div>
  );
};

export default ShowEmployees;