"use client";
/**
 * ManualAddComponent.jsx
 * 
 * This component provides a manual form for adding a new organization.
 * 
 * Main Features:
 * - Allows user to manually input organization name, address, GST number, registration date, organization email, and app password.
 * - Validates required fields (name, address) and GST format (if provided).
 * - Uses react-hook-form for form state management and validation.
 * - Uses shadcn/ui components for consistent UI.
 * - Shows loading state and disables submit button while creating.
 * - Notifies parent component and shows toast on success or failure.
 * - Handles dialog close and form reset.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid as isValidDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";

/**
 * ManualAddComponent
 * 
 * Props:
 * - form: react-hook-form instance for managing form state.
 * - refresh: callback to refresh parent data after successful creation.
 * - creatingOrg: boolean indicating if organization creation is in progress.
 * - setCreatingOrg: function to set creatingOrg state.
 * - handleCloseDialog: function to close the dialog/modal.
 */
function ManualAddComponent({ form, refresh, creatingOrg, setCreatingOrg, handleCloseDialog }) {
  // Destructure helpers from form
  const { control, trigger, watch } = form;
  const { toast } = useToast();
  
  // State for GST error message (manual validation)
  const [manualGstError, setManualGstError] = useState("");
  // State to control popover (calendar) open/close for registration date
  const [manualRegDatePopoverOpen, setManualRegDatePopoverOpen] = useState(false);

  // Watch required fields to determine if submit button should be enabled
  const watchedFields = watch(["name", "address"]);
  // Button is enabled only if both name and address are non-empty
  const isFormValid = watchedFields[0]?.trim() && watchedFields[1]?.trim();

  /**
   * Handles manual form submission for creating an organization.
   * - Validates required fields.
   * - Shows GST error if invalid.
   * - Calls backend API to create organization.
   * - Shows toast on success/failure.
   * - Notifies parent and closes dialog on success.
   */
  const handleManualSubmit = async () => {
    // Validate required fields (name, address)
    const isValid = await trigger(["name", "address"]);
    
    if (!isValid) {
      // If validation fails, show GST error if present
      const errors = form.formState.errors;
      if (errors && errors.gstNumber) {
        setManualGstError(errors.gstNumber.message);
      }
      return;
    }

    // Get all form values
    const formData = form.getValues();
    
    // Prepare payload for API
    const payload = {
      gstNumber: typeof formData.gstNumber === "string" ? formData.gstNumber : "",
      name: typeof formData.name === "string" ? formData.name : "",
      address: typeof formData.address === "string" ? formData.address : "",
      status: "Active",
      regDate: typeof formData.regDate === "string" ? formData.regDate : "",
      organizationEmail: typeof formData.organizationEmail === "string" ? formData.organizationEmail : "",
      organizationAppPassword: typeof formData.organizationAppPassword === "string" ? formData.organizationAppPassword : "",
    };

    setCreatingOrg(true);
    try {
      // Call backend API to create organization
      const data = await OrganizationApi.createOrganization(payload);
      if (data && data.success) {
        // On success: close dialog, show success toast, refresh parent
        handleCloseDialog();
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>{data?.message || "Organization created successfully"}</span>
            </div>
          ),
        });
        refresh();
      } else {
        // On failure: show error toast
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{(data && data.error) || "Organization creation failed"}</span>
            </div>
          ),
        });
      }
    } catch (err) {
      // Optionally log error (could add error toast here)
    } finally {
      setCreatingOrg(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {/* Organization Name Field (required) */}
      <FormField
        control={control}
        name="name"
        rules={{ required: "Organization name is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm" htmlFor="name">
              Organization Name*
            </FormLabel>
            <FormControl>
              <Input
                id="name"
                {...field}
                placeholder="Enter organization name"
                className="h-8 text-xs sm:h-10 sm:text-sm"
              />
            </FormControl>
            {/* Show validation error for name */}
            {form.formState.errors && form.formState.errors.name && (
              <FormMessage>
                <span className="text-xs sm:text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </span>
              </FormMessage>
            )}
          </FormItem>
        )}
      />

      {/* Address Field (required) */}
      <FormField
        control={control}
        name="address"
        rules={{ required: "Address is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm" htmlFor="address">
              Address*
            </FormLabel>
            <FormControl>
              <Input
                id="address"
                {...field}
                placeholder="Enter organization address"
                className="h-8 text-xs sm:h-10 sm:text-sm"
              />
            </FormControl>
            {/* Show validation error for address */}
            {form.formState.errors && form.formState.errors.address && (
              <FormMessage>
                <span className="text-xs sm:text-sm text-red-500 mt-1">
                  {form.formState.errors.address.message}
                </span>
              </FormMessage>
            )}
          </FormItem>
        )}
      />

      {/* Organization Email Field (required) */}
      <FormField
        control={control}
        name="organizationEmail"
        rules={{
          required: "Organization email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email address",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm" htmlFor="organizationEmail">
              Organization Email*
            </FormLabel>
            <FormControl>
              <Input
                id="organizationEmail"
                {...field}
                placeholder="Enter organization email"
                className="h-8 text-xs sm:h-10 sm:text-sm"
                autoComplete="email"
              />
            </FormControl>
            {/* Show validation error for organizationEmail */}
            {form.formState.errors && form.formState.errors.organizationEmail && (
              <FormMessage>
                <span className="text-xs sm:text-sm text-red-500 mt-1">
                  {form.formState.errors.organizationEmail.message}
                </span>
              </FormMessage>
            )}
          </FormItem>
        )}
      />

      {/* Organization App Password Field (required) */}
      <FormField
        control={control}
        name="organizationAppPassword"
        rules={{
          required: "Organization app password is required",
        }}
        defaultValue="jygb szag gxwz nmti"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm" htmlFor="organizationAppPassword">
              Organization App Password*
            </FormLabel>
            <FormControl>
              <Input
                id="organizationAppPassword"
                {...field}
                placeholder="Enter app password"
                className="h-8 text-xs sm:h-10 sm:text-sm"
                type="text"
                autoComplete="new-password"
              />
            </FormControl>
            {/* Show validation error for organizationAppPassword */}
            {form.formState.errors && form.formState.errors.organizationAppPassword && (
              <FormMessage>
                <span className="text-xs sm:text-sm text-red-500 mt-1">
                  {form.formState.errors.organizationAppPassword.message}
                </span>
              </FormMessage>
            )}
          </FormItem>
        )}
      />

      {/* GST Number Field (optional, but validated if present) */}
      <FormField
        control={control}
        name="gstNumber"
        rules={{
          pattern: {
            value: /^[0-9A-Z]{15}$/,
            message: "Invalid GST format",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm" htmlFor="gstNumberManual">
              GST Number
            </FormLabel>
            <FormControl>
              <Input
                id="gstNumberManual"
                {...field}
                placeholder="07AAPCA6346P1ZX (optional)"
                className="h-8 text-xs sm:h-10 sm:text-sm"
              />
            </FormControl>
            {/* Show GST error if present */}
            {manualGstError && (
              <FormMessage>
                <span className="text-xs sm:text-sm text-red-500 mt-1">
                  {manualGstError}
                </span>
              </FormMessage>
            )}
          </FormItem>
        )}
      />

      {/* Registration Date Field (uses popover calendar) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormField
            control={control}
            name="regDate"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm" htmlFor="regDate">
                  Registration Date
                </FormLabel>
                <FormControl>
                  {/* Popover for calendar date picker */}
                  <Popover open={manualRegDatePopoverOpen} onOpenChange={setManualRegDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8 text-xs sm:h-10 sm:text-sm",
                          !value && "text-muted-foreground"
                        )}
                        type="button"
                        id="regDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {/* Show selected date or placeholder */}
                        {value && isValidDate(new Date(value)) ? format(new Date(value), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          value && isValidDate(new Date(value)) ? new Date(value) : undefined
                        }
                        onSelect={(date) => {
                          // Set date in yyyy-MM-dd format
                          onChange(date && isValidDate(date) ? format(date, "yyyy-MM-dd") : "");
                          setManualRegDatePopoverOpen(false);
                        }}
                        initialFocus
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      <div className='flex items-center gap-4 justify-end w-full'>
        {/* Cancel button closes the dialog */}
        <Button
          type="button"
          variant="outline"
          onClick={handleCloseDialog}
        >
          Cancel
        </Button>
        {/* Create Organization button triggers form submission */}
        <Button
          type="button"
          onClick={handleManualSubmit}
          className="h-8 px-3 "
          disabled={creatingOrg || !isFormValid}
        >
          {creatingOrg ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Creating Organization...</span>
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      </div>
    </div>
  );
}

export default ManualAddComponent;