"use client"
import { Button } from '@/components/ui/button'
import React, { useContext, useState } from 'react'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'
import { ToDoApis } from '@/Apis/ToDoApis'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UsersContext } from '@/app/context/UserContext'

const MarkAsComplete = ({ task, todoId, refresh }) => {
    const { toast } = useToast();
    const { user } = useContext(UsersContext);

    const [loading, setLoading] = useState(false);

    // Only people who created this task or who completed this task can mark it to pending state
    const canMarkAsPending = () => {
        const createdByEmail = task?.taskCreatedByInfo?.officeMail;
        const completedByEmail = task?.taskCompletedByInfo?.officeMail;
        return (
            (createdByEmail && createdByEmail === user?.officeMail) ||
            (completedByEmail && completedByEmail === user?.officeMail)
        );
    };

    // Handles toggling a task's completion status (complete <-> pending)
    const handleToggle = async () => {
        setLoading(true);
        const data = {
            toDoId: todoId,
            taskId: task._id,
            toggle: !task.isCompleted
        };
        try {
            const res = await ToDoApis.changeTodoStatus(data);
            if (res.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg p-1">
                                <TiTick />
                            </div>
                            <span>{res?.data?.message || "Task status updated"}</span>
                        </div>
                    ),
                });
                // Refresh parent if provided
                task.isCompleted = !task.isCompleted;
                refresh && refresh();
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg p-1">
                                <RxCross2 />
                            </div>
                            <span>{res?.error || "Failed to update task status"}</span>
                        </div>
                    ),
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // For completed tasks: Only show "mark as pending" if allowed (see above)
    // For uncompleted tasks: Everyone can mark as completed
    // For others: they see "mark as completed" only
    if (task.isCompleted) {
        return (
            canMarkAsPending() ? (
                <Button
                    variant="outline"
                    className="text-xs flex gap-1 items-center"
                    onClick={handleToggle}
                    disabled={loading}
                >
                    {loading
                        ? <Loader2 className="animate-spin mr-1" size={16} />
                        : <RxCross2 />
                    }
                    mark as pending
                </Button>
            ) : (
                <Tooltip>
                    {/* For users who are not creator or completer: only allowed to mark as completed, no rollback to pending */}
                    <TooltipTrigger>
                        <Button
                            variant="outline"
                            className="text-xs flex gap-1 items-center opacity-60 cursor-not-allowed"
                            disabled
                        >
                            <RxCross2 />
                            mark pending
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Only the creator of this To Do or the person who completed this task can mark it as pending
                    </TooltipContent>
                </Tooltip >

            )
        )
    } else {
        // For other people they can only mark as completed
        return (
            <Button
                variant="outline"
                className="text-xs flex gap-1 items-center"
                onClick={handleToggle}
                disabled={loading}
            >
                {loading
                    ? <Loader2 className="animate-spin mr-1" size={16} />
                    : <TiTick />
                }
                mark as completed
            </Button>
        )
    }
}

export default MarkAsComplete