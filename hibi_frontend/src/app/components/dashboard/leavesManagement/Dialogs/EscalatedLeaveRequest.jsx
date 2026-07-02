"use client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription, // Added missing import
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

function EscalateLeaveDialog({ data, onAction, loader, open, onOpenChange}) {
    const [escalationNote, setEscalationNote] = useState("")
    const [error, seterror] = useState("")
    const handleOpenChange = (isOpen) => {
        if (isOpen) {
            setEscalationNote("");
        }
        onOpenChange(isOpen);
    }
    // Handles the escalation action. Validates input before proceeding.
    const handleEscalate = () => {
        // Call the onAction prop with 'ESCALATE' and the escalation note
        onAction?.('ESCALATE', escalationNote);
    }
    useEffect(() => {
        if (escalationNote.trim().length > 200) {
            seterror("Escalation reason cannot exceed 200 characters.");
        }
        if (escalationNote.trim().length <4) {
            seterror("Escalation reason cannot be Less Than 3 Characters.");
        }
        if (escalationNote.trim().length >= 4 && escalationNote.trim().length <= 200) {
            seterror("");
        }
    }, [escalationNote])
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader className={"mt-5"}>
                    <DialogTitle>Escalate Leave Request of {data?.employee || 'the employee'}</DialogTitle>
                    <DialogDescription>
                        escalate this request and provide a reason
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                    <Textarea
                        placeholder="Escalation reason..."
                        value={escalationNote}
                        onChange={(e) => setEscalationNote(e.target.value)}
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
                            onClick={handleEscalate}
                            disabled={loader || error}
                        >
                            {loader ? "Processing..." : "Confirm Escalation"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default EscalateLeaveDialog;