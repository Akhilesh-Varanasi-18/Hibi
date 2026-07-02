"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"

export function ContactDialog({ 
  open, 
  onOpenChange, 
  data, 
  onSave,
  isLoading = false 
}) {
  const [formData, setFormData] = useState(data || {});
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData(data || {});
    }
  }, [open, data]);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const checkForDigits = (value, fieldName) => {
    if (/\d/.test(value)) {
      throw new Error(`${fieldName} should not contain digits`);
    }
    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    // Contact name validation (4-20 chars, first letter capital, no digits)
    if (!formData.name) {
      newErrors.name = 'Contact name is required';
    } else if (formData.name.length < 4 || formData.name.length > 20) {
      newErrors.name = 'Name must be between 4-20 characters';
    } else if (!/^[A-Z]/.test(formData.name)) {
      newErrors.name = 'First letter must be capital';
    } else {
      try {
        checkForDigits(formData.name, 'Name');
      } catch (error) {
        newErrors.name = error.message;
      }
    }

    // Relationship validation (no digits)
    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    } else {
      try {
        checkForDigits(formData.relationship, 'Relationship');
      } catch (error) {
        newErrors.relationship = error.message;
      }
    }

    // State validation (3-15 characters, no digits)
    if (!formData.state) {
      newErrors.state = 'State is required';
    } else if (formData.state.length < 3 || formData.state.length > 15) {
      newErrors.state = 'State must be between 3-15 characters';
    } else {
      try {
        checkForDigits(formData.state, 'State');
      } catch (error) {
        newErrors.state = error.message;
      }
    }

    // City validation (3-15 characters, no digits)
    if (!formData.city) {
      newErrors.city = 'City is required';
    } else if (formData.city.length < 3 || formData.city.length > 15) {
      newErrors.city = 'City must be between 3-15 characters';
    } else {
      try {
        checkForDigits(formData.city, 'City');
      } catch (error) {
        newErrors.city = error.message;
      }
    }

    // Country validation (3-15 characters, no digits)
    if (!formData.country) {
      newErrors.country = 'Country is required';
    } else if (formData.country.length < 3 || formData.country.length > 15) {
      newErrors.country = 'Country must be between 3-15 characters';
    } else {
      try {
        checkForDigits(formData.country, 'Country');
      } catch (error) {
        newErrors.country = error.message;
      }
    }

    // Phone number validation (10 digits, first digit 6-9)
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Enter a valid 10-digit phone number starting with 6-9';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Address validation (5-50 characters)
    if (!formData.address) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 5 || formData.address.length > 50) {
      newErrors.address = 'Address must be between 5-50 characters';
    }

    // Postal code validation (6 digits)
    if (!formData.postalCode) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!/^\d{6}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Postal code must be 6 digits';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for name field to capitalize first letter
    if (name === 'name' && value.length === 1) {
      setFormData({ ...formData, [name]: value.toUpperCase() });
      return;
    }

    // Prevent non-numeric input for phone and postal code
    if ((name === 'contactNumber' || name === 'postalCode') && value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    if (!isFormValid) return;
    onSave(formData);
  };

  const isEditMode = data && Object.keys(data).length !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90%] overflow-y-scroll" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditMode ? 'Edit' : 'Add'} Contact
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update your contact information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData?.name || ''}
              onChange={handleChange}
              className="bg-muted/50"
              maxLength={20}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Phone Number *</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData?.contactNumber || ''}
                onChange={handleChange}
                className="bg-muted/50"
                maxLength={10}
              />
              {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Select
                name="relationship"
                value={formData?.relationship || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, relationship: value }))
                }
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {['FATHER', 'MOTHER', 'SPOUSE', 'SIBLING', 'FRIEND', 'OTHER'].map((relation) => (
                    <SelectItem key={relation} value={relation}>
                      {relation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relationship && <p className="text-sm text-red-500">{errors.relationship}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData?.email || ''}
              onChange={handleChange}
              className="bg-muted/50"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              name="address"
              value={formData?.address || ''}
              onChange={handleChange}
              className="bg-muted/50"
              maxLength={50}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData?.city || ''}
                onChange={handleChange}
                className="bg-muted/50"
                maxLength={15}
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                value={formData?.state || ''}
                onChange={handleChange}
                className="bg-muted/50"
                maxLength={15}
              />
              {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData?.postalCode || ''}
                onChange={handleChange}
                className="bg-muted/50"
                maxLength={6}
              />
              {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                value={formData?.country || ''}
                onChange={handleChange}
                className="bg-muted/50"
                maxLength={15}
              />
              {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}