"use client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

function ApproveLeaveDialog({ data, onAction, loader, open, onOpenChange }) {
    const [approvalNote, setApprovalNote] = useState("");
    const [error, seterror] = useState("");
    const handleOpenChange = (isOpen) => {
        if (isOpen) {
            setApprovalNote("");
        }
        onOpenChange(isOpen);
    }
    const handleApprove = () => {
        onAction('APPROVE', approvalNote);
    }

    useEffect(() => {
        if (approvalNote.trim().length > 200) {
            seterror("Approval note cannot exceed 200 characters.");
        }
        else {
            seterror("");
        }
    }, [approvalNote])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader className={"mt-5"}>
                    <DialogTitle>Approve Leave Request</DialogTitle>
                    <DialogDescription>
                        You are accepting the leave request of {data?.employee || 'the employee'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                    <Textarea
                        placeholder="Approval notes (optional)..."
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        disabled={loader}

                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loader}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={loader || error}
                        >
                            {loader ? "Processing..." : "Confirm Approval"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ApproveLeaveDialog;