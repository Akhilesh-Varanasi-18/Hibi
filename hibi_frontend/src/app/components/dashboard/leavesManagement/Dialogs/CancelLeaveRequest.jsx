"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import LeaveManagementApi from '@/Apis/LeaveManagement'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
const CancelLeaveRequest = ({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    selectedLeave,
}) => {
    const [loader, setLoader] = useState(false);
    const { toast } = useToast();
    const formatDate = (dateString) => {
        const date = new Date(dateString.split("T")[0]);
        return date.toDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const handleDeleteConfirm = async () => {
        if (selectedLeave) {
            setLoader(true);
            console.log(selectedLeave._id);
            const response = await LeaveManagementApi.cancelLeave({ "leaveRequestId": selectedLeave._id });
            if (response.success) {
                toast({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> <span>{response?.data?.message}</span>
                    </div>,

                })
                onConfirm();
            } else {
                toast({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>{response?.data}</span>
                    </div>,
                })
            }
            setLoader(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Are you sure you want to Cancel this leave request?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently Cancel the leave request
                        {selectedLeave?.employee ? ` of ${selectedLeave?.employee} ` : " "}
                        {selectedLeave?.requestedBy ? ` of ${selectedLeave?.requestedBy} ` : " "}
                        from {selectedLeave && formatDate(selectedLeave.startDate)} to{' '}
                        {selectedLeave && formatDate(selectedLeave.endDate)}.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={loader}
                    >
                        {loader ? "Cancelling..." : "Proceed"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CancelLeaveRequest;