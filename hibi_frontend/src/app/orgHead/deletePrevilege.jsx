import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, X } from 'lucide-react';
import privilegeApi from '@/Apis/previlege_Api';

const DeletePrivilegeDialog = ({
    open,
    onOpenChange,
    privilege,
    onDelete,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!privilege) return;
        setIsLoading(true);
        try {
            const response = await privilegeApi.deletePrivilege(privilege._id);
            if (response.success) {
                onDelete(privilege.id);
                onOpenChange(false);
            }
            else {
                console.error("Failed to delete privilege:", response.error);
                // Optionally show an error message to the user
            }
        } catch (error) {

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Privilege</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the privilege.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center gap-3 bg-destructive/10 p-4 rounded-lg border border-destructive/30">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <div>
                            <h4 className="font-medium">{privilege?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                                {privilege?.description}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Privilege
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeletePrivilegeDialog;