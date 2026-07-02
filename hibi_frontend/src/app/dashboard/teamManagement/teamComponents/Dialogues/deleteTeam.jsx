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

export function DeleteTeamDialog({ teamName, open, onConfirm, teamId, onOpenChange }) {
    // State for loading indicator during deletion
    const [loader, setloader] = useState(false);
    
    // Toast with null safety
    const { toast } = useToast() ?? {};

    // Handle team deletion
    const handleDelete = async () => {
        setloader(true);
        
        try {
            const res = await TeamManagementApi.deleteTeam(teamId) ?? {};
            
            if (res?.success) {
                // Call success callback with team ID
                onConfirm?.(teamId);
                
                // Show success toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
                        <span>{res?.data ?? "Team deleted successfully"}</span>
                    </div>,
                })
            } else {
                // Show error toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                        <span>{res?.error ?? "Failed to delete team"}</span>
                    </div>,
                })
            }
        } catch (error) {
            console.error("Error deleting team:", error);
            
            // Show generic error toast
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                    <span>An error occurred while deleting the team</span>
                </div>,
            })
        } finally {
            setloader(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader>
                    {/* Dialog header with warning icon */}
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Team
                    </DialogTitle>
                    
                    {/* Confirmation message with team name */}
                    <DialogDescription>
                        Are you sure you want to delete <span className="font-semibold text-foreground">{teamName ?? "this team"}</span>? This action cannot be undone.
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
                            {loader ? "Deleting..." : "Delete Team"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}