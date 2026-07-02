import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, X } from 'lucide-react';
import roleApi from '@/Apis/role_Api';

const DeleteRoleDialog = ({ open, onOpenChange, role, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response=await roleApi.deleteRole(role._id);
      if(response.success)
      {
         onOpenChange(false);
         onDelete(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Delete {role?.name}?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
        </DialogHeader>

        <div className="py-4 text-sm">
          All users with this role will lose their permissions.
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogClose>
          <Button 
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
                Delete Role
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRoleDialog;