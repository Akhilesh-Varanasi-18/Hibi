"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function PersonalDetailsDialog({ 
  open, 
  onOpenChange, 
  data, 
  onSave,
  isLoading = false 
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(data || {});
    }
  }, [open, data]);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    // Helper function to check for digits
    const checkForDigits = (value, fieldName) => {
      if (/\d/.test(value)) {
        return `${fieldName} should not contain digits`;
      }
      return null;
    };
    
    // Blood group validation
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    // Marital status validation
    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital status is required';
    }

    // Address validation (5-50 characters, no digits)
    if (!formData.address) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 5 || formData.address.length > 50) {
      newErrors.address = 'Address must be between 5-50 characters';
    } 

    // City validation (3-15 characters, no digits)
    if (!formData.city) {
      newErrors.city = 'City is required';
    } else if (formData.city.length < 3 || formData.city.length > 15) {
      newErrors.city = 'City must be between 3-15 characters';
    } else {
      const digitError = checkForDigits(formData.city, 'City');
      if (digitError) newErrors.city = digitError;
    }

    // State validation (3-15 characters, no digits)
    if (!formData.state) {
      newErrors.state = 'State is required';
    } else if (formData.state.length < 3 || formData.state.length > 15) {
      newErrors.state = 'State must be between 3-15 characters';
    } else {
      const digitError = checkForDigits(formData.state, 'State');
      if (digitError) newErrors.state = digitError;
    }

    // Postal code validation (6 digits only)
    if (!formData.postalCode) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!/^\d{6}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Postal code must be 6 digits';
    }

    // Country validation (3-15 characters, no digits)
    if (!formData.country) {
      newErrors.country = 'Country is required';
    } else if (formData.country.length < 3 || formData.country.length > 15) {
      newErrors.country = 'Country must be between 3-15 characters';
    } else {
      const digitError = checkForDigits(formData.country, 'Country');
      if (digitError) newErrors.country = digitError;
    }

    // Secondary phone validation (optional but must be valid if provided)
    if (formData.secondaryPhone && !/^[6-9]\d{9}$/.test(formData.secondaryPhone)) {
      newErrors.secondaryPhone = 'Enter a valid 10-digit phone number starting with 6-9';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent non-numeric input for phone and postal code
    if ((name === 'postalCode' || name === 'secondaryPhone') && value !== '' && !/^\d+$/.test(value)) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90%] overflow-y-auto" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditMode ? 'Edit' : 'Add'} Personal Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update your personal information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group *</Label>
              <Select
                name="bloodGroup"
                value={formData?.bloodGroup || ''}
                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <Select
                name="maritalStatus"
                value={formData?.maritalStatus || ''}
                onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"].map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.maritalStatus && <p className="text-sm text-red-500">{errors.maritalStatus}</p>}
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData?.postalCode || ''}
                onChange={handleChange}
                className="bg-muted/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                maxLength={6}
              />
              {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">Secondary Phone</Label>
            <Input
              id="secondaryPhone"
              name="secondaryPhone"
              value={formData?.secondaryPhone || ''}
              onChange={handleChange}
              className="bg-muted/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              maxLength={10}
              placeholder="Optional"
            />
            {errors.secondaryPhone && <p className="text-sm text-red-500">{errors.secondaryPhone}</p>}
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

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Add Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}