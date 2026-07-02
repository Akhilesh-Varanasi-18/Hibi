'use client';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import permissionsAPI from '@/Apis/Permissions_APIs';
import departmentApi from '@/Apis/department_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

// Validation for Department Name
const validateDepartmentName = (value) => {
    if (!value || typeof value !== "string" || value.trim() === "") {
        return "Department name is required";
    }
    if (!/^[A-Za-z ]+$/.test(value.trim())) {
        return "Only alphabets and spaces allowed (e.g. Finance, HR, IT)";
    }
    if (value.trim().length < 2 || value.trim().length > 50) {
        return "Department name must be 2–50 characters";
    }
    return true;
};

export default function CreateDepartment({ refresh, close }) {
    const { toast } = useToast();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetAllManagers() {
            setLoading(true);
            try {
                const res = await permissionsAPI.getAllManagers();
                if (res.success) {
                    setManagers(res.data);
                } else {
                    toast({
                        title: (
                            <div className='flex gap-2 items-center'>
                                <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                                <span>{res?.error || "Failed to fetch managers."}</span>
                            </div>
                        ),
                    });
                }
            } catch (err) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>Something went wrong while fetching managers.</span>
                        </div>
                    ),
                });
            } finally {
                setLoading(false);
            }
        }
        fetAllManagers();
        
    }, []);

    const form = useForm({
        defaultValues: { name: '', managerId: '' },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Ensure trimmed name
            const payload = { ...data, name: data.name.trim() };
            const res = await departmentApi.createDepartment(payload);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Department created successfully!</span>
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
                            <span>{res?.error || "Failed to create department."}</span>
                        </div>
                    ),
                });
                console.error('Error creating department: ', res.error);
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
            console.error('Error creating department:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="name"
                    control={form.control}
                    rules={{
                        validate: validateDepartmentName
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Department Name
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Alphabets only, 2–50 chars, must be unique)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Finance, HR, IT"
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
                    name="managerId"
                    control={form.control}
                    rules={{
                        required: "Manager is required"
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Manager</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={loading}
                            >
                                <FormControl>
                                    <SelectTrigger id="managerId" className="w-full">
                                        <SelectValue placeholder="Select Manager" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {managers.map((person) => (
                                        <SelectItem key={person._id} value={person._id}>
                                            {person.firstName} {person.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
