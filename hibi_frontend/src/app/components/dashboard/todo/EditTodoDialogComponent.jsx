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
import { Calendar, Loader2, Plus, ChevronDown, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import MultipleDateSelector from "../../ReusableComponents/MultipleDateSelector";

// Checkbox Multiselect Component with Popover
const CheckboxMultiselect = ({ 
  field, 
  fieldName, 
  error, 
  watch, 
  setValue,
  defaultValue = []
}) => {
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const selectedValues = watch(fieldName) || defaultValue;
  
  const filteredOptions = field.array?.filter(item => 
    (item.name || item.label || item.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  ) || [];

  const handleCheckboxChange = (itemId, checked) => {
    const currentValues = Array.isArray(selectedValues) ? [...selectedValues] : [];
    
    if (checked) {
      if (!currentValues.includes(itemId)) {
        setValue(fieldName, [...currentValues, itemId]);
      }
    } else {
      setValue(fieldName, currentValues.filter(id => id !== itemId));
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

            <div className="flex-1 overflow-y-auto">
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
                        "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50",
                        selectedValues.includes(item._id) 
                          ? "bg-blue-50 dark:bg-blue-950" 
                          : ""
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          id={`${fieldName}-${item._id}`}
                          checked={selectedValues.includes(item._id)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(item._id, checked)
                          }
                          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                        />
                        <Label
                          htmlFor={`${fieldName}-${item._id}`}
                          className="text-sm font-normal leading-none cursor-pointer truncate"
                          style={{ lineHeight: "1.2", display: "flex", alignItems: "center", flex: 1 }}
                          onClick={e => {
                            e.preventDefault();
                            // Toggle selection when clicking the label specifically
                            handleCheckboxChange(
                              item._id,
                              !selectedValues.includes(item._id)
                            );
                          }}
                        >
                          {item.name || item.label || item.title}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

// Separate component for New Tasks to fix hook order issue
const NewTasksInput = ({ watch, setValue }) => {
  const [inputValue, setInputValue] = useState("");
  const newTasks = watch("newTaskNames") || [];

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!newTasks.includes(trimmed)) {
      setValue("newTaskNames", [...newTasks, trimmed]);
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
    setValue("newTaskNames", newTasks.filter(v => v !== val));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Add New Tasks</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add new task..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-neutral-50 dark:bg-neutral-900"
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          size="icon"
          disabled={inputValue.trim() === ""}
        >
          <Plus size={14} />
        </Button>
      </div>
      {newTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {newTasks.map((task, idx) => (
            <span key={task + idx} className="inline-flex items-center text-xs bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-700 rounded px-2 py-1">
              {task}
              <button
                type="button"
                aria-label="Remove"
                className="ml-1 text-green-600 hover:text-green-800 rounded focus:outline-none"
                onClick={() => handleRemove(task)}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Edit Todo Dialog Component
export const EditTodoDialogComponent = ({ 
  item, 
  onUpdate, 
  employees = [], 
  priorityOptions = [
    { _id: "LOW", name: "Low" },
    { _id: "MEDIUM", name: "Medium" },
    { _id: "HIGH", name: "High" }
  ]
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  // Initialize form with item data when dialog opens
  useEffect(() => {
    if (open && item) {
      setValue("moduleName", item.moduleName);
      setValue("priority", item.priority);

      if (item.startDate) {
        setValue("startDate", format(new Date(item.startDate), "yyyy-MM-dd"));
      }
      if (item.endDate) {
        setValue("endDate", format(new Date(item.endDate), "yyyy-MM-dd"));
      }

      const employeeIds = item.employeesAssigned?.map(emp => emp.employeeId) || [];
      setValue("employeeIds", employeeIds);

      const existingTasks = item.todoList?.map(task => ({
        taskId: task._id,
        taskName: task.taskName
      })) || [];
      setValue("existingTasks", existingTasks);

      setValue("newTaskNames", []);
    }
  }, [open, item, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // IMPORTANT: Only pass new moduleName, do not allow deleting/editing existing tasks except name edit
      const payload = {
        toDoId: item._id,
        moduleName: data.moduleName, // send updated moduleName
        taskUpdates: data.existingTasks || [], // only update task names, do not delete
        newTaskNames: data.newTaskNames || [],
        employeeIds: data.employeeIds || [],
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        priority: data.priority
      };

      console.log("Update Payload:", payload);

      if (onUpdate && typeof onUpdate === "function") {
        await onUpdate(payload);
      }

      reset();
      setOpen(false);
    } catch (error) {
      console.error("Todo update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      clearErrors();
    }
  };

  // Render existing tasks as editable inputs (NO deletion)
  const renderExistingTasks = () => {
    const existingTasks = watch("existingTasks") || [];

    const updateTaskName = (index, newName) => {
      const updatedTasks = [...existingTasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        taskName: newName
      };
      setValue("existingTasks", updatedTasks);
    };

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Existing Tasks</Label>
        {existingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No existing tasks</p>
        ) : (
          existingTasks.map((task, index) => (
            <div key={task.taskId} className="flex gap-2 items-start">
              <Input
                type="text"
                value={task.taskName}
                onChange={(e) => updateTaskName(index, e.target.value)}
                placeholder="Task name"
                className="flex-1 bg-neutral-50 dark:bg-neutral-900"
              />
              {/* Remove delete button for existing tasks */}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      {open && (
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Todo - {item?.moduleName}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update todo details and tasks
            </p>
          </DialogHeader>
          
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField label="Module Name" error={errors.moduleName} required>
                    <Input
                      type="text"
                      placeholder="Enter module name"
                      {...register("moduleName", {
                        required: "Module name is required"
                      })}
                      className="bg-neutral-50 dark:bg-neutral-900"
                    />
                  </FormField>
                </div>

                <div>
                  <FormField label="Priority" error={errors.priority} required>
                    <Controller
                      name="priority"
                      control={control}
                      rules={{ required: "Priority is required" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-900">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions.map(option => (
                              <SelectItem key={option._id} value={option._id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </div>
              </div>

              <div className="md:col-span-2">
                <FormField label="Start and End Date" error={errors.startDate || errors.endDate} required>
                  <div>
                    <MultipleDateSelector
                      dateRange={{
                        from: watch("startDate") ? new Date(watch("startDate")) : undefined,
                        to: watch("endDate") ? new Date(watch("endDate")) : undefined,
                      }}
                      setDateRange={({ from, to }) => {
                        setValue("startDate", from ? format(from, "yyyy-MM-dd") : "");
                        setValue("endDate", to ? format(to, "yyyy-MM-dd") : "");
                        clearErrors(["startDate", "endDate"]);
                      }}
                      showUpcoming={true}
                    />
                    <input
                      type="hidden"
                      {...register("startDate", {
                        required: "Start date is required"
                      })}
                    />
                    <input
                      type="hidden"
                      {...register("endDate", {
                        required: "End date is required"
                      })}
                    />
                    <div className="text-xs text-destructive min-h-[20px] mt-1">
                      {errors.startDate?.message || errors.endDate?.message}
                    </div>
                  </div>
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Assigned Employees" error={errors.employeeIds} required>
                  <Controller
                    name="employeeIds"
                    control={control}
                    rules={{ required: "Please select at least one employee" }}
                    render={({ field }) => (
                      <CheckboxMultiselect
                        field={{
                          label: "Employees",
                          array: employees,
                          showSearch: true
                        }}
                        fieldName="employeeIds"
                        error={errors.employeeIds}
                        watch={watch}
                        setValue={setValue}
                        defaultValue={field.value}
                      />
                    )}
                  />
                </FormField>
              </div>

              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-medium">Tasks</h3>
                
                {renderExistingTasks()}
                
                <NewTasksInput watch={watch} setValue={setValue} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpen(false)}
                  className="bg-neutral-50 dark:bg-neutral-900"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : null}
                  Update Todo
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};

// FormField Component
function FormField({ label, error, children, required }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export const EditTodoDialog = React.memo(EditTodoDialogComponent);