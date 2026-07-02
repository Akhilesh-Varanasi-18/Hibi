"use client"
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload, UserPlus, UserMinus } from "lucide-react";
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axiosInstance from '@/config/axiosConfig';


export default function EmployeeForm() {
  // Onboarding form state
  const [onboardForm, setOnboardForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    gender: "",
    personalEmail: "",
    officeMail: "",
    phone: "",
    departmentId: "",
    designationId: "",
    roleId: "",
    shiftId: "",
    salaryPerMonth: "",
    managers: "",
    optOutOccasions: "",
  });
  const [dateOfBirth, setDateOfBirth] = useState();
  const [dateOfJoining, setDateOfJoining] = useState();
  const [profileImage, setProfileImage] = useState(null);

  // Offboarding form state
  const [offboardForm, setOffboardForm] = useState({
    offboardEmployeeCode: "",
    offboardReason: "",
    offboardNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [showOffboardForm, setShowOffboardForm] = useState(false);
  const [showDOBDialog, setShowDOBDialog] = useState(false);
  const [showDOJDialog, setShowDOJDialog] = useState(false);
  const fileInputRef = useRef(null);

  // Sample data for dropdowns
  const departments = [
    { id: "64dbf43e9382d7a5e56d89c2", name: "Engineering" },
    { id: "64dbf43e9382d7a5e56d89d0", name: "Marketing" },
    { id: "64dbf43e9382d7a5e56d89d1", name: "Human Resources" }
  ];

  const designations = [
    { id: "64dbf43e9382d7a5e56d89c3", name: "Software Engineer" },
    { id: "64dbf43e9382d7a5e56d89d2", name: "Senior Software Engineer" },
    { id: "64dbf43e9382d7a5e56d89d3", name: "Product Manager" }
  ];

  const roles = [
    { id: "64dbf43e9382d7a5e56d89c4", name: "Employee" },
    { id: "64dbf43e9382d7a5e56d89d4", name: "Manager" },
    { id: "64dbf43e9382d7a5e56d89d5", name: "Admin" }
  ];

  const managers = [
    { id: "64dbf43e9382d7a5e56d89c5", name: "John Doe" },
    { id: "64dbf43e9382d7a5e56d89c6", name: "Jane Smith" },
    { id: "64dbf43e9382d7a5e56d89d6", name: "Mike Johnson" }
  ];

  const shifts = [
    { id: "64dbf43e9382d7a5e56d89c9", name: "Morning Shift (9AM-6PM)" },
    { id: "64dbf43e9382d7a5e56d89d9", name: "Evening Shift (2PM-11PM)" },
    { id: "64dbf43e9382d7a5e56d89e0", name: "Night Shift (10PM-7AM)" }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload only WebP or SVG images');
        return;
      }
      setProfileImage(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Onboarding form submit
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    // Simple required validation
    if (
      !onboardForm.employeeCode ||
      !onboardForm.firstName ||
      !onboardForm.lastName ||
      !onboardForm.gender ||
      !dateOfBirth ||
      !onboardForm.personalEmail ||
      !onboardForm.officeMail ||
      !onboardForm.phone ||
      !onboardForm.departmentId ||
      !onboardForm.designationId ||
      !onboardForm.roleId ||
      !dateOfJoining ||
      !onboardForm.shiftId ||
      !onboardForm.salaryPerMonth ||
      !onboardForm.managers
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(onboardForm).forEach(([key, value]) => {
        if (key === "managers") {
          formData.append(key, JSON.stringify([value]));
        } else {
          formData.append(key, value);
        }
      });
      if (profileImage) formData.append('profileImage', profileImage);
      if (dateOfBirth) formData.append('dateOfBirth', format(dateOfBirth, 'yyyy-MM-dd'));
      if (dateOfJoining) formData.append('dateOfJoining', dateOfJoining.toISOString());

      const response = await axiosInstance.post('/api/employee/addNewEmployee', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to submit form');
      }

      resetOnboardForm();
      alert('Employee added successfully!');
      setShowOnboardForm(false);
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Offboarding form submit
  const handleOffboardSubmit = async (e) => {
    e.preventDefault();
    if (!offboardForm.offboardEmployeeCode || !offboardForm.offboardReason) {
      alert("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Implement offboarding logic here
      alert('Offboarding process initiated for employee: ' + offboardForm.offboardEmployeeCode);
      resetOffboardForm();
      setShowOffboardForm(false);
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnboardForm = () => {
    setOnboardForm({
      employeeCode: "",
      firstName: "",
      lastName: "",
      gender: "",
      personalEmail: "",
      officeMail: "",
      phone: "",
      departmentId: "",
      designationId: "",
      roleId: "",
      shiftId: "",
      salaryPerMonth: "",
      managers: "",
      optOutOccasions: "",
    });
    setDateOfBirth(undefined);
    setDateOfJoining(undefined);
    setProfileImage(null);
  };

  const resetOffboardForm = () => {
    setOffboardForm({
      offboardEmployeeCode: "",
      offboardReason: "",
      offboardNotes: "",
    });
  };

  return (
    <div className="px-6 pt-2 pb-6">
      <Card className={`border-none shadow-none `}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Employee Management
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            Manage employee onboarding and offboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Initial Cards */}
          {!showOnboardForm && !showOffboardForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Onboard Card */}
              <Card className={`hover:shadow-md transition-shadow cursor-pointer `}>
                <CardContent 
                  className="flex flex-col items-center justify-center p-6 text-center"
                  onClick={() => setShowOnboardForm(true)}
                >
                  <UserPlus className="h-12 w-12 mb-4 text-blue-500" />
                  <CardTitle className="text-lg font-semibold">Onboard New Employee</CardTitle>
                  <CardDescription className="mt-2">
                    Add a new employee to the system with all necessary details
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Offboard Card */}
              <Card className={`hover:shadow-md transition-shadow cursor-pointer`}>
                <CardContent 
                  className="flex flex-col items-center justify-center p-6 text-center"
                  onClick={() => setShowOffboardForm(true)}
                >
                  <UserMinus className="h-12 w-12 mb-4 text-red-500" />
                  <CardTitle className="text-lg font-semibold">Offboard Employee</CardTitle>
                  <CardDescription className="mt-2">
                    Remove an employee from the system and manage the offboarding process
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Onboarding Form Dialog */}
          <Dialog open={showOnboardForm} onOpenChange={setShowOnboardForm}>
            <DialogContent className="w-full max-w-4xl p-0">
              <form onSubmit={handleOnboardSubmit} className="space-y-6 p-6 h-[80vh] overflow-y-scroll" autoComplete="off">
                <DialogHeader>
                  <DialogTitle>Onboard New Employee</DialogTitle>
                  <DialogDescription>
                    Fill in the details to onboard a new employee.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employeeCode">Employee Code*</Label>
                      <Input
                        id="employeeCode"
                        value={onboardForm.employeeCode}
                        onChange={e => setOnboardForm(f => ({ ...f, employeeCode: e.target.value }))}
                        placeholder="EMP001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name*</Label>
                      <Input
                        id="firstName"
                        value={onboardForm.firstName}
                        onChange={e => setOnboardForm(f => ({ ...f, firstName: e.target.value }))}
                        placeholder="Athreya"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name*</Label>
                      <Input
                        id="lastName"
                        value={onboardForm.lastName}
                        onChange={e => setOnboardForm(f => ({ ...f, lastName: e.target.value }))}
                        placeholder="R"
                      />
                    </div>
                    <div>
                      <Label>Gender*</Label>
                      <Select
                        value={onboardForm.gender}
                        onValueChange={value => setOnboardForm(f => ({ ...f, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth*</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        type="button"
                        onClick={() => setShowDOBDialog(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                      </Button>
                      <Dialog open={showDOBDialog} onOpenChange={setShowDOBDialog}>
                        <DialogContent className="w-auto p-0">
                          <div className="p-4">
                            <Calendar
                              mode="single"
                              selected={dateOfBirth}
                              onSelect={(date) => {
                                setDateOfBirth(date);
                                setShowDOBDialog(false);
                              }}
                              initialFocus
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div>
                      <Label>Profile Image (WebP/SVG only)</Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept=".webp,.svg"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        type="button"
                        onClick={triggerFileInput}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {profileImage ? profileImage.name : "Upload Image"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="personalEmail">Personal Email*</Label>
                      <Input
                        id="personalEmail"
                        type="email"
                        value={onboardForm.personalEmail}
                        onChange={e => setOnboardForm(f => ({ ...f, personalEmail: e.target.value }))}
                        placeholder="athreya.personal@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="officeMail">Office Email*</Label>
                      <Input
                        id="officeMail"
                        type="email"
                        value={onboardForm.officeMail}
                        onChange={e => setOnboardForm(f => ({ ...f, officeMail: e.target.value }))}
                        placeholder="athreya.official@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input
                        id="phone"
                        type="number"
                        value={onboardForm.phone}
                        onChange={e => setOnboardForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Department*</Label>
                      <Select
                        value={onboardForm.departmentId}
                        onValueChange={value => setOnboardForm(f => ({ ...f, departmentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Designation*</Label>
                      <Select
                        value={onboardForm.designationId}
                        onValueChange={value => setOnboardForm(f => ({ ...f, designationId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designations.map((designation) => (
                            <SelectItem key={designation.id} value={designation.id}>{designation.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Role*</Label>
                      <Select
                        value={onboardForm.roleId}
                        onValueChange={value => setOnboardForm(f => ({ ...f, roleId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Joining*</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        type="button"
                        onClick={() => setShowDOJDialog(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfJoining ? format(dateOfJoining, "PPP") : <span>Pick a date</span>}
                      </Button>
                      <Dialog open={showDOJDialog} onOpenChange={setShowDOJDialog}>
                        <DialogContent className="w-auto p-0">
                          <div className="p-4">
                            <Calendar
                              mode="single"
                              selected={dateOfJoining}
                              onSelect={(date) => {
                                setDateOfJoining(date);
                                setShowDOJDialog(false);
                              }}
                              initialFocus
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div>
                      <Label>Shift*</Label>
                      <Select
                        value={onboardForm.shiftId}
                        onValueChange={value => setOnboardForm(f => ({ ...f, shiftId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map((shift) => (
                            <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="salaryPerMonth">Salary Per Month (₹)*</Label>
                      <Input
                        id="salaryPerMonth"
                        type="number"
                        value={onboardForm.salaryPerMonth}
                        onChange={e => setOnboardForm(f => ({ ...f, salaryPerMonth: e.target.value }))}
                        placeholder="75000"
                      />
                    </div>
                  </div>
                </div>

                {/* Manager Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manager Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Manager*</Label>
                      <Select
                        value={onboardForm.managers}
                        onValueChange={value => setOnboardForm(f => ({ ...f, managers: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Additional Information</h4>
                  <div>
                    <Label htmlFor="optOutOccasions">Opt Out of Occasions</Label>
                    <Textarea
                      id="optOutOccasions"
                      value={onboardForm.optOutOccasions}
                      onChange={e => setOnboardForm(f => ({ ...f, optOutOccasions: e.target.value }))}
                      placeholder="Diwali, New Year"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button type="button" variant="outline" onClick={resetOnboardForm}>
                    Clear Form
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Onboarding Employee..." : "Onboard Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Offboarding Form Dialog */}
          <Dialog open={showOffboardForm} onOpenChange={setShowOffboardForm}>
            <DialogContent className="w-full max-w-2xl p-0">
              <form onSubmit={handleOffboardSubmit} className="space-y-6 p-6">
                <DialogHeader>
                  <DialogTitle>Offboard Employee</DialogTitle>
                  <DialogDescription>
                    Fill in the details to offboard an employee.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="offboardEmployeeCode">Employee Code*</Label>
                    <Input
                      id="offboardEmployeeCode"
                      value={offboardForm.offboardEmployeeCode}
                      onChange={e => setOffboardForm(f => ({ ...f, offboardEmployeeCode: e.target.value }))}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <Label>Reason for Offboarding*</Label>
                    <Select
                      value={offboardForm.offboardReason}
                      onValueChange={value => setOffboardForm(f => ({ ...f, offboardReason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resignation">Resignation</SelectItem>
                        <SelectItem value="termination">Termination</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="offboardNotes">Notes</Label>
                    <Textarea
                      id="offboardNotes"
                      value={offboardForm.offboardNotes}
                      onChange={e => setOffboardForm(f => ({ ...f, offboardNotes: e.target.value }))}
                      placeholder="Additional information about offboarding"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button type="button" variant="outline" onClick={resetOffboardForm}>
                    Clear Form
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Offboard Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}