'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import shiftsApi from '@/Apis/shifts_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';

export default function UpdateShift({ data, refresh, close }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Updated defaultValues and breakTime fields for granular control
    const form = useForm({
        defaultValues: {
            name: '',
            startTime: '',
            endTime: '',
            breakTimeStart: '',
            breakTimeEnd: '',
            gracePeriodMin: '',
        },
        mode: 'onTouched',
    });

    useEffect(() => {
        if (data) {
            // Map legacy or missing break fields to new granular break fields
            form.reset({
                name: data.name ?? "",
                startTime: data.startTime ?? "",
                endTime: data.endTime ?? "",
                breakTimeStart: data.breakTimeStart ?? "",
                breakTimeEnd: data.breakTimeEnd ?? "",
                gracePeriodMin: data.gracePeriodMin ?? "",
            });
        }
    }, [data, form]);

    const onSubmit = async (formData) => {
        setLoading(true);
        try {
            const payload = {
                shiftId: data._id,
                name: formData.name,
                startTime: formData.startTime,
                endTime: formData.endTime,
                breakTimeStart: formData.breakTimeStart,
                breakTimeEnd: formData.breakTimeEnd,
                gracePeriodMin: formData.gracePeriodMin ? Number(formData.gracePeriodMin) : 0,
            };
            const res = await shiftsApi.updateShift(payload);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Shift updated successfully!</span>
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
                            <span>{res?.error || "Failed to update shift."}</span>
                        </div>
                    ),
                });
                console.error('Error updating shift:', res.error);
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
            console.error('Error updating shift:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Shift Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter shift name" {...field} disabled={loading} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="startTime" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Start Time
                                <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                            </FormLabel>
                            <FormControl>
                                <Input type="time" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="endTime" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                End Time
                                <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                            </FormLabel>
                            <FormControl>
                                <Input type="time" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField
                        name="breakTimeStart"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Break Start Time
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="breakTimeEnd"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Break End Time
                                    <span className="text-xs text-muted-foreground ml-1">(24-hour format)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="gracePeriodMin"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Grace Period (minutes)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Enter grace period in minutes"
                                        {...field}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}