import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import roleApi from '@/Apis/role_Api';
import CustomAlert from '../components/ReusableComponents/CustomAlert';

const EditRoleDialog = ({ open, onOpenChange, role, onSave }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role) setName(role.name);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        roleId: role._id,
        name: name
      }
      const response = await roleApi.updateRole(data);
      if (response.success) {
        onSave(response.data);
        onOpenChange(false);
      }
      else {
        console.log("update failed")
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
        <form onSubmit={handleSubmit}>
          <DialogHeader >
            <DialogTitle>Edit Role</DialogTitle>
            <CustomAlert text="Changing Role name will result new name to all the employees assigned to this role" type="highalert" />
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="admin"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={name.trim().length < 3}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;