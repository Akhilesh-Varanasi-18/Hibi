'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import employeeApi from '@/Apis/Employees';
import roleApi from "@/Apis/role_Api";
import privilegeApi from "@/Apis/previlege_Api";
import designationApi from "@/Apis/designation_Api";
import departmentApi from "@/Apis/department_Api";
import shiftsApi from '@/Apis/shifts_Api';
import ProfileAPi from '@/Apis/Profile_Api';
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
  Edit
} from 'lucide-react';
import { TiTick } from "react-icons/ti";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { RxCross2 } from 'react-icons/rx';

const EmployeeDirectory = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    roleId: "",
    privilegeId: "",
    designationId: "",
    departmentId: "",
    shiftId: "",
    officeMail: "",
    salaryPerMonth: ""
  });
  const [editErrors, setEditErrors] = useState({
    officeMail: "",
    roleId: "",
    privilegeId: "",
    shiftId: "",
    salaryPerMonth: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [loader, setloader] = useState(false);

  // Fetch employees and other data

  async function fetchAllData() {
    setloader(true);
    try {
      const employeesRes = await employeeApi.GetCreatedEmployees();
      // const emploee=await employeeApi.allEmployessUnder();
      // console.log(emploee);
    
      if (employeesRes?.success) {
        setEmployees(employeesRes.data || []);
      }
      const [
        rolesRes,
        privilegesRes,
        designationsRes,
        departmentsRes,
        shiftsRes,
      ] = await Promise.all([
        roleApi.GettingRoles(),
        privilegeApi.getPrivileges(),
        designationApi.getDesignations(),
        departmentApi.getDepartments(),
        shiftsApi.getShifts(),
      ]);

      if (rolesRes?.success) {
        const value = rolesRes.data.filter(dat => dat.name != "ORGANIZATIONHEAD" && dat.name != "HR" && dat.name != "CEO")
        setRoles(value || []);
      }
      if (privilegesRes?.success) {
        const values = privilegesRes.data.filter(dat => dat.name != "ULTIMATEADMIN");
        setPrivileges(values || []);
      }
      if (designationsRes?.success) setDesignations(designationsRes.data || []);
      if (departmentsRes?.success) setDepartments(departmentsRes.data || []);
      if (shiftsRes?.success) setShifts(shiftsRes.data || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setloader(false);
  }

  useEffect(() => {
    fetchAllData();
  }, []);
  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees.filter(employee => {
      if (!employee) return false;

      const search = searchTerm.toLowerCase();
      const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
      const employeeCode = employee.employeeCode?.toLowerCase() || '';
      const personalEmail = employee.personalEmail?.toLowerCase() || '';
      const departmentName = employee.departmentInfo?.name?.toLowerCase() || '';
      const designationTitle = employee.designationInfo?.title?.toLowerCase() || '';
      const privilegeName = employee.privilegeInfo?.name?.toLowerCase() || '';
      const shiftName = employee.shiftInfo?.name?.toLowerCase() || '';
      const gender = employee.gender?.toLowerCase() || '';
      const phone = employee.phone?.toString() || '';

      return (
        fullName.includes(search) ||
        employeeCode.includes(search) ||
        personalEmail.includes(search) ||
        departmentName.includes(search) ||
        designationTitle.includes(search) ||
        privilegeName.includes(search) ||
        shiftName.includes(search) ||
        gender.includes(search) ||
        phone.includes(search)
      );
    });
  }, [employees, searchTerm]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Check form validity with all required field validations
  const validateEditForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate email
    if (!editFormData.officeMail || editFormData.officeMail.trim() === "") {
      newErrors.officeMail = "Office email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.officeMail)) {
        newErrors.officeMail = "Enter a valid email address";
        isValid = false;
      }
    }

    // Validate roleId
    if (!editFormData.roleId) {
      newErrors.roleId = "Role is required";
      isValid = false;
    }

    // Validate privilegeId
    if (!editFormData.privilegeId) {
      newErrors.privilegeId = "Privilege is required";
      isValid = false;
    }

    // Validate shiftId
    if (!editFormData.shiftId) {
      newErrors.shiftId = "Shift is required";
      isValid = false;
    }

    // Validate salary
    if (!editFormData.salaryPerMonth) {
      newErrors.salaryPerMonth = "Salary is required";
      isValid = false;
    }

    setEditErrors(newErrors);
    return isValid;
  };

  // Check if form has any errors
  const hasErrors = () => {
    return Object.values(editErrors).some(error => error !== "");
  };

  // Open edit dialog and prefill form
  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      roleId: employee.roleInfo?._id || "",
      privilegeId: employee.privilegeInfo?._id || "",
      designationId: employee.designationInfo?._id || "",
      departmentId: employee.departmentInfo?._id || "",
      shiftId: employee.shiftInfo?._id || "",
      officeMail: employee.officeMail || "",
      salaryPerMonth: employee.salaryPerMonth || ""
    });
    
    // Validate immediately when dialog opens
    const newErrors = {};
    
    // Validate email
    if (!employee.officeMail || employee.officeMail.trim() === "") {
      newErrors.officeMail = "Office email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employee.officeMail)) {
        newErrors.officeMail = "Enter a valid email address";
      }
    }

    // Validate roleId
    if (!employee.roleInfo?._id) {
      newErrors.roleId = "Role is required";
    }

    // Validate privilegeId
    if (!employee.privilegeInfo?._id) {
      newErrors.privilegeId = "Privilege is required";
    }

    // Validate shiftId
    if (!employee.shiftInfo?._id) {
      newErrors.shiftId = "Shift is required";
    }

    // Validate salary
    if (!employee.salaryPerMonth) {
      newErrors.salaryPerMonth = "Salary is required";
    }

    setEditErrors(newErrors);
    setEditDialogOpen(true);
  };

  // Handle input changes in edit form
  const handleEditInputChange = (field, value) => {
    setEditFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    // Clear error when field is updated
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submit
    if (!validateEditForm()) {
      return;
    }

    setEditLoading(true);
    try {
      const data = {
        employeeId: editingEmployee._id,
        ...editFormData,
      };

      const formData = new FormData();
      if (data.employeeId) formData.append("employeeId", data.employeeId);
      if (data.officeMail) formData.append("officeMail", data.officeMail);
      if (data.roleId) formData.append("roleId", data.roleId);
      if (data.privilegeId) formData.append("privilegeId", data.privilegeId);
      if (data.shiftId) formData.append("shiftId", data.shiftId);
      if (data.designationId) formData.append("designationId", data.designationId);
      if (data.departmentId) formData.append("departmentId", data.departmentId);
      if (data.salaryPerMonth) formData.append("salaryPerMonth", data.salaryPerMonth);

      const res = await ProfileAPi.updateEmployeeData(formData);
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>Employee Updated Successfully</span>
            </div>
          ),
          description: "Employee details have been updated.",
        });

        // Update the employee in the state
        const updatedEmployee = {
          ...editingEmployee,
          roleInfo: roles.find(role => role._id === editFormData.roleId) || editingEmployee.roleInfo,
          privilegeInfo: privileges.find(priv => priv._id === editFormData.privilegeId) || editingEmployee.privilegeInfo,
          designationInfo: designations.find(des => des._id === editFormData.designationId) || editingEmployee.designationInfo,
          departmentInfo: departments.find(dept => dept._id === editFormData.departmentId) || editingEmployee.departmentInfo,
          shiftInfo: shifts.find(shift => shift._id === editFormData.shiftId) || editingEmployee.shiftInfo,
          officeMail: editFormData.officeMail,
          salaryPerMonth: editFormData.salaryPerMonth,
        };

        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === updatedEmployee._id ? { ...emp, ...updatedEmployee } : emp
          )
        );

        setEditDialogOpen(false);
        setEditingEmployee(null);
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{res.error}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      <div className='flex justify-between items-center flex-wrap'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Employee Management
        </h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search employees by name, code, email, department, role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEmployees.length} of {employees.length} employees
      </div>

      {/* Employee Cards Grid */}
      {
        loader ? (<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-screen overflow-auto'>
          {
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[325px] w-full" />
            ))
          }
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-screen overflow-auto">
          {filteredEmployees.map((employee) => (
            <Card key={employee._id} className="hover:shadow-md transition-shadow relative h-auto flex flex-col justify-center max-h-[325px]">
              <div className='flex justify-end pt-2 pr-2'>
                <Button onClick={() => handleEditClick(employee)} variant="outline">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start flex-wrap">
                  <CardTitle className="text-xl w-full">
                    {employee.firstName} {employee.lastName}
                  </CardTitle>
                  <Badge
                    variant={employee.privilegeInfo?.name === 'ADMIN' ? 'default' : 'secondary'}
                    className=""
                  >
                    {employee.privilegeInfo?.name || 'N/A'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{employee.employeeCode || 'No Code'}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{employee.personalEmail || 'No email'}</span>
                </div>

                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone || 'No phone'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee.departmentInfo?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee.designationInfo?.title || 'N/A'}</span>
                  </div>

                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee.roleInfo?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{employee.shiftInfo?.name || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center">
                    <Cake className="mr-1 h-3 w-3" />
                    <span>{formatDate(employee.dateOfBirth)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>Joined {formatDate(employee.dateOfJoining)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>)
      }

      {filteredEmployees.length === 0 && employees.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No employees found matching your search</p>
        </div>
      )}

      {employees.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No employees found</p>
        </div>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle> Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <h3 className="font-semibold">
                Editing: {editingEmployee.firstName} {editingEmployee.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Code: {editingEmployee.employeeCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Email: {editingEmployee.personalEmail}
              </p>
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Form fields in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <Label>Role *</Label>
                <Select
                  value={editFormData.roleId}
                  onValueChange={(value) => handleEditInputChange("roleId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.roleId && (
                  <p className="text-xs text-red-500">{editErrors.roleId}</p>
                )}
              </div>

              {/* Privilege */}
              <div>
                <Label>Privilege *</Label>
                <Select
                  value={editFormData.privilegeId}
                  onValueChange={(value) => handleEditInputChange("privilegeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a privilege" />
                  </SelectTrigger>
                  <SelectContent>
                    {privileges.map((privilege) => (
                      <SelectItem key={privilege._id} value={privilege._id}>
                        {privilege.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.privilegeId && (
                  <p className="text-xs text-red-500">{editErrors.privilegeId}</p>
                )}
              </div>

              {/* Designation */}
              <div>
                <Label>Designation</Label>
                <Select
                  value={editFormData.designationId}
                  onValueChange={(value) => handleEditInputChange("designationId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((designation) => (
                      <SelectItem key={designation._id} value={designation._id}>
                        {designation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div>
                <Label>Department</Label>
                <Select
                  value={editFormData.departmentId}
                  onValueChange={(value) => handleEditInputChange("departmentId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shift */}
              <div>
                <Label>Shifts *</Label>
                <Select
                  value={editFormData.shiftId}
                  onValueChange={(value) => handleEditInputChange("shiftId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift._id} value={shift._id}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.shiftId && (
                  <p className="text-xs text-red-500">{editErrors.shiftId}</p>
                )}
              </div>

              {/* Office Email */}
              <div>
                <Label>Office Email *</Label>
                <Input
                  type="email"
                  value={editFormData.officeMail}
                  onChange={(e) => handleEditInputChange("officeMail", e.target.value)}
                  placeholder="john.doe@company.com"
                />
                {editErrors.officeMail && (
                  <p className="text-xs text-red-500">{editErrors.officeMail}</p>
                )}
              </div>

              {/* Salary */}
              <div>
                <Label>Salary *</Label>
                <Input
                  type="number"
                  value={editFormData.salaryPerMonth}
                  onChange={(e) => handleEditInputChange("salaryPerMonth", e.target.value)}
                  placeholder="Enter salary per month"
                />
                {editErrors.salaryPerMonth && (
                  <p className="text-xs text-red-500">{editErrors.salaryPerMonth}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading || hasErrors()}
              >
                {editLoading ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDirectory;