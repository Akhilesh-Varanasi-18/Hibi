"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Check, Plus, User, Mail, Phone } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';
import { getAllPrevilages, getAllRoles } from '@/Apis/Common_APIs';

/**
 * Dialog component for adding an organization head
 */
export default function AddOrganizationHeadDialog({ orgId, onSuccess }) {
  // State for roles and privileges
  const [roles, setRoles] = useState([]);
  const [previlages, setPrevilages] = useState([]);

  // Form management
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset 
  } = useForm({
    defaultValues: {
      userName: '',
      email: '',
      phone: '',
    }
  });

  // Component state
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch roles and privileges on mount
  useEffect(() => {
    const fetchRoles = async () => {
      const response = await getAllRoles();
      setRoles(response.data);
    };
    const fetchPrevilages = async () => {
      const response = await getAllPrevilages();
      setPrevilages(response.data);
    };
    fetchRoles();
    fetchPrevilages();
  }, []);

  /**
   * Handles form submission
   * @param {object} formData - Form values
   */
  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      // Prepare payload with orgId
      const payload = {
        ...formData,
        orgId: orgId
      };

      // Make API call
      const response = await OrganizationApi.AddingOrganizationHead(payload);
      if (response.success) {
        onSuccess?.(orgId, payload);
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to add organization head:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resets form and component state
   */
  const resetForm = () => {
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Employee
        </Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Employee
          </DialogTitle>
          <DialogDescription>
            Enter details for the employee
          </DialogDescription>
        </DialogHeader>

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

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email"
                  }
                })}
                placeholder="john@example.com"
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
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                minLength={10}
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Please enter a valid phone number (10 digits)"
                  }
                })}
                placeholder="9876543210"
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                }}
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Dialog Footer */}
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
              {isSubmitting ? "Adding..." : "Add Head"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}