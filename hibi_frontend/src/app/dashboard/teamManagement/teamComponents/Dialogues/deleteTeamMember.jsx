"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import TeamManagementApi from "@/Apis/TeamManagementApi"
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"

export function DeleteTeamMemberDialog({ 
    teamName, 
    onConfirm, 
    teamId, 
    memberId, 
    memberName, 
    open, 
    onOpenChange 
}) {
    // State for loading indicator during deletion process
    const [loader, setloader] = useState(false);
    
    // Toast with null safety
    const { toast } = useToast() ?? {};

    // Handle team member deletion
    const handleDelete = async () => {
        setloader(true);
        console.log(teamId, memberId);
        
        try {
            // Call API to delete team member with null safety
            const res = await TeamManagementApi.deleteTeamMember(teamId, memberId) ?? {};
            
            if (res?.success) {
                // Call success callback
                onConfirm?.();
                
                // Show success toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
                        <span>{res?.data ?? "Team member deleted successfully"}</span>
                    </div>,
                })
            } else {
                // Show error toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                        <span>{res?.error ?? "Failed to delete team member"}</span>
                    </div>,
                })
            }
        } catch (error) {
            console.error("Error deleting team member:", error);
            
            // Show generic error toast
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                    <span>An error occurred while deleting the team member</span>
                </div>,
            })
        } finally {
            setloader(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="sm:max-w-[425px]" 
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    {/* Dialog header with warning icon */}
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Team Member
                    </DialogTitle>
                    
                    {/* Confirmation message with member and team names */}
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                            {memberName ?? "this team member"}
                        </span>? From {teamName ?? "the team"}. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                    <div className="flex gap-2">
                        {/* Cancel button */}
                        <DialogClose asChild>
                            <Button variant="outline" disabled={loader}>
                                Cancel
                            </Button>
                        </DialogClose>
                        
                        {/* Delete button with loading state */}
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loader}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {loader ? "Deleting..." : "Delete Team Member"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}