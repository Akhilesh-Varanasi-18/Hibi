"use client"

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Loader2, Plus, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import MultipleDateSelector from "./MultipleDateSelector";
import { Checkbox } from "@/components/ui/checkbox";

// Checkbox Multiselect Component with Popover
export const CheckboxMultiselect = ({
  field,
  control,
  fieldName,
  error,
  watch,
  setValue
}) => {
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const selectedValues = watch(fieldName) || [];

  const filteredOptions = field.array?.filter(item =>
    (item.name || item.label || item.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  ) || [];

  const handleCheckboxChange = (itemId, checked) => {
    const currentValues = Array.isArray(selectedValues) ? [...selectedValues] : [];

    if (checked) {
      if (!currentValues.includes(itemId)) {
        setValue(fieldName, [...currentValues, itemId], { shouldValidate: true });
      }
    } else {
      setValue(fieldName, currentValues.filter(id => id !== itemId), { shouldValidate: true });
    }
  };


  const handleSelectAll = () => {
    const allIds = field.array?.map(item => item._id) || [];
    setValue(fieldName, allIds);
  };

  const handleClearAll = () => {
    setValue(fieldName, []);
  };

  const getSelectedLabels = () => {
    return selectedValues.map(valueId => {
      const item = field.array?.find(item => item._id === valueId);
      return item ? (item.name || item.label || item.title) : valueId;
    });
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="space-y-3">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full justify-between bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              {selectedLabels.length > 0 ? (
                <span className="truncate text-left">
                  {selectedLabels.length} selected
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Select {field.label}...
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg"
          align="start"
          side="bottom"
        >
          <div className="flex flex-col max-h-96">
            {/* Header with Search and Controls */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{field.label}</h4>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={!field.array || field.array.length === 0}
                    className="h-7 px-2 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedValues.length === 0}
                    className="h-7 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Search Input */}
              {field.showSearch && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search options..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-sm bg-neutral-50 dark:bg-neutral-700"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Checkbox List */}
            <div className="flex-1 overflow-y-auto h-40">
              {!field.array || field.array.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No options available
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No results found
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredOptions.map((item) => (
                    <div
                      key={item._id}
                      className={cn(
                        // Alignment fix: Use items-center and assign min-h-[2.25rem] to match Checkbox and label height
                        "flex items-center gap-3 rounded-lg p-2 min-h-[2.25rem] transition-colors hover:bg-accent/50",
                        selectedValues.includes(item._id)
                          ? "bg-blue-50 dark:bg-blue-950"
                          : ""
                      )}
                    >
                      <div className="flex items-center h-full">
                        <Checkbox
                          id={`${fieldName}-${item._id}`}
                          checked={selectedValues.includes(item._id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(item._id, checked)
                          }
                          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <Label
                          htmlFor={`${fieldName}-${item._id}`}
                          className="text-sm font-normal leading-none cursor-pointer truncate flex items-center"
                          onClick={e => {
                            e.preventDefault();
                            // Only toggle if clicking the label, not inside the checkbox.
                            handleCheckboxChange(
                              item._id,
                              !selectedValues.includes(item._id)
                            );
                          }}
                        >
                          {item.name || item.label || item.title}
                        </Label>
                        {item.description && (
                          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Selection Count */}
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {selectedValues.length} of {field.array?.length || 0} selected
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPopoverOpen(false)}
                  className="h-6 px-2 text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Items Preview */}
      {selectedLabels.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {selectedLabels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center text-xs bg-primary-100 dark:bg-primary-800 border border-primary-300 dark:border-primary-700 rounded px-2 py-1"
              >
                {label}
                <button
                  type="button"
                  aria-label="Remove"
                  className="ml-1 text-primary-600 hover:text-primary-800 rounded focus:outline-none"
                  onClick={() => {
                    const valueId = selectedValues[index];
                    handleCheckboxChange(valueId, false);
                  }}
                >
                  &times;
                </button>
              </span>
            ))}
            {selectedLabels.length > 3 && (
              <span className="inline-flex items-center text-xs bg-muted text-muted-foreground rounded px-2 py-1">
                +{selectedLabels.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// Dynamic Form Component with FormData/JSON Support
export const DynamicFormDialogComponent = ({ config }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarStates, setCalendarStates] = useState({});
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  // Clear errors when dialog opens/closes or when values change
  useEffect(() => {
    if (!open) {
      clearErrors();
    }
  }, [open, clearErrors]);

  // Watch for date changes to clear errors
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Clear errors for date fields when they change
      if (name?.includes('Date') || name?.includes('date')) {
        const relatedErrors = Object.keys(errors).filter(key =>
          key.toLowerCase().includes('date')
        );
        relatedErrors.forEach(errorKey => {
          clearErrors(errorKey);
        });
      }

      // Email cross-validation
      if (name === "officeMail" || name === "personalEmail") {
        trigger(["officeMail", "personalEmail"]);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, trigger, clearErrors, errors]);

  // Helper to check if any field is a file input
  const hasFileField = () => {
    if (!config?.Fields) return false;
    return config.Fields.some((field) => field.type === "file");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const isMultipart = hasFileField();
      let payload;

      if (isMultipart) {
        payload = new FormData();

        // Append any extra values
        if (config?.ExtraValues && typeof config.ExtraValues === "object") {
          Object.entries(config.ExtraValues).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              payload.append(key, value);
            }
          });
        }

        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;

          // ✅ Handle files
          if (value instanceof FileList) {
            if (value.length > 0) {
              const file = value[0];
              payload.append(key, file);
              payload.append(`${key}Name`, file.name);
            }
          }

          // ✅ Handle arrays correctly (no arr[0], arr[1])
          else if (Array.isArray(value)) {
            value.forEach((item) => payload.append(key, item));
          }

          // ✅ Handle everything else
          else {
            payload.append(key, value);
          }
        });

      } else {
        // JSON Mode (no files)
        payload = {};

        if (config?.ExtraValues && typeof config.ExtraValues === "object") {
          Object.entries(config.ExtraValues).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              payload[key] = value;
            }
          });
        }

        Object.entries(data).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (!(value instanceof FileList)) {
            payload[key] = value;
          }
        });
      }

      if (config?.onSubmit && typeof config?.onSubmit === "function") {
        await config.onSubmit(payload);
      }

      reset();
      setOpen(false);
      setCalendarStates({});
      if (formRef.current) {
        const fileInputs = formRef.current.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => (input.value = ""));
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure all fields (including file inputs) are cleared when dialog closes
  const handleDialogOpen = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      setCalendarStates({});
      clearErrors();
      // Clear file inputs manually if any
      if (formRef.current) {
        const fileInputs = formRef.current.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => (input.value = ""));
      }
    }
  };

  const renderField = (field, index) => {
    const fieldName = field.name || `field_${index}`;
    const error = errors[fieldName];

    const validateField = (value) => {
      if (field.required && !value) {
        return field.errorMessage || "This field is required";
      }

      if (field.validate && typeof field.validate === "function") {
        const validationResult = field.validate(value);
        if (validationResult !== true) {
          return validationResult || field.errorMessage;
        }
      }

      return true;
    };

    // Helper to apply col-span-2 if takeFullWidth is set
    const getColSpanClass = () => field.takeFullWidth ? "md:col-span-2" : "";

    switch (field.type) {
      case "text":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Input
                type="text"
                placeholder={field.placeholder || field.label}
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (value) => {
                    if (field.validate) {
                      return validateField(value);
                    }
                    return true;
                  },
                })}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );
      case "number":
      case "tel":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder={field.placeholder || field.label}
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (value) => {
                    if (value && !/^[0-9]+$/.test(value)) {
                      return "Only numbers are allowed";
                    }
                    if (field.validate) {
                      return validateField(value);
                    }
                    return true;
                  },
                })}
                onKeyDown={(e) => {
                  const allowedKeys = [
                    "Backspace",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Delete",
                  ];
                  if (
                    !/[0-9]/.test(e.key) &&
                    !allowedKeys.includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );
      case "time":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Input
                type="time"
                placeholder={field.placeholder || field.label}
                min={field.startFrom}
                max={field.endFrom}
                step="60"
                inputMode="numeric"
                // 
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (value) => {
                    if (field.validate) {
                      return validateField(value);
                    }
                    return true;
                  },
                  pattern: {
                    value: /^([01]\d|2[0-3]):[0-5]\d$/,
                    message: "Please use 24-hour time format (HH:mm)",
                  },
                })}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );

      case "multitext":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Controller
                name={fieldName}
                control={control}
                rules={{
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (value) => {
                    if (field.required && (!value || value.length === 0)) {
                      return field.errorMessage || "Please add at least one entry";
                    }
                    if (field.validate) {
                      const result = field.validate(value);
                      if (result !== true) return result;
                    }
                    return true;
                  }
                }}
                render={({ field: controllerField }) => {
                  const [inputValue, setInputValue] = React.useState("");
                  const valuesArr = Array.isArray(controllerField.value) ? controllerField.value : [];

                  const handleAdd = () => {
                    const trimmed = inputValue.trim();
                    if (!trimmed) return;
                    if (!valuesArr.includes(trimmed)) {
                      controllerField.onChange([...valuesArr, trimmed]);
                    }
                    setInputValue("");
                  };

                  const handleKeyDown = (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  };

                  const handleRemove = (val) => {
                    controllerField.onChange(valuesArr.filter(v => v !== val));
                  };

                  return (
                    <div>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder={field.placeholder || `Add ${field.label}`}
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
                        />
                        <Button
                          type="button"
                          onClick={handleAdd}
                          variant="outline"
                          size="icon"
                          disabled={inputValue.trim() === ""}
                        >
                          <Plus size={14} className="inline-block align-middle" />
                        </Button>
                      </div>
                      {valuesArr && valuesArr.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {valuesArr.map((val, idx) => (
                            <span key={val + idx} className="inline-flex items-center text-xs bg-primary-100 dark:bg-primary-800 border border-primary-300 dark:border-primary-700 rounded px-2 py-1">
                              {val}
                              <button
                                type="button"
                                aria-label="Remove"
                                className="ml-1 text-primary-600 hover:text-primary-800 rounded focus:outline-none"
                                onClick={() => handleRemove(val)}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </FormField>
          </div>
        );

      case "email":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Input
                type="email"
                placeholder={field.placeholder || field.label}
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (value) => {
                    if (field.required && !value) {
                      return field.errorMessage || "This field is required";
                    }

                    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                      return "Invalid email address";
                    }

                    const officeMail = watch("officeMail");
                    const personalEmail = watch("personalEmail");
                    if (officeMail && personalEmail && officeMail === personalEmail) {
                      if (fieldName === "officeMail") {
                        return "Office Email must be different from Personal Email";
                      }
                      if (fieldName === "personalEmail") {
                        return "Personal Email must be different from Office Email";
                      }
                    }

                    return true;
                  },
                })}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );

      case "calendar":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Controller
                name={fieldName}
                control={control}
                rules={{
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: field.validate ? validateField : undefined,
                }}
                render={({ field: controllerField }) => (
                  <Popover
                    open={calendarStates[fieldName] || false}
                    onOpenChange={(open) => {
                      setCalendarStates((prev) => ({ ...prev, [fieldName]: open }));
                      if (!open && controllerField.value) {
                        // Clear error when calendar closes with a valid value
                        clearErrors(fieldName);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-900",
                          !controllerField.value && "text-muted-foreground"
                        )}
                        type="button"
                      >
                        {controllerField.value ? (
                          format(new Date(controllerField.value), "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-neutral-50 dark:bg-neutral-900"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={controllerField.value ? new Date(controllerField.value) : undefined}
                        onSelect={(date) => {
                          controllerField.onChange(date ? format(date, "yyyy-MM-dd") : "");
                          setCalendarStates((prev) => ({ ...prev, [fieldName]: false }));
                          clearErrors(fieldName);
                        }}
                        captionLayout="dropdown"
                        fromYear={field.showFrom ? new Date(field.showFrom).getFullYear() : 1900}
                        toYear={field.showTo ? new Date(field.showTo).getFullYear() : new Date().getFullYear()}
                        disabled={(date) => {
                          if (field.showFrom && date < new Date(field.showFrom)) return true;
                          if (field.showTo && date > new Date(field.showTo)) return true;
                          if (field.hideUpcoming) {
                            // disable dates after today (including tomorrow and after)
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const cmp = new Date(date);
                            cmp.setHours(0,0,0,0);
                            if (cmp > today) return true;
                          }
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </FormField>
          </div>
        );

      case "multicalendar": {
        const dateStartName = field.DateStartName || `${fieldName}Start`;
        const dateEndName = field.DateEndName || `${fieldName}End`;

        const startError = errors?.[dateStartName]?.message;
        const endError = errors?.[dateEndName]?.message;

        const startValue = watch(dateStartName);
        const endValue = watch(dateEndName);

        return (
          <div key={`${dateStartName}_${dateEndName}_range`} className={getColSpanClass()}>
            <FormField label={field.label} error={startError || endError} required={field.required}>
              <MultipleDateSelector
                dateRange={{
                  from: startValue ? new Date(startValue) : undefined,
                  to: endValue ? new Date(endValue) : undefined,
                }}
                setDateRange={({ from, to }) => {
                  setValue(dateStartName, from ? format(from, "yyyy-MM-dd") : "");
                  setValue(dateEndName, to ? format(to, "yyyy-MM-dd") : "");
                  // Clear errors when dates are selected
                  clearErrors([dateStartName, dateEndName]);
                }}
                showUpcoming={!!field.showUpcoming}
              />
              <input
                type="hidden"
                {...register(dateStartName, {
                  required: field.required ? (field.errorMessage || "Start date required") : false,
                  validate: (value) => {
                    if (field.required && !value) {
                      return field.errorMessage || "Start date required";
                    }
                    return true;
                  }
                })}
              />
              <input
                type="hidden"
                {...register(dateEndName, {
                  required: field.required ? (field.errorMessage || "End date required") : false,
                  validate: (value) => {
                    if (field.required && !value) {
                      return field.errorMessage || "End date required";
                    }
                    const start = watch(dateStartName);
                    if (start && value && new Date(start) > new Date(value)) {
                      return "End date should be after Start date.";
                    }
                    return true;
                  }
                })}
              />
              <div className="text-xs text-destructive min-h-[20px] mt-1">
                {startError || endError}
              </div>
            </FormField>
          </div>
        );
      }

      case "file":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Input
                type="file"
                accept={field.fileType === "image" ? "image/*" : field.accept || "*"}
                multiple={field.multiple || false}
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: (files) => {
                    if (!files || files.length === 0) {
                      if (field.required) return field.errorMessage || "File is required";
                      return true;
                    }

                    const file = files[0];

                    if (field.maxSize) {
                      const maxSizeBytes = field.maxSize * 1024 * 1024;
                      if (file.size > maxSizeBytes) {
                        return `File size must be less than ${field.maxSize}MB`;
                      }
                    }

                    if (field.allowedTypes && field.allowedTypes.length > 0) {
                      if (!field.allowedTypes.includes(file.type)) {
                        return `Only ${field.allowedTypes.join(", ")} files are allowed`;
                      }
                    }

                    if (field.validate && typeof field.validate === "function") {
                      return field.validate(file);
                    }

                    return true;
                  },
                })}
                className="bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );

      case "select":
        // Use checkbox multiselect for multiselect fields
        if (field.multiselect) {
          return (
            <div key={fieldName} className={getColSpanClass()}>
              <FormField label={field.label} error={error} required={field.required}>
                <Controller
                  name={fieldName}
                  control={control}
                  rules={{
                    required: field.required ? (field.errorMessage || "This field is required") : false,
                    validate: field.validate ? validateField : undefined,
                  }}
                  render={({ field: controllerField }) => (
                    <CheckboxMultiselect
                      field={field}
                      control={control}
                      fieldName={fieldName}
                      error={error}
                      watch={watch}
                      setValue={setValue}
                    />
                  )}
                />
              </FormField>
            </div>
          );
        } else if (field.showSearch) {
          // Regular select with search (single select)
          return (
            <div key={fieldName} className={getColSpanClass()}>
              <FormField label={field.label} error={error} required={field.required}>
                <Controller
                  name={fieldName}
                  control={control}
                  rules={{
                    required: field.required ? (field.errorMessage || "This field is required") : false,
                    validate: field.validate ? validateField : undefined,
                  }}
                  render={({ field: controllerField }) => {
                    const [search, setSearch] = React.useState("");
                    const selectedValue = controllerField.value;

                    const options =
                      search.trim() && field.array
                        ? field.array.filter(item =>
                          (item.name || item.label || item.title || "")
                            .toLowerCase()
                            .includes(search.trim().toLowerCase())
                        )
                        : field.array || [];

                    const handleSearchKeyDown = (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    };

                    return (
                      <div>
                        <Select
                          onValueChange={val => {
                            controllerField.onChange(val);
                          }}
                          value={selectedValue || ""}
                          disabled={!field.array || field.array.length === 0}
                        >
                          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-900">
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                            <div className="p-2">
                              <Input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                autoFocus
                                onChange={e => setSearch(e?.target?.value)}
                                onKeyDown={handleSearchKeyDown}
                              />
                            </div>
                            {!field.array || field.array.length === 0 ? (
                              <div className="p-2 text-muted-foreground">No data available</div>
                            ) : options.length === 0 ? (
                              <div className="p-2 text-muted-foreground">No results found</div>
                            ) : (
                              options.map(item => (
                                <SelectItem
                                  key={item._id}
                                  value={item._id}
                                  className={selectedValue === item._id ? "font-semibold bg-primary-100/50" : ""}
                                >
                                  <div className="flex justify-between items-center">
                                    <span>{item.name || item.label || item.title}</span>
                                    {selectedValue === item._id && <span className="ml-2 text-primary-600">&#10003;</span>}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }}
                />
              </FormField>
            </div>
          );
        } else {
          // Regular select (single, no search)
          return (
            <div key={fieldName} className={getColSpanClass()}>
              <FormField label={field.label} error={error} required={field.required}>
                <Controller
                  name={fieldName}
                  control={control}
                  rules={{
                    required: field.required ? (field.errorMessage || "This field is required") : false,
                    validate: field.validate ? validateField : undefined,
                  }}
                  render={({ field: controllerField }) => (
                    <Select
                      onValueChange={controllerField.onChange}
                      value={controllerField.value || ""}
                      disabled={!field.array || field.array.length === 0}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-900">
                        <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-50 dark:bg-neutral-900">
                        {!field.array || field.array.length === 0 ? (
                          <div className="p-2 text-muted-foreground">No data available</div>
                        ) : (
                          field.array.map(item => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.name || item.label || item.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
          );
        }

      case "textarea":
        return (
          <div key={fieldName} className={getColSpanClass()}>
            <FormField label={field.label} error={error} required={field.required}>
              <Textarea
                placeholder={field.placeholder || field.label}
                rows={field.rows || 2}
                {...register(fieldName, {
                  required: field.required ? (field.errorMessage || "This field is required") : false,
                  validate: field.validate ? validateField : undefined,
                })}
                className="w-full px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={config?.DialogVariant || "default"} className="gap-2">
          {config?.DialogLabel || "Open Form"}
        </Button>
      </DialogTrigger>
      {
        open && (
          <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <DialogHeader className={""}>
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
        )
      }
    </Dialog>
  );
};

function FormField({ label, error, children, required }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="h-2"></div>
      {children}
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error.message || "Please provide a valid value"}
        </p>
      )}
    </div>
  );
}

export const DynamicFormDialog = React.memo(DynamicFormDialogComponent);