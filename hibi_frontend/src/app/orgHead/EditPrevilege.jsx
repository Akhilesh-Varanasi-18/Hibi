import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';
import privilegeApi from '@/Apis/previlege_Api';

const EditPrivilegeDialog = ({
    open,
    onOpenChange,
    privilege,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form when privilege changes
    useEffect(() => {
        if (privilege) {
            setFormData({
                id: privilege._id,
                name: privilege.name,
                description: privilege.description
            });
        }
    }, [privilege]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Validate form
            const response = await privilegeApi.updatePrivilege(formData);
            if (response.success) {
                onOpenChange(false);
                onSave(response.data);
            }
            else {
                console.error("Failed to update privilege:", response.error);
                // Optionally show an error message to the user
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Privilege</DialogTitle>
                        <DialogDescription>
                            Update the privilege details below
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="col-span-3"
                                placeholder="Enter privilege name"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right mt-2">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="col-span-3"
                                rows={4}
                                placeholder="Enter privilege description"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={formData.name.trim().length < 3 || formData.description.trim().length < 3 || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditPrivilegeDialog;