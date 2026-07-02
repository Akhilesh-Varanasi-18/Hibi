'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';
import attendenceTypeapi from '@/Apis/AttendenceTypes';

export default function UpdateAttendenceType({ data, refresh, close }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm({ 
    defaultValues: { 
      name: '',
      shortName: '' 
    } 
  });

  useEffect(() => {
    if (data) {
      form.reset({ 
        name: data.name || '',
        shortName: data.shortName || '' 
      });
    }
  }, [data, form]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await attendenceTypeapi.updateAttendence({ 
        id: data._id, 
        name: formData.name 
      });
      if (res.success) {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
              <span>Attendance type updated successfully!</span>
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
              <span>{res?.error || "Failed to update Attendance type."}</span>
            </div>
          ),
        });
        console.error('Update failed:', res.error);
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
      console.error('Error updating Attendance type:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
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
          name="name"
          control={form.control}
          rules={{ required: 'Attendance type name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attendance Type Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter Attendance type name" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="shortName"
          control={form.control}
          rules={{ 
            required: 'Short name is required',
            maxLength: {
              value: 10,
              message: 'Short name should be maximum 10 characters'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter short name" 
                  {...field} 
                  disabled={loading}
                  className="uppercase"
                  onChange={(e) => {
                    field.onChange(e.target.value.toUpperCase());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}