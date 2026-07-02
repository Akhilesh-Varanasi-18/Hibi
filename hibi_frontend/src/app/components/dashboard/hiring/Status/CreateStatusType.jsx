'use client';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import statusApi from "@/Apis/status_Api";
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_TYPES = [
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

export default function CreateStatusType({ refresh, close }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const form = useForm({
    defaultValues: { statusType: "" },
    mode: "onTouched"
  });

  const onSubmit = async (data) => {
    // Only allow if statusType is in allowed list
    if (!STATUS_TYPES.some(t => t.value === data.statusType)) {
      form.setError('statusType', { type: 'manual', message: 'Invalid status type selected.' });
      return;
    }
    setLoading(true);
    try {
      const res = await statusApi.createStatusType(data);
      if (res.success) {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
              <span>Status type created successfully!</span>
            </div>
          ),
        });
        refresh();
        close();
      } else {
        console.log(res)
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
              <span>{res?.error || "Failed to create status type."}</span>
            </div>
          ),
        });
        console.error("Error creating status type:", res.error);
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
      console.error("Error creating status type:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          name="statusType"
          control={form.control}
          rules={{
            required: 'Status type is required',
            validate: value =>
              STATUS_TYPES.some(t => t.value === value) || 'Invalid status type selected.',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Type</FormLabel>
              <FormControl>
                {
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
                {/*<Input
                  placeholder="Enter status type (e.g. ACCEPTED)"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={loading}
                  autoComplete="off"
                />
                 */}
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
