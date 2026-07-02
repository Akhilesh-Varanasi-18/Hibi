"use client";
// Import necessary hooks and UI components
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';

/**
 * DeleteOrganizationDialog
 * 
 * This component renders a dialog/modal for confirming and performing the deletion of an organization.
 * 
 * Props:
 * - organizationId: The unique ID of the organization to be deleted.
 * - onSuccess: Callback function to be called after successful deletion.
 * 
 * Functionality Overview:
 * - Renders a "Delete" button (with trash icon) as the trigger.
 * - When clicked, opens a confirmation dialog.
 * - User can cancel or confirm the deletion.
 * - On confirmation, calls the backend API to delete the organization.
 * - Shows loading state while deleting.
 * - Notifies parent component on success.
 */
export default function DeleteOrganizationDialog({ organizationId, onSuccess }) {
  // State to control whether the dialog is open or closed
  const [open, setOpen] = useState(false);
  // State to indicate if the deletion is in progress (for loading UI/disable buttons)
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * handleDelete
   * 
   * This async function is called when the user confirms deletion.
   * - Sets loading state.
   * - Calls the API to delete the organization by its ID.
   * - If successful, closes the dialog and calls the onSuccess callback.
   * - Handles and logs any errors.
   * - Resets loading state at the end.
   */
  const handleDelete = async () => {
    try {
      setIsSubmitting(true); // Start loading
      // Call backend API to delete the organization
      const response = await OrganizationApi.DeleteOrganization(organizationId);
      if (response.success) {
        setOpen(false); // Close the dialog on success
        // Notify parent component of successful deletion (pass organizationId)
        onSuccess?.(organizationId);
      }
    } catch (error) {
      // Log any errors that occur during deletion
      console.error("Failed to delete organization:", error);
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  return (
    // Dialog component controls the modal open/close state
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 
        DialogTrigger:
        - Renders the "Delete" button with trash icon.
        - When clicked, opens the confirmation dialog.
        - asChild allows the Button to be used as the trigger.
      */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-red-600 dark:text-red-400">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      {/* 
        DialogContent:
        - The modal content shown when dialog is open.
        - Shows a warning and asks for confirmation.
        - Provides Cancel and Delete actions.
      */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this organization? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          {/* 
            Cancel Button:
            - Closes the dialog without deleting.
            - Disabled while submitting.
          */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {/* 
            Confirm Delete Button:
            - Calls handleDelete to perform deletion.
            - Shows loading text while submitting.
            - Disabled while submitting.
          */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}