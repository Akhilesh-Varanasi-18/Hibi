"use client";

/**
 * EditOrganizationDialog.jsx
 * 
 * This component provides a dialog/modal for editing an organization's details.
 * It uses react-hook-form for form state management and validation,
 * and shadcn/ui Dialog for modal behavior.
 * 
 * Main Features:
 * - Opens a dialog to edit organization name and description.
 * - Validates input fields (name required, min length).
 * - Calls backend API to update organization details.
 * - Shows loading state while submitting.
 * - Notifies parent component on successful update.
 * - Resets form and closes dialog on cancel or success.
 */

import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Building2 } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';
import { useState } from 'react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";

/**
 * Dialog component for editing an organization's details.
 * 
 * @param {object} organization - The organization object to edit.
 * @param {function} onSuccess - Callback after successful update.
 */
export default function EditOrganizationDialog({ organization, onSuccess }) {
  // Initialize react-hook-form with default values from the organization prop.
  const form = useForm({
    defaultValues: {
      name: organization?.name || '',
      description: organization?.description || '',
    }
  });

  // Destructure helpers from form.
  const { control, handleSubmit, formState: { errors }, reset, watch } = form;

  // State to control dialog open/close.
  const [open, setOpen] = useState(false);
  // State to indicate if submission is in progress (used for loading UI).
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form fields to detect if any changes have been made.
  const watchedFields = watch(["name", "description"]);
  // Determine if form values differ from original organization values.
  const hasChanges = watchedFields[0] !== (organization?.name || '') ||
                     watchedFields[1] !== (organization?.description || '');

  /**
   * Handles the form submission for updating organization details.
   * Calls the backend API and notifies parent on success.
   * @param {object} formData - The updated form values.
   */
  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      // Prepare payload with organizationId as required by backend.
      const payload = {
        ...formData,
        organizationId: organization?._id
      };
      // Call the API to update organization.
      const response = await OrganizationApi.UpdateOrganization(payload);
      if (response.success) {
        // Update local organization object (as per backend response format).
        organization.name = payload.name;
        organization.description = payload.description;
        // Notify parent of successful update.
        onSuccess(organization);
        resetForm();
      }
    } catch (error) {
      // Log any errors during update.
      console.error("Failed to update organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resets the form and closes the dialog.
   * Used for both cancel and after successful update.
   */
  const resetForm = () => {
    reset();
    setOpen(false);
  };

  return (
    // Dialog component controls open/close state.
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Edit trigger button (can be used as a child in a dropdown menu or standalone). */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      {/* Dialog content for editing organization details. */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Organization
          </DialogTitle>
          <DialogDescription>
            Update details for the organization
          </DialogDescription>
        </DialogHeader>
        {/* Form for editing organization details. */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Organization Name Field (required, min length 3). */}
            <FormField
              control={control}
              name="name"
              rules={{
                required: "Name is required",
                minLength: {
                  value: 3,
                  message: "Name must be at least 3 characters"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Organization Name*</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      {...field}
                      placeholder="Organization Name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Organization Description Field (optional). */}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormControl>
                    <Input
                      id="description"
                      {...field}
                      placeholder="Organization description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Dialog Footer with Cancel and Save buttons. */}
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              {/* Cancel button: resets form and closes dialog. */}
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {/* Save button: submits form, disabled if no changes or submitting. */}
              <Button
                type="submit"
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}