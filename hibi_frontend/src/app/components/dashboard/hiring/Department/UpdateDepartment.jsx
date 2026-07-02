'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import departmentApi from '@/Apis/department_Api';
import permissionsAPI from '@/Apis/Permissions_APIs';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';

export default function UpdateDepartment({ data, refresh, close }) {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(true);
  const { toast } = useToast();
  const form = useForm({ defaultValues: { name: '', managerId: '' } });

  useEffect(() => {
    async function fetchAllManagers() {
      setManagersLoading(true);
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
        setManagersLoading(false);
      }
    }
    fetchAllManagers();
  }, [toast]);

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await departmentApi.updateDepartment({ ...formData, id: data._id });
      if (res.success) {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
              <span>Department updated successfully!</span>
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
              <span>{res?.error || "Failed to update department."}</span>
            </div>
          ),
        });
        console.error('Error updating department:', res.error);
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
      console.error('Error updating department:', err);
    } finally {
      setLoading(false);
    }
  };

  if (managersLoading) {
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
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Department Name</FormLabel>
            <FormControl><Input placeholder="Enter department name" {...field} disabled={loading} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField name="managerId" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Manager</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
              <FormControl>
                <SelectTrigger id="managerId" className="w-full">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {managers.length === 0 ? (
                  <div className="px-4 py-2 text-muted-foreground">No managers found.</div>
                ) : (
                  managers.map((person) => (
                    <SelectItem key={person._id} value={person._id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
