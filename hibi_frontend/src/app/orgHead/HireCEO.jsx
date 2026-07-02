"use client";

/*
  Lets you add a new CEO (organization head) using a dialog form.
  The form UI and logic are handled by DynamicFormDialog.
*/

import { useState, useEffect } from 'react';
import { getAllPrevilages, getAllRoles } from '@/Apis/Common_APIs';
import OrganizationApi from '@/Apis/Organization_Management';
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { subYears } from "date-fns";
import { DynamicFormDialog } from '@/app/components/ReusableComponents/DynamicFormDialog';
import {
  Genders,
  ValidateDOB,
  ValidateDOJ,
  ValidateEmployeeCode,
  ValidateFirstName,
  ValidateGender,
  ValidateLastName,
  ValidatePhone,
  ValidatePrivileges,
  ValidateProfilePicture,
  ValidateRole,
  ValidateSalary
} from '@/utils/Validations';
import { Plus } from 'lucide-react';

const HireCEO = ({ refresh }) => {
  const { toast } = useToast();

  // Store available roles and privileges after fetching
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch roles and privileges, filter for CEO and SUPERADMIN
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, privilegesRes] = await Promise.all([
          getAllRoles(),
          getAllPrevilages()
        ]);
        if (rolesRes.success) {
          // Only CEO role
          setRoles((rolesRes.data?.roles || []).filter(
            (role) => role.name && role.name.toUpperCase() === "CEO"
          ));
        }
        if (privilegesRes.success) {
          // Only SUPERADMIN privilege
          setPrivileges((privilegesRes.data || []).filter(
            (priv) => priv.name && priv.name.toUpperCase() === "SUPERADMIN"
          ));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>Couldn't load form data. Please try again.</span>
            </div>
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set allowed date of birth range (18-65 years old)
  const today = new Date();
  const dobToYear = subYears(today, 18);
  const dobFromYear = subYears(today, 65);

  // Configuration for the dynamic form dialog
  const formConfig = {
    Title: "Create New CEO",
    Desc: "Fill in the CEO details below",
    DialogLabel: (
      <span className="flex items-center gap-2">
        <Plus />
        Create CEO
      </span>
    ),
    submitLabel: "Add CEO",
    DialogVariant: "default",

    // Handle form submission
    onSubmit: async (formData) => {
      try {
        // Log form data for debugging
        console.log("=== FormData Contents ===");
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        // Send data to backend
        const response = await OrganizationApi.addEmployee(formData);

        if (response.success) {
          if (refresh) refresh();
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-green-500 rounded-full text-lg">
                  <TiTick />
                </div>
                <span>
                  {response?.message || "CEO created successfully!"}
                </span>
              </div>
            ),
          });
        } else {
          toast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-red-500 rounded-full text-lg">
                  <RxCross2 />
                </div>
                <span>
                  {response?.error || "Failed to create CEO"}
                </span>
              </div>
            ),
          });
        }
      } catch (error) {
        console.error("Error creating CEO:", error);
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>Something went wrong. Please try again.</span>
            </div>
          ),
        });
      }
    },

    // Fields for the CEO form
    Fields: [
      {
        name: "employeeCode",
        type: "text",
        label: "Employee Code",
        placeholder: "EMP001",
        required: true,
        validate: ValidateEmployeeCode,
        errorMessage: "Employee code is required"
      },
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        placeholder: "John",
        required: true,
        validate: ValidateFirstName,
        errorMessage: "First name is required"
      },
      {
        name: "lastName",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
        required: true,
        validate: ValidateLastName
      },
      {
        name: "personalEmail",
        type: "email",
        label: "Personal Email",
        placeholder: "Personal Email",
        required: true,
        // Validation for personal email
        validate: (value, allValues) => {
          if (!value) return "Personal email is required";
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
            return "Invalid email address";
          }
          if (
            allValues &&
            allValues.officeMail &&
            value.trim().toLowerCase() === allValues.officeMail.trim().toLowerCase()
          ) {
            return "Personal email cannot be the same as office email";
          }
          return true;
        },
        errorMessage: "Personal email is required"
      },
      {
        name: "officeMail",
        type: "email",
        label: "Office Email",
        placeholder: "Office Email",
        required: false,
        // Validation for office email
        validate: (value) => {
          if (!value) return true;
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
            return "Invalid email address";
          }
          return true;
        }
      },
      {
        name: "phone",
        type: "tel",
        label: "Phone Number",
        placeholder: "9876543210",
        required: true,
        validate: ValidatePhone,
        errorMessage: "Phone number is required"
      },
      {
        name: "salaryPerMonth",
        type: "number",
        label: "Salary Per Month",
        placeholder: "50000",
        required: true,
        validate: ValidateSalary,
        errorMessage: "Salary per month is required"
      },
      {
        name: "dateOfBirth",
        type: "calendar",
        label: "Date of Birth",
        required: true,
        showFrom: dobFromYear,
        showTo: dobToYear,
        validate: ValidateDOB,
        errorMessage: "Date of birth is required"
      },
      {
        name: "gender",
        type: "select",
        label: "Gender",
        placeholder: "Select gender",
        required: true,
        array: Genders,
        validate: ValidateGender,
        errorMessage: "Gender is required"
      },
      {
        name: "dateOfJoining",
        type: "calendar",
        label: "Date of Joining",
        required: true,
        showFrom: new Date(1900, 0, 1),
        showTo: today,
        validate: ValidateDOJ,
        errorMessage: "Date of joining is required"
      },
      {
        name: "profileImage",
        type: "file",
        label: "Profile Image (SVG or WEBP only)",
        required: false,
        fileType: "image",
        maxSize: 2,
        allowedTypes: ["image/svg+xml", "image/webp"],
        validate: ValidateProfilePicture,
        errorMessage: "Invalid profile image format"
      },
      {
        name: "roleId",
        type: "select",
        label: "Role",
        placeholder: "Select a role",
        required: true,
        array: roles,
        validate: ValidateRole,
        errorMessage: "Role is required"
      },
      {
        name: "privilegeId",
        type: "select",
        label: "Privilege",
        placeholder: "Select a privilege",
        required: true,
        array: privileges,
        validate: ValidatePrivileges,
        errorMessage: "Privilege is required"
      }
    ]
  };

  // loading while fetching roles and privileges
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <DynamicFormDialog config={formConfig} />;
};

export default HireCEO;