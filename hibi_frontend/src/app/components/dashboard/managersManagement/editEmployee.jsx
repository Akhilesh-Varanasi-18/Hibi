'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from 'react-icons/rx';
import ProfileAPi from '@/Apis/Profile_Api';
import Comparing from '@/utils/CommonFunctionality';

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  roles = [],
  privileges = [],
  designations = [],
  departments = [],
  shifts = [],
  currentUserRole,
  onEmployeeUpdate,
  status
}) {
  const { toast } = useToast();
  const [editFormData, setEditFormData] = useState({
    roleId: "",
    privilegeId: "",
    designationId: "",
    departmentId: "",
    shiftId: "",
    officeMail: "",
    salaryPerMonth: "",
    status: ""
  });
  const [editErrors, setEditErrors] = useState({
    officeMail: "",
    roleId: "",
    privilegeId: "",
    shiftId: "",
    salaryPerMonth: "",
    status: ""
  });
  const [editLoading, setEditLoading] = useState(false);

  // Initialize form data when employee changes
  useEffect(() => {
    if (employee) {
      setEditFormData({
        roleId: employee?.roleInfo?._id ?? "",
        privilegeId: employee?.privilegeInfo?._id ?? "",
        designationId: employee?.designationInfo?._id ?? "",
        departmentId: employee?.departmentInfo?._id ?? "",
        shiftId: employee?.shiftInfo?._id ?? "",
        officeMail: employee?.officeMail ?? "",
        salaryPerMonth: employee?.salaryPerMonth ?? "",
        status: employee?.statusInfo?._id ?? ""
      });
      setEditErrors({
        officeMail: "",
        roleId: "",
        privilegeId: "",
        shiftId: "",
        salaryPerMonth: "",
        status: ""
      });
    }
    // console.log(employee?.statusInfo?._id)
  }, [employee]);

  /**
   * Validates all form fields before submission
   * @returns {boolean} True if form is valid
   */
  const isEditFormValid = () => {
    let isValid = true;
    const newErrors = {};

    // Validate email
    if (!editFormData?.officeMail || editFormData?.officeMail?.trim() === "") {
      newErrors.officeMail = "Office email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex?.test(editFormData?.officeMail)) {
        newErrors.officeMail = "Enter a valid email address";
        isValid = false;
      }
    }

    // Validate roleId
    if (!editFormData?.roleId) {
      newErrors.roleId = "Role is required";
      isValid = false;
    }

    // Validate privilegeId
    if (!editFormData?.privilegeId) {
      newErrors.privilegeId = "Privilege is required";
      isValid = false;
    }

    // Validate shiftId
    if (!editFormData?.shiftId) {
      newErrors.shiftId = "Shift is required";
      isValid = false;
    }

    // Validate salary - only if user is not manager
    if (!editFormData.salaryPerMonth && Comparing?.NotEqual?.(currentUserRole, "manager")) {
      console.log(editFormData.salaryPerMonth);
      if(editFormData.salaryPerMonth=='' && parseInt(editFormData.salaryPerMonth)!=0)
      {
      newErrors.salaryPerMonth = "Salary is required";
      isValid = false;
      }
    }

    if (!editFormData?.status) {
      newErrors.status = "Status is required";
      isValid = false;
    }

    setEditErrors(newErrors);
    return isValid;
  };

  /**
   * Handles input changes in edit form
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
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

  /**
   * Handles edit form submission
   * @param {Event} e - Form submit event
   */
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submit
    if (!isEditFormValid()) {
      return;
    }

    setEditLoading(true);
    try {
      const data = {
        employeeId: employee?._id,
        ...editFormData,
      };

      // Prepare form data for API call
      const formData = new FormData();
      if (data?.employeeId) formData.append("employeeId", data.employeeId);
      if (data?.officeMail) formData.append("officeMail", data.officeMail);
      if (data?.roleId) formData.append("roleId", data.roleId);
      if (data?.privilegeId) formData.append("privilegeId", data.privilegeId);
      if (data?.shiftId) formData.append("shiftId", data.shiftId);
      if (data?.designationId) formData.append("designationId", data.designationId);
      if (data?.departmentId) formData.append("departmentId", data.departmentId);
      if (data?.salaryPerMonth) formData.append("salaryPerMonth", data.salaryPerMonth);
      if (data?.status) formData.append("status", data.status)

      const res = await ProfileAPi.updateEmployeeData(formData);
      if (res?.success) {
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

        // Call the update callback with updated employee data
        if (onEmployeeUpdate) {
          onEmployeeUpdate();
        }

        onOpenChange(false);
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{res?.error ?? "An error occurred"}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        {/* Employee Info Summary */}
        <div className="mb-4 p-3 bg-muted rounded-md">
          <h3 className="font-semibold">
            Editing: {employee?.firstName} {employee?.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Code: {employee?.employeeCode}
          </p>
          <p className="text-sm text-muted-foreground">
            Email: {employee?.personalEmail}
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Selection */}

            <div>
              <Label>status *</Label>
              <Select
                value={editFormData?.status}
                onValueChange={(value) => handleEditInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {status?.map((statu) => (
                    <SelectItem key={statu?._id} value={statu?._id}>
                      {statu?.statusType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors?.status && (
                <p className="text-xs text-red-500">{editErrors?.status}</p>
              )}
            </div>

            <div>
              <Label>Role *</Label>
              <Select
                value={editFormData?.roleId}
                onValueChange={(value) => handleEditInputChange("roleId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role?._id} value={role?._id}>
                      {role?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors?.roleId && (
                <p className="text-xs text-red-500">{editErrors?.roleId}</p>
              )}
            </div>

            {/* Privilege Selection */}
            <div>
              <Label>Privilege *</Label>
              <Select
                value={editFormData?.privilegeId}
                onValueChange={(value) => handleEditInputChange("privilegeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a privilege" />
                </SelectTrigger>
                <SelectContent>
                  {privileges?.map((privilege) => (
                    <SelectItem key={privilege?._id} value={privilege?._id}>
                      {privilege?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors?.privilegeId && (
                <p className="text-xs text-red-500">{editErrors?.privilegeId}</p>
              )}
            </div>

            {/* Designation Selection */}
            <div>
              <Label>Designation</Label>
              <Select
                value={editFormData?.designationId}
                onValueChange={(value) => handleEditInputChange("designationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations?.map((designation) => (
                    <SelectItem key={designation?._id} value={designation?._id}>
                      {designation?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Selection */}
            <div>
              <Label>Department</Label>
              <Select
                value={editFormData?.departmentId}
                onValueChange={(value) => handleEditInputChange("departmentId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((department) => (
                    <SelectItem key={department?._id} value={department?._id}>
                      {department?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shift Selection */}
            <div>
              <Label>Shifts *</Label>
              <Select
                value={editFormData?.shiftId}
                onValueChange={(value) => handleEditInputChange("shiftId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts?.map((shift) => (
                    <SelectItem key={shift?._id} value={shift?._id}>
                      {shift?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors?.shiftId && (
                <p className="text-xs text-red-500">{editErrors?.shiftId}</p>
              )}
            </div>

            {/* Office Email Input */}
            <div>
              <Label>Office Email *</Label>
              <Input
                type="email"
                value={editFormData?.officeMail}
                onChange={(e) => handleEditInputChange("officeMail", e?.target?.value)}
                placeholder="john.doe@company.com"
              />
              {editErrors?.officeMail && (
                <p className="text-xs text-red-500">{editErrors?.officeMail}</p>
              )}
            </div>

            {/* Salary Input - Hidden for managers */}
            {Comparing?.NotEqual?.(currentUserRole, "manager") && (
              <div>
                <Label>Salary *</Label>
                <Input
                  type="number"
                  value={editFormData?.salaryPerMonth}
                  onChange={(e) => handleEditInputChange("salaryPerMonth", e?.target?.value)}
                  placeholder="Enter salary per month"
                />
                {editErrors?.salaryPerMonth && (
                  <p className="text-xs text-red-500">{editErrors?.salaryPerMonth}</p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editLoading}
            >
              {editLoading ? "Updating..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}