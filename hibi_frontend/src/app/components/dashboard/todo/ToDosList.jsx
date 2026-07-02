"use client";
import { ToDoApis } from "@/Apis/ToDoApis";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useContext, useEffect, useState } from "react";
import { CustomActionDialog } from "../../ReusableComponents/CustomActionDialog";
import { Trash2 } from "lucide-react";
import DeleteButton from "../../ReusableComponents/DeleteButton";
import { Approved, Pending } from "@/components/ui/Approval";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import MarkAsComplete from "./MarkAsComplete";
import PriorityLabel from "./PriorityLabel";
import PeoplesCard from "./PeoplesCard";
import UpdateTodo from "./UpdateTodo";
// PeoplesCard is a reusable component for rendering people avatars with optional labels and a popup showing details on click.
// Usage: Pass peoplesArray as an array of objects containing at least label (name), url (avatar image), and desc (for example, email or additional info).


import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Comparing from "@/utils/CommonFunctionality";
import { UsersContext } from "@/app/context/UserContext";
import UserCard from "../../ReusableComponents/UserCard";
import CustomAvatar from "../../ReusableComponents/CustomAvatar";

// Helper to sort todos by endDate or fallback startDate
const sortToDos = (data, direction) => {
  return [...data].sort((a, b) => {
    const getSortDate = (todo) =>
      todo.endDate ? new Date(todo.endDate) : new Date(todo.startDate);
    const dateA = getSortDate(a);
    const dateB = getSortDate(b);
    if (direction === "latest") {
      return dateB - dateA;
    }
    return dateA - dateB;
  });
};

