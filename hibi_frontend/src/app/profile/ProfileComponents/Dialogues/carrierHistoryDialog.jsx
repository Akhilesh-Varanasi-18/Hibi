import MultipleDateSelector from '@/app/components/ReusableComponents/MultipleDateSelector';
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react'
import CarrierApi from '@/Apis/CarrierHistory';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';

const CarrierHistoryDialog = ({ open, setOpen, data, onSave }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [errors, setErrors] = useState({});
    const [date, setDate] = useState({
        to: new Date(),
        from: new Date(new Date().setDate(new Date().getDate() - 30))
    });

    const [formData, setFormData] = useState({
        organizationName: '',
        role: '',
        description: ''
    });

    const isEdit = !!data;

    // Initialize form data when data prop changes
    useEffect(() => {
        if (data) {
            setFormData({
                organizationName: data.organizationName || '',
                role: data.role || '',
                description: data.description || ''
            });
            setDate({
                from: data.startDate ? new Date(data.startDate) : new Date(),
                to: data.endDate ? new Date(data.endDate) : new Date()
            });
        }
    }, [data]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newError = {};

        // Date validation
        if (!date.from || !date.to) {
            newError.date = "Both start and end dates are required";
        } else if (date.from > date.to) {
            newError.date = "End date cannot be before start date";
        } else {
            // Calculate difference in days
            const diffTime = Math.abs(date.to - date.from);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 30) {
                newError.date = "The difference between start and end date must be at least 30 days";
            }
        }

        // Organization name validation
        if (!formData.organizationName.trim()) {
            newError.organizationName = "Organization name is required";
        } else if (formData.organizationName.trim().length < 2 || formData.organizationName.trim().length > 100) {
            newError.organizationName = "Organization name must be between 2-100 characters";
        }

        // Role validation
        if (!formData.role.trim()) {
            newError.role = "Role is required";
        } else if (formData.role.trim().length < 2 || formData.role.trim().length > 50) {
            newError.role = "Role must be between 2-50 characters";
        }

        // Description validation
        if (!formData.description.trim()) {
            newError.description = "Description is required";
        } else if (formData.description.trim().length < 5 || formData.description.trim().length > 500) {
            newError.description = "Description must be between 5-500 characters";
        }

        setErrors(newError);
        return Object.keys(newError).length === 0;
    };

    useEffect(() => {
        validateForm();
    }, [date, formData])

    const handleDateFormat = (dateString) => {
        const date = new Date(dateString);
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    }

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                startDate: handleDateFormat(date.from),
                endDate: handleDateFormat(date.to),
                organizationName: formData.organizationName.trim(),
                role: formData.role.trim(),
                description: formData.description.trim()
            };
            if (isEdit) {
                const res = await CarrierApi.updateHistory(payload, data._id);
                if (res.success) {
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>{res?.data?.message}</span>
                        </div>,
                    })
                    console.log(res.data)
                    await onSave(payload);
                    setOpen(false);
                    resetForm();
                }
                else {
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error}</span>
                        </div>,
                    })
                }
            }
            else {
                const res = await CarrierApi.createHistory(payload);
                if (res.success) {
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>{res?.data?.message}</span>
                        </div>,
                    })
                    console.log(res.data);
                    await onSave(payload);
                    setOpen(false);
                    resetForm();
                }
                else {
                    toast({
                        title: <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error}</span>
                        </div>,
                    })
                }
            }

        } catch (error) {
            console.error('Error saving career history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            organizationName: '',
            role: '',
            description: ''
        });
        setDate({
            fromDate: new Date(),
            toDate: new Date()
        });
        setErrors({});
    };

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* <DialogTrigger asChild>
                <Button variant="outline">
                    {isEdit ? "Edit Career History" : "Create Career History"}
                </Button>
            </DialogTrigger> */}
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Your Career History" : "Create Your Career History"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? "You are editing your career history" : "You are creating your career history"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Date Selector with Error */}
                    <div className="space-y-2">
                        <Label>Employment Period</Label>
                        <MultipleDateSelector
                            dateRange={date}
                            setDateRange={setDate}
                        />
                        {errors.date && (
                            <p className="text-sm text-red-500">{errors.date}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input
                            name="organizationName"
                            placeholder="Organization Name"
                            value={formData.organizationName}
                            onChange={handleInputChange}
                            className={errors.organizationName ? 'border-red-500' : ''}
                        />
                        {errors.organizationName && (
                            <p className="text-sm text-red-500">{errors.organizationName}</p>
                        )}
                    </div>

                    {/* Role Input */}
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                            name="role"
                            placeholder="Role (e.g., Software Engineer)"
                            value={formData.role}
                            onChange={handleInputChange}
                            className={errors.role ? 'border-red-500' : ''}
                        />
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role}</p>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            name="description"
                            placeholder="Description of your role and responsibilities"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description}</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || Object.keys(errors).length != 0}
                        type="button"
                    >
                        {isEdit ?
                            (isLoading ? "Updating..." : "Update") :
                            (isLoading ? "Creating..." : "Create")
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CarrierHistoryDialog;