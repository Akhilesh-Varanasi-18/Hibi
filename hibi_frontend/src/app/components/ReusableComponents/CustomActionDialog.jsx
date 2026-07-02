"use client"
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const CustomActionDialog = ({ config, open, setOpen }) => {
  const [loading, setLoading] = useState(false);
  // console.log(config)
  const formRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      let payload = {};

      if (config?.ExtraValues && typeof config.ExtraValues === "object") {
        Object.entries(config.ExtraValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            payload[key] = value;
          }
        });
      }

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          payload[key] = value;
        }
      });

      if (config?.onSubmit && typeof config?.onSubmit === "function") {
        await config?.onSubmit(payload);
      }

      reset();
      setOpen(false);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  const renderField = (field, index) => {
    const fieldName = field.name || `field_${index}`;
    const error = errors[fieldName];
    const getColSpanClass = () => field.takeFullWidth ? "md:col-span-2" : "";

    if (field.type === "text") {
      return (
        <div key={fieldName} className={getColSpanClass()}>
          <FormField label={field.label} error={error} required={field.required}>
            <Input
              type="text"
              placeholder={field.placeholder || field.label}
              {...register(fieldName, {
                required: field.required ? (field.errorMessage || "This field is required") : false,
                validate: field.validate ? field.validate : undefined,
              })}
              className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
            />
          </FormField>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={fieldName} className={getColSpanClass()}>
          <FormField label={field.label} error={error} required={field.required}>
            <Textarea
              placeholder={field.placeholder || field.label}
              rows={field.rows || 2}
              {...register(fieldName, {
                required: field.required ? (field.errorMessage || "This field is required") : false,
                validate: field.validate ? field.validate : undefined,
              })}
              className="w-full px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
            />
          </FormField>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      {open && (
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>{config?.Title}</DialogTitle>
            {config?.Desc && (
              <p className="text-sm text-muted-foreground">{config?.Desc}</p>
            )}
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {config?.Fields && config?.Fields.map((field, index) => renderField(field, index))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpen(false)}
                  className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                >
                  Cancel
                </Button>
                <Button type="submit" variant={config?.submitVariant || "default"} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin transition-all ease-in duration-300" /> : config?.submitLabel || "submit"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};

function FormField({ label, error, children, required }) {
  return (
    <div className="rounded-md">
      <Label className="opacity-80">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error.message || "Please provide a valid value"}
        </p>
      )}
    </div>
  );
}
