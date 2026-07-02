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

function RejectLeaveDialog({ data, onAction, loader, open, onOpenChange }) {
  const [rejectionNote, setRejectionNote] = useState("");
  const [error, seterror] = useState("");

  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setRejectionNote("");
    }
    onOpenChange(isOpen);
  }

  useEffect(() => {
    if (rejectionNote.length === 0) {
      seterror("Rejection reason is required.");
    }
    else if (rejectionNote.trim().length < 4) {
      seterror("Rejection reason cannot be Less Than 3 Characters.");
    }
    else if (rejectionNote.length > 0 && rejectionNote.trim().length === 0) {
      seterror("Rejection reason cannot be empty or just spaces.");
    }
    else if (rejectionNote.trim().length >= 200) {
      seterror("Rejection Cannot exceed 200 characters.");
    }
    else {
      seterror("");
    }
  }, [rejectionNote])


  const handleReject = () => {
    onAction('REJECT', rejectionNote);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader className={"mt-5"}>
          <DialogTitle>Reject Leave Request of {data?.employee || 'the employee'}</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this leave request
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <Textarea
            placeholder="Rejection reason..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
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
              onClick={handleReject}
              disabled={loader || error}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loader ? "Processing..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default RejectLeaveDialog;