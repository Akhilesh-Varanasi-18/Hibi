"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import TeamManagementApi from "@/Apis/TeamManagementApi"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import { AlertCircle } from "lucide-react"
import Comparing from "@/utils/CommonFunctionality"

export function ChangeRoleDialog({
    open,
    onOpenChange,
    onSuccess,
    user,
    currentRole,
    teamId,
    ManagerLength
}) {
    // State for selected role and loading status
    const [selectedRole, setSelectedRole] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    
    // Toast with null safety
    const { toast } = useToast() ?? {}

    // Reset selected role when dialog opens/closes or current role changes
    useEffect(() => {
        if (open && currentRole) {
            setSelectedRole(currentRole)
        } else {
            setSelectedRole("")
        }
    }, [open, currentRole])

    // Handle role change submission
    const handleRoleChange = async () => {
        // Don't proceed if no role selected or role hasn't changed
        if (!selectedRole || selectedRole === currentRole) {
            onOpenChange?.(false)
            return
        }

        setIsLoading(true)

        try {
            const Data = {
                "teamId": teamId ?? "",
                "employeeId": user?._id ?? "",
                "fromRole": currentRole ?? "",
                "toRole": selectedRole ?? ""
            }
            
            const response = await TeamManagementApi.Assignrole(Data) ?? {}
            
            if (response?.success) {
                // Show success toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                        <span>{response?.data ?? "Role updated successfully"}</span>
                    </div>,
                });
                onSuccess?.() // Safe callback invocation
            } else {
                // Show error toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{response?.error ?? "Failed to update role"}</span>
                    </div>,
                });
            }
        } catch (error) {
            console.log("Error changing role:", error)
            // Show generic error toast
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>An error occurred while updating the role</span>
                </div>,
            });
        } finally {
            setIsLoading(false)
            onOpenChange?.(false) // Safe callback invocation
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                        {/* Safe user data access */}
                        Update the role for {user?.firstName ?? "User"} {user?.lastName ?? ""} of role {currentRole ?? "current role"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    {/* Warning message */}
                    <div className="bg-yellow-50 dark:bg-red-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Changing a role will impact privilege access rights.
                        </p>
                    </div>
                    
                    {/* Role selection */}
                    <div className="grid grid-cols-3 items-center gap-4 w-[350px]">
                        <Label htmlFor="role" className="text-left">
                            Role
                        </Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPLOYEE">Team Member</SelectItem>
                                <SelectItem value="TeamLead">Team Lead</SelectItem>
                                {/* Only show Manager option if no managers exist or user is current manager */}
                                {(ManagerLength === 0 || currentRole === "Manager") && (
                                    <SelectItem value="Manager">Manager</SelectItem>
                                )}
                                
                                {(Comparing.compareStrings(currentRole,"INTERN")) && <SelectItem value="INTERN">Intern</SelectItem> }
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    {/* Cancel button */}
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange?.(false)} // Safe callback
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    
                    {/* Update role button */}
                    <Button
                        onClick={handleRoleChange}
                        disabled={isLoading || selectedRole === currentRole || !selectedRole}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Role"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}