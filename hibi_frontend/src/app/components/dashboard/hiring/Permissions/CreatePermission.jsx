'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import permissionApi from '@/Apis/permission_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';

const ALLOWED_TYPES = [
    { value: 'EARLYOUT', label: 'Early Out' },
    { value: 'LATEIN', label: 'Late In' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'GENERAL', label: 'General' },
];

export default function CreatePermission({ refresh, close }) {
    const { toast } = useToast();
    const form = useForm({ defaultValues: { permissionType: '' }, mode: 'onTouched' });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        // Only allow if permissionType is in allowed list
        if (!ALLOWED_TYPES.some(t => t.value === data.permissionType)) {
            form.setError('permissionType', { type: 'manual', message: 'Invalid permission type selected.' });
            return;
        }
        setLoading(true);
        try {
            const res = await permissionApi.createPermissionType(data);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Permission type created successfully!</span>
                        </div>
                    ),
                });
                refresh();
                close();
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error || "Failed to create permission type."}</span>
                        </div>
                    ),
                });
                console.error('Error creating permission type:', res.error);
            }
        } catch (err) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Something went wrong.</span>
                    </div>
                ),
            });
            console.error('Error creating permission type:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        // Loader skeletons if loading, like UpdateDepartment
        return (
            <div className="w-full">
                <div className="flex flex-col gap-2">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-10" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="permissionType"
                    control={form.control}
                    rules={{
                        required: 'Permission type is required',
                        validate: value =>
                            ALLOWED_TYPES.some(t => t.value === value) || 'Invalid permission type selected.',
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Permission Type</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select permission type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ALLOWED_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