// Main todo list component
const ToDosList = ({
  priorityOptions,
  employees, // contains {_id, name}
  refresh,
}) => {
  const [toDos, setToDos] = useState([]);
  const [filteredToDos, setFilteredToDos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortDirection, setSortDirection] = useState("latest");

  // Delete dialog controls
  const [openTodoTask, setOpenTodoTask] = useState(false);
  const [openTodo, setOpenTodo] = useState(false);
  const [ExtraValues, setExtraValues] = useState(null);
  const { previlege } = useContext(UsersContext);
  const { toast } = useToast();

  // Fetch all todos
  const getToDos = async () => {
    setLoading(true);
    try {
      const res = await ToDoApis.getToDos();
      const data = res.data?.toDoItems || [];
      const sortedData = sortToDos(data, "latest");
      setToDos(sortedData);
      setFilteredToDos(sortedData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when refreshed
  useEffect(() => {
    getToDos();
  }, [refresh]);

  // Filter todos when filters change
  useEffect(() => {
    let filtered = [...toDos];

    // Priority filter
    if (selectedPriority !== "all") {
      filtered = filtered.filter((item) => item.priority === selectedPriority);
    }

    // Start date
    if (startDate) {
      filtered = filtered.filter(
        (item) => new Date(item.startDate) >= new Date(startDate)
      );
    }

    // End date (by endDate or fallback to startDate)
    if (endDate) {
      filtered = filtered.filter(
        (item) =>
          new Date(item.endDate || item.startDate) <= new Date(endDate)
      );
    }

    // Employee filter by assignment
    if (selectedEmployeeId !== "all") {
      filtered = filtered.filter((item) =>
        Array.isArray(item.employeesAssignedInfo)
          ? item.employeesAssignedInfo.some(
            (emp) => emp._id === selectedEmployeeId
          )
          : false
      );
    }

    // Status (pending/completed)
    if (selectedStatus !== "all") {
      const isCompletedStatus = selectedStatus === "completed";
      filtered = filtered.filter((item) =>
        Array.isArray(item.todoList)
          ? item.todoList.some((task) => task.isCompleted === isCompletedStatus)
          : selectedStatus === "pending"
      );
    }

    // Re-sort filtered todos
    const sorted = sortToDos(filtered, sortDirection);
    setFilteredToDos(sorted);
  }, [
    selectedPriority,
    startDate,
    endDate,
    selectedStatus,
    selectedEmployeeId,
    sortDirection,
    toDos,
  ]);

  // Single task deletion config
  const deleteTodoTaskConfig = {
    Title: "Delete this Task",
    Desc: "This Action Cannot be Undone so make sure about this.",
    submitLabel: (
      <div className="flex items-center">
        <Trash2 className="mr-2" /> Delete
      </div>
    ),
    DialogVariant: "destructive",
    submitVariant: "destructive",
    DialogLabel: <Trash2 className="inline" />,
    hideCancel: true,
    onSubmit: async (data) => {
      const res = await ToDoApis.deleteToDoTask(data);
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data?.message || "Task Deleted Successfully"}</span>
            </div>
          ),
        });
        getToDos();
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg p-1">
                <RxCross2 />
              </div>
              <span>{res?.error || "Failed to Delete task"}</span>
            </div>
          ),
        });
      }
    },
    Fields: [],
  };

  // Todo module deletion config
  const deleteTodoConfig = {
    Title: "Delete Entire Todo",
    Desc: "This Action Cannot be UnDone so make sure about this.",
    submitLabel: (
      <div className="flex items-center">
        <Trash2 className="mr-2" /> Delete
      </div>
    ),
    DialogVariant: "destructive",
    submitVariant: "destructive",
    DialogLabel: <Trash2 className="inline" />,
    hideCancel: true,
    onSubmit: async (data) => {
      const res = await ToDoApis.deleteToDo(data);
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data?.message || "To-Do Deleted Successfully"}</span>
            </div>
          ),
        });
        getToDos();
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg p-1">
                <RxCross2 />
              </div>
              <span>{res?.error || "Failed to Delete To-Do"}</span>
            </div>
          ),
        });
      }
    },
    Fields: [],
  };

  // Open single task delete dialog
  const handleDeleteDialogOpen = (extraValues) => {
    setExtraValues(extraValues);
    setOpenTodoTask(true);
  };

  // Open todo module delete dialog
  const handleDeleteEntireTodo = (extraValues) => {
    setOpenTodo(true);
    setExtraValues(extraValues);
  };

  // Skeleton cards renderer
  const renderSkeletons = (count = 3) =>
    Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="w-full mb-2">
        <CardHeader className="pb-4 pt-6">
          <Skeleton className="h-5 w-36 rounded mb-2" />
          <Skeleton className="h-4 w-24 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded" />
        </CardContent>
      </Card>
    ));

  // The UI for ToDosList, which includes all the filter bar and list rendering logic
  return (
    <div className="w-full flex flex-col gap-4 overflow-hidden">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOptions?.map((option) => (
                <SelectItem key={option._id} value={option._id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Status filter */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Has Completed Tasks</SelectItem>
              <SelectItem value="pending">Has Pending Tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Employee filter */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground">Employee</label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees?.map((employee) => (
                <SelectItem key={employee._id} value={employee._id}>
                  {employee.name ||
                    `${employee.firstName || ""} ${employee.lastName || ""}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Sort by date */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground">Date Sort</label>
          <Select value={sortDirection} onValueChange={setSortDirection}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="oldest">Old First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* To-Do List */}
      {loading ? (
        <div className="w-full">{renderSkeletons(3)}</div>
      ) : filteredToDos?.length === 0 ? (
        <div className="w-full text-center text-muted-foreground py-10">
          No To-Dos Found matching current filters
        </div>
      ) : (
        <div className="w-full">
          {filteredToDos.map((item, i) => {
            // Date string formatting helpers
            const formatModern = (dateString) => {
              if (!dateString) return "";
              const d = new Date(dateString);
              return d.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            };

            // Calculate task completion status for the whole todo/module
            const totalTasks = Array.isArray(item.todoList) ? item.todoList.length : 0;
            const completedTasks =
              Array.isArray(item.todoList)
                ? item.todoList.filter((t) => t.isCompleted).length
                : 0;

            // Check if ALL tasks completed AND there is at least 1 task
            const isTodoFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

            // Check if NON ADMIN/SUPERADMIN (disable for other employees)
            const isNonAdmin =
              !Comparing.compareStrings(previlege, "ADMIN") &&
              !Comparing.compareStrings(previlege, "SUPERADMIN");

            // Decide if user interaction should be disabled
            const shouldDisableForUser = isTodoFullyCompleted && isNonAdmin;

            return (
              <div
                key={item._id || i}
                className={`w-full mb-2${shouldDisableForUser ? " opacity-70 select-none grayscale cursor-not-allowed" : ""}`}
                style={shouldDisableForUser ? { pointerEvents: "none", filter: "grayscale(1)", opacity: 0.7, cursor: "not-allowed" } : {}}
                tabIndex={0}
                aria-disabled={shouldDisableForUser}
              >
                <Card
                  disabled={shouldDisableForUser}
                  className="w-full h-full shadow-none"
                  style={{ boxShadow: "none" }}
                >
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex justify-between items-center">
                      {/* Module name and priority */}
                      <div className="flex items-center">
                        <CardTitle className="text-lg font-semibold">
                          {item.moduleName || "Untitled Module"}
                        </CardTitle>
                        <PriorityLabel priority={item.priority} />
                      </div>
                      {/* Module actions (edit/delete) for admins */}
                      <div className="flex flex-wrap items-center gap-1">
                        {(Comparing.compareStrings(previlege, "ADMIN") ||
                          Comparing.compareStrings(previlege, "SUPERADMIN")) && (
                            <>
                              <UpdateTodo
                                item={item}
                                employees={employees}
                                priorityOptions={priorityOptions}
                                refresh={getToDos}
                              />
                              <div onClick={() => handleDeleteEntireTodo({ toDoId: item?._id })}>
                                <DeleteButton />
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                    {/* Display module date range */}
                    {(item.startDate || item.endDate) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/40 px-3 py-1 rounded-full mt-2">
                        <span className="font-medium text-foreground">Dates:</span>
                        {item.startDate && (
                          <span>
                            <span className="font-semibold">Start</span> · {formatModern(item.startDate)}
                          </span>
                        )}
                        {item.startDate && item.endDate && (
                          <span className="mx-1 text-foreground/60">—</span>
                        )}
                        {item.endDate && (
                          <span>
                            <span className="font-semibold">End</span> · {formatModern(item.endDate)}
                          </span>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 overflow-y-auto">
                    {/* Map through tasks in this module */}
                    {Array.isArray(item.todoList) && item.todoList.length > 0 ? (
                      item.todoList.map((todo, ti) => {
                        const isCompleted = todo?.isCompleted;

                        const formatUTC = (dateString) => {
                          if (!dateString) return "";
                          const date = new Date(dateString);
                          return date.toISOString().slice(0, 19).replace("T", " ");
                        };

                        return (
                          <div
                            key={todo._id || ti}
                            className={`group relative w-full h-auto overflow-x-scroll rounded-2xl border transition-all duration-300
    ${isCompleted
                                ? "bg-gradient-to-br from-green-50/80 to-green-100/90 dark:from-green-900/60 dark:to-green-950/70 border-green-500/50"
                                : "bg-accent/20 dark:bg-accent/30 border-accent/60"}
    hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]
    p-4 mb-3 backdrop-blur-md`}
                          >
                            {/* --- Header: Task name + Created by --- */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[0.9rem] font-semibold tracking-tight leading-snug text-foreground">
                                {todo.taskName || "Untitled Task"}
                              </span>

                              <div className="flex items-center gap-2">
                                <CustomAvatar
                                  url={todo.taskCreatedByInfo?.profileImage || ""}
                                  label={
                                    todo.taskCreatedByInfo?.name ||
                                    `${todo.taskCreatedByInfo?.firstName || ""} ${todo.taskCreatedByInfo?.lastName || ""}`.trim()
                                  }
                                  showTooltip
                                  toolTipContent={`${todo.taskCreatedByInfo?.name ||
                                    `${todo.taskCreatedByInfo?.firstName || ""} ${todo.taskCreatedByInfo?.lastName || ""}`.trim()
                                    } created this task`}
                                />
                              </div>
                            </div>

                            {/* --- Body: Completed by + Status / Actions --- */}
                            <div className="flex justify-between items-center text-xs mt-1 gap-2">
                              {/* Left side: Completed info */}
                              <div className="flex items-center gap-2 min-h-[28px] text-muted-foreground">
                                {todo.isCompleted && todo.completedBy ? (
                                  <>
                                    <span className="font-medium text-foreground/70">Completed by</span>
                                    <PeoplesCard
                                      label={null}
                                      peoplesArray={
                                        todo?.taskCompletedByInfo && (todo.taskCompletedByInfo.firstName || todo.taskCompletedByInfo.name)
                                          ? [
                                            {
                                              label:
                                                todo.taskCompletedByInfo.name ||
                                                `${todo.taskCompletedByInfo.firstName || ""} ${todo.taskCompletedByInfo.lastName || ""}`.trim(),
                                              url: todo.taskCompletedByInfo.profileImage || "",
                                              desc:
                                                todo.taskCompletedByInfo.officeMail ||
                                                todo.taskCompletedByInfo.email ||
                                                "",
                                            },
                                          ]
                                          : []
                                      }
                                    />
                                    <span className="font-mono text-[0.7rem] opacity-70">
                                      ({formatUTC(todo.completedAt)})
                                    </span>
                                  </>
                                ) : (
                                  <span className="min-h-[26px]"></span>
                                )}
                              </div>

                              {/* Right side: Status + Actions */}
                              <div className="flex items-center gap-2">
                                {todo.isCompleted ? (
                                  <Approved label="Completed" />
                                ) : (
                                  <Pending label="Pending" />
                                )}

                                <MarkAsComplete
                                  task={todo}
                                  todoId={item?._id}
                                  refresh={getToDos}
                                  disabled={shouldDisableForUser}
                                />

                                {(Comparing.compareStrings(previlege, "ADMIN") ||
                                  Comparing.compareStrings(previlege, "SUPERADMIN")) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteDialogOpen({
                                          toDoId: item?._id,
                                          taskId: todo?._id,
                                        })
                                      }
                                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-accent/40 hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent/60"
                                    >
                                      <DeleteButton />
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>

                        );
                      })
                    ) : (
                      <div className="text-muted-foreground text-xs">
                        No tasks in this module.
                      </div>
                    )}
                  </CardContent>

                  {/* Assigned people for this module (at module level) */}
                  <CardFooter>
                    {/* 
                      PeoplesCard displays profile avatars and basic user info.
                      Pass an array: { label, url, desc }, where desc is usually officeMail.
                    */}
                    <PeoplesCard
                      label={"People :"}
                      showDialog={true}
                      peoplesArray={
                        Array.isArray(item?.employeesAssignedInfo)
                          ? item.employeesAssignedInfo.map((emp) => ({
                            label:
                              emp.name ||
                              `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim(),
                            url: emp?.profileImage || "",
                            desc: emp?.officeMail || emp?.email || "",
                            _id: emp?._id
                          }))
                          : []
                      }
                    />
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      )}
      {/* Delete dialogs */}
      <CustomActionDialog
        config={{ ...deleteTodoTaskConfig, ExtraValues }}
        open={openTodoTask}
        setOpen={setOpenTodoTask}
      />
      <CustomActionDialog
        config={{ ...deleteTodoConfig, ExtraValues }}
        open={openTodo}
        setOpen={setOpenTodo}
      />
    </div>
  );
};

export default ToDosList;