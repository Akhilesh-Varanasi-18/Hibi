"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, subYears } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import roleApi from "@/Apis/role_Api";
import privilegeApi from "@/Apis/previlege_Api";
import OrganizationApi from "@/Apis/Organization_Management";
import designationApi from "@/Apis/designation_Api";
import departmentApi from "@/Apis/department_Api";
import permissionsAPI from "@/Apis/Permissions_APIs";
import TeamManagementApi from "@/Apis/TeamManagementApi";
import shiftsApi from "@/Apis/shifts_Api";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { UsersContext } from "@/app/context/UserContext";
import { useContext } from "react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const HireEmployee = () => {
  const { toast } = useToast();
  const { role } = useContext(UsersContext);

  // State
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [dateOfJoining, setDateOfJoining] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  // Calendar popover open states
  const [calendarOpen, setCalendarOpen] = useState({
    dob: false,
    doj: false,
  });

  // Server error states for select fields
  const [roleServerError, setRoleServerError] = useState("");
  const [privilegeServerError, setPrivilegeServerError] = useState("");
  const [designationServerError, setDesignationServerError] = useState("");
  const [departmentServerError, setDepartmentServerError] = useState("");
  const [managerServerError, setManagerServerError] = useState("");
  const [shiftServerError, setShiftServerError] = useState("");

  // Custom error state for required role/privilege/shift
  const [customFormError, setCustomFormError] = useState({
    roleId: "",
    privilegeId: "",
    shiftId: "",
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      employeeCode: "",
      firstName: "",
      lastName: "",
      personalEmail: "",
      officeMail: "",
      phone: "",
      salaryPerMonth: "",
      gender: "",
      designationId: "",
      departmentId: "",
      teamId: "",
      shiftId: "",
      roleId: "",
      privilegeId: "",
    },
  });

  // Watch form values for validation
  const watchedValues = watch();

  // Fetch all required data
  const fetchData = async () => {
    setRoleServerError("");
    setPrivilegeServerError("");
    setDesignationServerError("");
    setDepartmentServerError("");
    setManagerServerError("");
    setShiftServerError("");
    try {
      const [
        rolesRes,
        privilegesRes,
        designationsResponse,
        departmentsResponse,
        teamRes,
        shiftRes,
      ] = await Promise.all([
        roleApi.GettingRoles(),
        privilegeApi.getPrivileges(),
        designationApi.getDesignations(),
        departmentApi.getDepartments(),
        TeamManagementApi.fetchTeams(),
        shiftsApi.getShifts(),
      ]);

      if (rolesRes && rolesRes.success) {
        var temp
        if (role == "HR") {
          temp = "HR"
        }else{
          temp = "CEO"
        }
        const value = rolesRes.data.filter(
          (dat) => dat.name != "ORGANIZATIONHEAD" && dat.name != temp
        );
        setRoles(value);
      } else {
        setRoles([]);
        setRoleServerError(
          rolesRes && rolesRes.error ? rolesRes.error : "Server error while fetching roles."
        );
      }

      // Privileges
      if (privilegesRes && privilegesRes.success) {
        if (role === "HR" || role === "CEO") {
          const values = privilegesRes.data.filter(
            (dat) => dat.name !== "ULTIMATEADMIN"
          );
          setPrivileges(values);
        } else {
          setPrivileges(privilegesRes.data);
        }
      } else {
        setPrivileges([]);
        setPrivilegeServerError(
          privilegesRes && privilegesRes.error
            ? privilegesRes.error
            : "Server error while fetching privileges."
        );
      }

      // Designations
      if (designationsResponse && designationsResponse.success) {
        setDesignations(designationsResponse.data);
      } else {
        setDesignations([]);
        setDesignationServerError(
          designationsResponse && designationsResponse.error
            ? designationsResponse.error
            : "Server error while fetching designations."
        );
      }

      // Departments
      if (departmentsResponse && departmentsResponse.success) {
        setDepartments(departmentsResponse.data);
      } else {
        setDepartments([]);
        setDepartmentServerError(
          departmentsResponse && departmentsResponse.error
            ? departmentsResponse.error
            : "Server error while fetching departments."
        );
      }

      // Teams
      setTeams(teamRes && teamRes.success ? teamRes.data : []);

      // Shifts
      if (shiftRes && shiftRes.success) {
        setShifts(shiftRes.data);
      } else {
        setShifts([]);
        setShiftServerError(
          shiftRes && shiftRes.error ? shiftRes.error : "Server error while fetching shifts."
        );
      }
    } catch (error) {
      setRoles([]);
      setPrivileges([]);
      setDesignations([]);
      setDepartments([]);
      setTeams([]);
      setShifts([]);
      setRoleServerError("Server error while fetching roles.");
      setPrivilegeServerError("Server error while fetching privileges.");
      setDesignationServerError("Server error while fetching designations.");
      setDepartmentServerError("Server error while fetching departments.");
      setShiftServerError("Server error while fetching shifts.");
      console.error("Error fetching data:", error);
    }
  };

  // Custom validation for employeeCode: alphanumeric, 4-10 chars, no special chars
  const validateEmployeeCode = (value) => {
    if (!value) return "Employee code is required";
    if (!/^[A-Za-z0-9]{4,10}$/.test(value)) {
      return "Employee code must be 4-10 alphanumeric characters (no special characters)";
    }
    return true;
  };

  const validateName = (value, fieldName) => {
    if (!value) return `${fieldName} is required`;
    if (!/^[A-Z][a-zA-Z]{1,49}$/.test(value))
      return `${fieldName} must start with a capital letter and contain only alphabets (2-50 chars)`;
    return true;
  };

  const validateEmail = (value, fieldName, isPersonal = false) => {
    if (isPersonal && !value) return `${fieldName} is required`;
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value))
      return "Invalid email address";
    // Check if personal and office emails are different
    if (isPersonal && watchedValues.officeMail && value === watchedValues.officeMail) {
      return "Personal email cannot match office email";
    }
    if (!isPersonal && watchedValues.personalEmail && value === watchedValues.personalEmail) {
      return "Office email cannot match personal email";
    }
    return true;
  };

  const validatePhone = (value) => {
    if (!value) return "Phone number is required";
    if (!/^[6-9][0-9]{9}$/.test(value))
      return "Phone number must be 10 digits starting with 6-9";
    return true;
  };

  const validateDateOfBirth = () => {
    if (!dateOfBirth) return "Date of birth is required";
    const minDate = subYears(new Date(), 65);
    const maxDate = subYears(new Date(), 18);
    if (isAfter(dateOfBirth, maxDate) || isAfter(minDate, dateOfBirth))
      return "Employee must be between 18 and 65 years old";
    return true;
  };

  const validateDateOfJoining = () => {
    if (!dateOfJoining) return "Date of joining is required";
    if (isAfter(dateOfJoining, new Date())) return "Cannot be a future date";
    return true;
  };

  const validateSalary = (value) => {
    if (!value) return "Salary is required";
    if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(value))
      return "Salary must be a positive number";
    if (parseFloat(value) <= 0) return "Salary must be a positive number";
    return true;
  };

  const validateProfileImage = (file) => {
    if (!file) return true;
    // Only SVG and WEBP allowed
    const allowedTypes = ['image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return "Only SVG and WEBP images are allowed";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "File size must be less than 2MB";
    }
    return true;
  };

  // Sync date pickers with react-hook-form and validate
  useEffect(() => {
    if (dateOfBirth) {
      setValue("dateOfBirth", format(dateOfBirth, "yyyy-MM-dd"), {
        shouldValidate: true,
      });
      trigger("dateOfBirth");
    } else {
      setValue("dateOfBirth", "", { shouldValidate: true });
      trigger("dateOfBirth");
    }
  }, [dateOfBirth, setValue, trigger]);

  useEffect(() => {
    if (dateOfJoining) {
      setValue("dateOfJoining", format(dateOfJoining, "yyyy-MM-dd"), {
        shouldValidate: true,
      });
      trigger("dateOfJoining");
    } else {
      setValue("dateOfJoining", "", { shouldValidate: true });
      trigger("dateOfJoining");
    }
  }, [dateOfJoining, setValue, trigger]);

  // Form submit handler
  const onSubmit = async (data) => {
    // Validate all fields
    const dobValidation = validateDateOfBirth();
    const dojValidation = validateDateOfJoining();

    if (dobValidation !== true) {
      setError("dateOfBirth", { message: dobValidation });
      return;
    }

    if (dojValidation !== true) {
      setError("dateOfJoining", { message: dojValidation });
      return;
    }

    // Validate roleId, privilegeId, and shiftId
    let hasError = false;
    if (!data.roleId) {
      setCustomFormError((prev) => ({ ...prev, roleId: "Role is required" }));
      hasError = true;
    }
    if (!data.privilegeId) {
      setCustomFormError((prev) => ({
        ...prev,
        privilegeId: "Privilege is required",
      }));
      hasError = true;
    }
    if (!data.shiftId) {
      setCustomFormError((prev) => ({
        ...prev,
        shiftId: "Shift is required",
      }));
      hasError = true;
    }
    if (hasError) {
      return;
    }

    try {
      setLoading(true);

      // Prepare FormData
      const formData = new FormData();
      if (data.employeeCode) formData.append("employeeCode", data.employeeCode);
      if (data.firstName) formData.append("firstName", data.firstName);
      if (data.lastName) formData.append("lastName", data.lastName);
      if (data.personalEmail)
        formData.append("personalEmail", data.personalEmail);
      if (data.officeMail) formData.append("officeMail", data.officeMail);
      if (data.phone) formData.append("phone", data.phone);
      if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
      if (data.gender) formData.append("gender", data.gender);
      if (data.dateOfJoining)
        formData.append("dateOfJoining", data.dateOfJoining);
      if (data.roleId) formData.append("roleId", data.roleId);
      if (data.privilegeId) formData.append("privilegeId", data.privilegeId);
      if (data.teamId) formData.append("teamId", data.teamId);
      if (data.shiftId) formData.append("shiftId", data.shiftId);
      if (data.designationId)
        formData.append("designationId", data.designationId);
      if (data.departmentId) formData.append("departmentId", data.departmentId);
      if (data.salaryPerMonth)
        formData.append("salaryPerMonth", data.salaryPerMonth);

      if (profileImage) {
        formData.append("profileImage", profileImage);
        formData.append("profileImageName", profileImage.name);
      }

      const response = await OrganizationApi.addEmployee(formData);
      if (response && response.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>Success</span>
            </div>
          ),
          description: response?.message,
        });

        reset();
        setDateOfBirth(null);
        setDateOfJoining(null);
        setProfileImage(null);
        setOpen(false);
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-md ">
                <RxCross2 />
              </div>{" "}
              <span>Failed</span>
            </div>
          ),
          description:
            response && response.error
              ? response.error
              : "Failed to create employee",
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open/close
  const handleDialogOpen = async (isOpen) => {
    if (isOpen) {
      setOpen(true);
      await fetchData();
    } else {
      setOpen(false);
      reset();
      setDateOfBirth(null);
      setDateOfJoining(null);
      setProfileImage(null);
      setCustomFormError({ roleId: "", privilegeId: "", shiftId: "" });
      // Clear server errors
      setRoleServerError("");
      setPrivilegeServerError("");
      setDesignationServerError("");
      setDepartmentServerError("");
      setShiftServerError("");
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateProfileImage(file);
      if (validation === true) {
        setProfileImage(file);
        clearErrors("profileImage");
      } else {
        setError("profileImage", { message: validation });
        setProfileImage(null);
      }
    } else {
      setProfileImage(null);
      clearErrors("profileImage");
    }
  };

  // Handle numeric input for employee code
  const handleEmployeeCodeInput = (e) => {
    setValue("employeeCode", e.target.value, { shouldValidate: true });
  };

  // Handle numeric input for salary
  const handleSalaryInput = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
    setValue("salaryPerMonth", value, { shouldValidate: true });
  };

  // Handle phone number input
  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    // Limit to 10 digits
    e.target.value = value.slice(0, 10);
    setValue("phone", value, { shouldValidate: true });
  };

  // Render
  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Code (Required) */}
            <FormField
              label="Employee Code*"
              id="employeeCode"
              error={errors.employeeCode}
            >
              <Input
                id="employeeCode"
                type="text"
                inputMode="numeric"
                {...register("employeeCode", {
                  required: "Employee code is required",
                  validate: validateEmployeeCode,
                })}
                onChange={handleEmployeeCodeInput}
                placeholder="EMP01"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* First Name (Required) */}
            <FormField
              label="First Name*"
              id="firstName"
              error={errors.firstName}
            >
              <Input
                id="firstName"
                {...register("firstName", {
                  required: "First name is required",
                  validate: (value) => validateName(value, "First name"),
                  pattern: {
                    value: /^[A-Z][a-zA-Z]{1,49}$/,
                    message: "First name must start with a capital letter and contain only alphabets (2-50 chars)",
                  },
                })}
                placeholder="John"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Last Name (Required) */}
            <FormField label="Last Name*" id="lastName" error={errors.lastName}>
              <Input
                id="lastName"
                {...register("lastName", {
                  required: "Last name is required",
                  validate: (value) => validateName(value, "Last name"),
                  pattern: {
                    value: /^[A-Z][a-zA-Z]{1,49}$/,
                    message: "Last name must start with a capital letter and contain only alphabets (2-50 chars)",
                  },
                })}
                placeholder="Doe"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Personal Email (Required) */}
            <FormField
              label="Personal Email*"
              id="personalEmail"
              error={errors.personalEmail}
            >
              <Input
                id="personalEmail"
                type="email"
                {...register("personalEmail", {
                  required: "Personal email is required",
                  validate: (value) => validateEmail(value, "Personal email", true),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="john.doe@gmail.com"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Office Email (Optional) */}
            <FormField
              label="Office Email"
              id="officeMail"
              error={errors.officeMail}
            >
              <Input
                id="officeMail"
                type="email"
                {...register("officeMail", {
                  validate: (value) => validateEmail(value, "Office email"),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="john.doe@company.com"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Phone (Required) */}
            <FormField label="Phone Number*" id="phone" error={errors.phone}>
              <Input
                id="phone"
                type="text"
                inputMode="numeric"
                maxLength={10}
                {...register("phone", {
                  required: "Phone number is required",
                  validate: validatePhone,
                  pattern: {
                    value: /^[6-9][0-9]{9}$/,
                    message: "Phone number must be 10 digits starting with 6-9",
                  },
                })}
                onChange={handlePhoneInput}
                placeholder="9876543210"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Salary Per Month (Required) */}
            <FormField
              label="Salary Per Month*"
              id="salaryPerMonth"
              error={errors.salaryPerMonth}
            >
              <Input
                id="salaryPerMonth"
                type="text"
                inputMode="decimal"
                {...register("salaryPerMonth", {
                  required: "Salary is required",
                  validate: validateSalary,
                  pattern: {
                    value: /^[0-9]+(\.[0-9]{1,2})?$/,
                    message: "Salary must be a positive number",
                  },
                })}
                onChange={handleSalaryInput}
                placeholder="50000"
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Date of Birth (Required) */}
            <FormField
              label="Date of Birth*"
              id="dateOfBirth"
              error={errors.dateOfBirth}
            >
              <Popover
                open={calendarOpen.dob}
                onOpenChange={(open) =>
                  setCalendarOpen((prev) => ({ ...prev, dob: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-900",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                    style={{ border: "none" }}
                    type="button"
                  >
                    {dateOfBirth ? (
                      format(dateOfBirth, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-neutral-50 dark:bg-neutral-900"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={(date) => {
                      setDateOfBirth(date);
                      setCalendarOpen((prev) => ({ ...prev, dob: false }));
                    }}
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear() - 65}
                    toYear={new Date().getFullYear() - 18}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                {...register("dateOfBirth", {
                  required: "Date of birth is required",
                })}
                value={dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : ""}
                readOnly
              />
            </FormField>

            {/* Gender (Required) */}
            <FormField label="Gender*" id="gender" error={errors.gender}>
              <Select
                onValueChange={(value) =>
                  setValue("gender", value, { shouldValidate: true })
                }
                value={watch("gender") || ""}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="PREFER NOT TO SAY">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("gender", { required: "Gender is required" })}
                value={watch("gender") || ""}
                readOnly
              />
            </FormField>

            {/* Date of Joining (Required) */}
            <FormField
              label="Date of Joining*"
              id="dateOfJoining"
              error={errors.dateOfJoining}
            >
              <Popover
                open={calendarOpen.doj}
                onOpenChange={(open) =>
                  setCalendarOpen((prev) => ({ ...prev, doj: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-900",
                      !dateOfJoining && "text-muted-foreground"
                    )}
                    style={{ border: "none" }}
                    type="button"
                  >
                    {dateOfJoining ? (
                      format(dateOfJoining, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-neutral-50 dark:bg-neutral-900"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dateOfJoining}
                    onSelect={(date) => {
                      setDateOfJoining(date);
                      setCalendarOpen((prev) => ({ ...prev, doj: false }));
                    }}
                    captionLayout="dropdown"
                    fromYear={2000}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                {...register("dateOfJoining", {
                  required: "Date of joining is required",
                })}
                value={dateOfJoining ? format(dateOfJoining, "yyyy-MM-dd") : ""}
                readOnly
              />
            </FormField>

            {/* Profile Image (Optional) */}
            <FormField
              label="Profile Image (SVG or WEBP only)"
              id="profileImage"
              error={errors.profileImage}
            >
              <Input
                id="profileImage"
                type="file"
                accept=".svg,.webp,image/svg+xml,image/webp"
                onChange={handleProfileImageChange}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                style={{ border: "none" }}
              />
            </FormField>

            {/* Role Selection (Required) */}
            <FormField
              label="Role*"
              id="roleId"
              error={
                errors.roleId ||
                (customFormError.roleId
                  ? { message: customFormError.roleId }
                  : undefined)
              }
            >
              <Select
                onValueChange={(value) => {
                  setValue("roleId", value, { shouldValidate: true });
                  setCustomFormError((prev) => ({ ...prev, roleId: "" }));
                  trigger("roleId");
                }}
                value={watch("roleId") || ""}
                disabled={roles.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {roles.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("roleId", { required: "Role is required" })}
                value={watch("roleId") || ""}
                readOnly
              />
              {roleServerError && (
                <p className="text-sm text-red-500 mt-1">{roleServerError}</p>
              )}
            </FormField>

            {/* Privilege Selection (Required) */}
            <FormField
              label="Privilege*"
              id="privilegeId"
              error={
                errors.privilegeId ||
                (customFormError.privilegeId
                  ? { message: customFormError.privilegeId }
                  : undefined)
              }
            >
              <Select
                onValueChange={(value) => {
                  setValue("privilegeId", value, { shouldValidate: true });
                  setCustomFormError((prev) => ({ ...prev, privilegeId: "" }));
                  trigger("privilegeId");
                }}
                value={watch("privilegeId") || ""}
                disabled={privileges.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a privilege" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {privileges.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    privileges.map((privilege) => (
                      <SelectItem key={privilege._id} value={privilege._id}>
                        {privilege.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("privilegeId", {
                  required: "Privilege is required",
                })}
                value={watch("privilegeId") || ""}
                readOnly
              />
              {privilegeServerError && (
                <p className="text-sm text-red-500 mt-1">
                  {privilegeServerError}
                </p>
              )}
            </FormField>

            {/* Designation Selection (Optional) */}
            <FormField
              label="Designation"
              id="designationId"
              error={errors.designationId}
            >
              <Select
                onValueChange={(value) => {
                  setValue("designationId", value, { shouldValidate: true });
                  trigger("designationId");
                }}
                value={watch("designationId") || ""}
                disabled={designations.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a designation" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {designations.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    designations.map((designation) => (
                      <SelectItem key={designation._id} value={designation._id}>
                        {designation.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("designationId")}
                value={watch("designationId") || ""}
                readOnly
              />
              {designationServerError && (
                <p className="text-sm text-red-500 mt-1">
                  {designationServerError}
                </p>
              )}
            </FormField>

            {/* Department Selection (Optional) */}
            <FormField
              label="Department"
              id="departmentId"
              error={errors.departmentId}
            >
              <Select
                onValueChange={(value) => {
                  setValue("departmentId", value, { shouldValidate: true });
                  trigger("departmentId");
                }}
                value={watch("departmentId") || ""}
                disabled={departments.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {departments.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("departmentId")}
                value={watch("departmentId") || ""}
                readOnly
              />
              {departmentServerError && (
                <p className="text-sm text-red-500 mt-1">
                  {departmentServerError}
                </p>
              )}
            </FormField>

            {/* Team Selection (Optional) */}
            <FormField label="Team" id="teamId" error={errors.teamId}>
              <Select
                onValueChange={(value) => setValue("teamId", value)}
                value={watch("teamId") || ""}
                disabled={teams.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {teams.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team && team.teamName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormField>

            {/* Shift Selection (Required) */}
            <FormField
              label="Shift*"
              id="shiftId"
              error={
                errors.shiftId ||
                (customFormError.shiftId
                  ? { message: customFormError.shiftId }
                  : undefined)
              }
            >
              <Select
                onValueChange={(value) => {
                  setValue("shiftId", value, { shouldValidate: true });
                  setCustomFormError((prev) => ({ ...prev, shiftId: "" }));
                  trigger("shiftId");
                }}
                value={watch("shiftId") || ""}
                disabled={shifts.length === 0}
              >
                <SelectTrigger
                  className="bg-neutral-50 dark:bg-neutral-900"
                  style={{ border: "none" }}
                >
                  <SelectValue placeholder="Select a shift" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                  {shifts.length === 0 ? (
                    <div className="p-2 text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    shifts.map((shift) => (
                      <SelectItem key={shift._id} value={shift._id}>
                        {shift.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("shiftId", { required: "Shift is required" })}
                value={watch("shiftId") || ""}
                readOnly
              />
              {shiftServerError && (
                <p className="text-sm text-red-500 mt-1">{shiftServerError}</p>
              )}
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpen(false)}
              className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading ||
              customFormError.roleId ||
              customFormError.privilegeId ||
              customFormError.shiftId ||
              roleServerError ||
              privilegeServerError ||
              shiftServerError}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Reusable form field wrapper
function FormField({ label, id, error, children }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error.message || error || "Please select a value"}
        </p>
      )}
    </div>
  );
}

export default HireEmployee;