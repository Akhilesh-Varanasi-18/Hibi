'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import attendenceTypeapi from '@/Apis/AttendenceTypes';

const ATTENDANCE_TYPES = [
    { name: "ABSENT", shortName: "AB" },
    { name: "FIRST HALF", shortName: "FH" },
    { name: "SECOND HALF", shortName: "SH" },
    { name: "PRESENT", shortName: "P" },
    { name: "FULL DAY", shortName: "FD" },
];

export default function CreateAttendenceType({ close, refresh }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({
        defaultValues: { 
            name: '',
            shortName: '' 
        },
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await attendenceTypeapi.addAttendence(data);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Attendance type created successfully!</span>
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
                            <span>{res?.error || "Failed to create Attendance type."}</span>
                        </div>
                    ),
                });
                console.error('Error creating Attendance type:', res.error);
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
            console.error('Error creating Attendance type:', err);
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
                    rules={{ required: 'Attendance type is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Attendance Type</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        // Set shortName as well when type is selected
                                        const found = ATTENDANCE_TYPES.find(t => t.name === value);
                                        if (found) {
                                            form.setValue('shortName', found.shortName);
                                        } else {
                                            form.setValue('shortName', '');
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select attendance type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ATTENDANCE_TYPES.map(type => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.name} ({type.shortName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="shortName"
                    control={form.control}
                    rules={{ required: 'Short name is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Short Name</FormLabel>
                            <FormControl>
                                <input
                                    {...field}
                                    disabled
                                    className="input uppercase bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
                                    placeholder="Short name"
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