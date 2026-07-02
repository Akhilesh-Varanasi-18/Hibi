'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import privilegeApi from '@/Apis/previlege_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


// Validation functions
const validateName = (value) => {
    if (!value || typeof value !== "string" || value.trim() === "") {
        return "Privilege name is required";
    }
    if (value.length < 3 || value.length > 30) {
        return "Name must be 3–30 characters";
    }
    if (!/^[A-Za-z0-9_]+$/.test(value)) {
        return "Only alphabets, numbers, and underscore allowed";
    }
    return true;
};

const validateDescription = (value) => {
    if (value && value.length > 200) {
        return "Description must be at most 200 characters";
    }
    return true;
};

export default function CreatePrivilege({ refresh, close }) {
    const { toast } = useToast();
    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
        }
    });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await privilegeApi.createPrevilege(data);
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Privilege created successfully!</span>
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
                            <span>{res?.error || "Failed to create privilege."}</span>
                        </div>
                    ),
                });
                console.error('Error creating privilege:', res.error);
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
            console.error('Error creating privilege:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    rules={{ validate: validateName }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Privilege Name
                                <span className="text-xs text-muted-foreground ml-2">(Only alphabets/numbers/underscore, 3–30 chars)</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. SUPERADMIN, HR_MANAGER"
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
                    control={form.control}
                    name="description"
                    rules={{ validate: validateDescription }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Description
                                <span className="text-xs text-muted-foreground ml-2">(Optional, max 200 chars)</span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter description"
                                    {...field}
                                    disabled={loading}
                                    maxLength={200}
                                />
                            </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                                {field.value?.length || 0}/200
                            </div>
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
