'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import designationApi from '@/Apis/designation_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

// Validation for Designation Name
const validateDesignationName = async (value) => {
    if (!value || typeof value !== "string" || value.trim() === "") {
        return "Designation name is required";
    }
    if (!/^[A-Za-z ]+$/.test(value.trim())) {
        return "Only alphabets and spaces allowed (e.g. Manager, Developer, HR Executive)";
    }
    if (value.trim().length < 2 || value.trim().length > 50) {
        return "Designation name must be 2–50 characters";
    }
    return true;
};

export default function CreateDesignation({ refresh, close }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: { title: '', roles: '', responsibilities: '' },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Ensure trimmed title
            const payload = { ...data, title: data.title.trim() };
            const res = await designationApi.createDesignation(payload);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Designation created successfully!</span>
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
                            <span>{res?.error || "Failed to create designation."}</span>
                        </div>
                    ),
                });
                console.error('Error creating designation:', res.error);
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
            console.error('Error creating designation:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="title"
                    control={form.control}
                    rules={{
                        validate: validateDesignationName
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Designation Name
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Alphabets only, 2–50 chars, must be unique)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Manager, Developer, HR Executive"
                                    {...field}
                                    disabled={loading}
                                    autoComplete="off"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="roles"
                    control={form.control}
                    rules={{ required: 'Roles are required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Roles</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter roles" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="responsibilities"
                    control={form.control}
                    rules={{ required: 'Responsibilities are required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Responsibilities</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter responsibilities" {...field} disabled={loading} />
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
