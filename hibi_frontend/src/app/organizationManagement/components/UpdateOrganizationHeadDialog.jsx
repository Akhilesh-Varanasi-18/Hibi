"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, User, Mail, Phone } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';

/**
 * Dialog component to update organization head details.
 * @param {Object} props
 * @param {Object} props.head - Current head details
 * @param {Function} props.onSuccess - Callback on successful update
 */
export default function UpdateOrganizationHeadDialog({ head, onSuccess }) {
  // Initialize form with default values from head prop
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      userName: head?.userName || '',
      email: head?.email || '',
      phone: head?.phone || '',
      _id: head?._id
    }
  });

  // Dialog open state
  const [open, setOpen] = useState(false);
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles form submission and API call to update organization head.
   * @param {Object} formData - Form values
   */
  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      // Call API to update organization head
      const response = await OrganizationApi.UpdatingOrganizationHead(formData);
      if (response.success) {
        resetForm();
        onSuccess?.(formData);
      }
    } catch (error) {
      // Log error if update fails
      console.error("Failed to update organization head:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resets the form and closes the dialog.
   */
  const resetForm = () => {
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Edit trigger button */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>

      {/* Dialog content */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Organization Head
          </DialogTitle>
          <DialogDescription>
            Update details for the organization head
          </DialogDescription>
        </DialogHeader>

        {/* Update form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="userName">Full Name*</Label>
            <div className="relative">
              <Input
                id="userName"
                {...register("userName", {
                  required: "Name is required",
                  minLength: {
                    value: 3,
                    message: "Name must be at least 3 characters"
                  }
                })}
                placeholder="John Doe"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.userName && (
              <p className="text-sm text-red-500">
                {errors.userName.message}
              </p>
            )}
          </div>

          {/* Email Field (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                disabled={true}
                placeholder="john@example.com"
                {...register("email")}
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number*</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: "Please enter a valid phone number (10-15 digits)"
                  }
                })}
                placeholder="9876543210"
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Dialog Footer with Cancel and Submit buttons */}
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Head"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}