'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import statusApi from '@/Apis/status_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';

export default function UpdateStatusType({ data, refresh, close }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm({ defaultValues: { statusType: "" } });

    useEffect(() => {
        if (data) form.reset(data);
    }, [data, form]);

    const onSubmit = async (formData) => {
        setLoading(true);
        try {
            const res = await statusApi.updateStatusType({ ...formData, statusTypeId: data._id });
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Status type updated successfully!</span>
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
                            <span>{res?.error || "Failed to update status type."}</span>
                        </div>
                    ),
                });
                console.error("Error updating status type:", res.error);
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
            console.error("Error updating status type:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full">
                <div className="flex flex-col gap-2">
                    {[...Array(1)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-10" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="statusType" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status Type</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter status type" {...field} disabled={loading} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
