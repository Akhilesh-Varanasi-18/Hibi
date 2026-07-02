'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import leavesApi from '@/Apis/leaveType_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

// Validation for Leave Type Name
const validateLeaveTypeName = (value) => {
    if (!value || typeof value !== "string" || value.trim() === "") {
        return "Leave type name is required";
    }
    const trimmed = value.trim();
    if (!/^[A-Za-z ]+$/.test(trimmed)) {
        return "Only alphabets and spaces allowed (e.g. Sick Leave, Casual Leave, Maternity Leave)";
    }
    if (trimmed.length < 3 || trimmed.length > 50) {
        return "Leave type name must be 3–50 characters";
    }
    return true;
};

export default function CreateLeaveType({ close, refresh }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({
        defaultValues: { leaveType: '' },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Always trim before submit
            const payload = { ...data, leaveType: data.leaveType.trim() };
            const res = await leavesApi.createLeaveType(payload);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Leave type created successfully!</span>
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
                            <span>{res?.error || "Failed to create leave type."}</span>
                        </div>
                    ),
                });
                console.error('Error creating leave type:', res.error);
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
            console.error('Error creating leave type:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="leaveType"
                    control={form.control}
                    rules={{
                        validate: validateLeaveTypeName
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Leave Type Name
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Alphabets only, 3–50 chars)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Sick Leave, Casual Leave, Maternity Leave"
                                    {...field}
                                    disabled={loading}
                                    autoComplete="off"
                                />
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
