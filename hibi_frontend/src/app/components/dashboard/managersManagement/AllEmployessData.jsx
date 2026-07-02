import React, { useEffect, useState, useMemo } from 'react'
import employeeApi from '@/Apis/Employees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Phone, Building, Briefcase, Shield, Clock, Cake, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FaLinkedinIn } from 'react-icons/fa6'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AllEmployessData = () => {
  // State declarations with proper initialization
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loader, setLoader] = useState(false);
  /**
   * Fetches employee data from API
   * Handles loading state and error cases gracefully
   */
  async function fetchData() {
    setLoader(true);
    try {
      const response = await employeeApi.getOrgEmployee();
      // Safely set employees data with fallback empty array
      if (response?.success) {
        setEmployees(response?.data?.employees ?? []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoader(false);
    }
  }

  /**
   * Filters employees based on search term across multiple fields
   * Uses useMemo for performance optimization to avoid recalculating on every render
   */
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees?.filter(employee => {
      if (!employee) return false;

      const search = searchTerm?.trim().toLowerCase();

      // Safely access all searchable fields with optional chaining and fallbacks
      const fullName = `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.toLowerCase();
      const employeeCode = employee?.employeeCode?.toLowerCase() ?? '';
      const personalEmail = employee?.personalEmail?.toLowerCase() ?? '';
      const departmentName = employee?.departmentInfo?.name?.toLowerCase() ?? '';
      const designationTitle = employee?.designationInfo?.title?.toLowerCase() ?? '';
      const privilegeName = employee?.privilegeInfo?.name?.toLowerCase() ?? '';
      const shiftName = employee?.shiftInfo?.name?.toLowerCase() ?? '';
      const gender = employee?.gender?.toLowerCase() ?? '';
      const phone = employee?.phone?.toString() ?? '';
      const role = employee?.roleId?.name.toLowerCase() ?? ''

      // Check if search term matches any field
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
    }) ?? []; // Fallback to empty array if anything goes wrong
  }, [employees, searchTerm]);

  /**
   * Formats date string to readable format with error handling
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date or fallback text
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

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      {/* Header Section */}
      <div className='flex justify-between items-center flex-wrap'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Employees LookUp
        </h1>
      </div>

      {/* Search Input with Icon */}
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

      {/* Results Count with safe array length access */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEmployees?.length ?? 0} of {employees?.length ?? 0} employees
      </div>

      {/* Employee Cards Grid with Loading State */}
      {loader ? (
        // Loading skeleton state
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-screen overflow-auto'>
          {[...Array(6)]?.map((_, i) => (
            <Skeleton key={i} className="h-[325px] w-full" />
          ))}
        </div>
      ) : (
        // Employee cards grid when data is loaded
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
          {filteredEmployees?.map((employee) => (
            <Card key={employee?._id} className="hover:shadow-md transition-shadow relative max-h-[325px] flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  {/* Employee Name */}
                  <div className='flex items-center gap-3'>
                    <Avatar className="shadow-xl">
                      <AvatarImage src={employee.profileImage} />
                      <AvatarFallback>{employee?.firstName[0]} {employee?.lastName[0]}</AvatarFallback>
                    </Avatar>

                    <CardTitle className="text-xl truncate cursor-pointer">
                      {employee?.firstName} {employee?.lastName}
                    </CardTitle>
                  </div>
                  {/* Privilege Badge with safe access */}
                </div>
                {/* Employee Code */}
                <div className='flex gap-2'>
                  <p className="text-sm text-muted-foreground">{employee?.employeeCode ?? 'No Code'}</p>
                  {employee?.linkedInProfile &&
                    <a href={employee?.linkedInProfile} target='_blank'>
                      <FaLinkedinIn />
                    </a>}
                </div>
              </CardHeader>

              <CardContent className="space-y-3" >

                {/* <Badge>{employee?.privilegeId?.name ?? 'No Privilege'}</Badge> */}

                <Badge variant={employee?.privilegeId?.name === 'ADMIN' ? 'default' : 'outline'}>
                  {employee?.privilegeId?.name ?? 'N/A'}
                </Badge>
                {/* Office Email */}
                <div className="flex items-center text-sm cursor-pointer" title="email">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{employee?.officeMail ?? 'No email'}</span>
                </div>

                <div className="flex items-center text-sm cursor-pointer" title='phone number'>
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{employee?.phone ?? 'No phone'}</span>
                </div>

                {/* Department, Designation, Role, and Shift Information */}
                <div className="grid grid-cols-2 gap-2 text-sm" title='department'>
                  {/* Department */}
                  <div className="flex items-center cursor-pointer">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee?.departmentId?.name ?? 'N/A'}</span>
                  </div>

                  {/* Designation */}
                  <div className="flex items-center cursor-pointer" title='designation'>
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee?.designationId?.title ?? 'N/A'}</span>
                  </div>

                  {/* Role */}
                  <div className="flex items-center cursor-pointer" title="role">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee?.roleId?.name ?? 'N/A'}</span>
                  </div>

                  {/* Shift */}
                  <div className="flex items-center cursor-pointer" title='shift'>
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee?.shiftId?.name ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Date Information - Birth Date and Joining Date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center cursor-pointer" title='date of birth'>
                    <Cake className="mr-1 h-3 w-3" />
                    <span>{formatDate(employee?.dateOfBirth)}</span>
                  </div>
                  <div className="flex items-center cursor-pointer " title='date of joining'>
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>Joined {formatDate(employee?.dateOfJoining)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }

      {/* No Search Results State */}
      {
        filteredEmployees?.length === 0 && employees?.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No employees found matching your search</p>
          </div>
        )
      }

      {/* No Employees State */}
      {
        employees?.length === 0 && !loader && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No employees found</p>
          </div>
        )
      }
    </div >
  )
}

export default AllEmployessData;