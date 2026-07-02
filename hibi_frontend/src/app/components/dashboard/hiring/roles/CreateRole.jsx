'use client';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import roleApi from "@/Apis/role_Api";
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

// Validation for Role Name
const validateRoleName = async (value) => {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return "Role name is required";
  }
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return "Role name must be 3–30 characters";
  }
  if (!/^[A-Za-z_]+$/.test(trimmed)) {
    return "Only alphabets and underscores allowed (e.g. ORGANIZATIONHEAD, CEO, EMPLOYEE)";
  }

  return true;
};

export default function CreateRole({ refresh, close }) {
  const { toast } = useToast();
  const form = useForm({ defaultValues: { name: "" }, mode: "onTouched" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Always trim before submit
      const payload = { ...data, name: data.name.trim() };
      const res = await roleApi.createRole(payload);
      if (res.success) {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
              <span>Role created successfully!</span>
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
              <span>{res?.error || "Failed to create role."}</span>
            </div>
          ),
        });
        console.error("Error creating role:", res.error);
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
      console.error("Error creating role:", err);
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
          rules={{ validate: validateRoleName }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Role Name
                <span className="text-xs text-muted-foreground ml-2">
                  (Alphabets/underscores only, 3–30 chars, must be unique)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. ORGANIZATIONHEAD, CEO, EMPLOYEE"
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
