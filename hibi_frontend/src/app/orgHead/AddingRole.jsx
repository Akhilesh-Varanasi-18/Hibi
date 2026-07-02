import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import roleApi from '@/Apis/role_Api';

const AddingRole = () => {
  const [RoleName, setRoleName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRole = async () => {
    // Here you would typically call an API to add the privilege
    const response = await roleApi.createRole({ name: RoleName });
    if (response.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setRoleName('');
      }, 1500);
    }
    else{
      // Handle error case
      console.error(response.error);
      alert(response.error);
      setIsSuccess(false);
    }
    // Simulate success

  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Role
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <DialogTitle className="text-center">Role Added</DialogTitle>
            <DialogDescription className="text-center">
              The Role "{RoleName}" has been successfully added.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Enter the name of the Role you want to add. Click save when you're done.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="privilege-name" className="text-right">
                  Role Name
                </Label>
                <Input
                  id="privilege-name"
                  value={RoleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="col-span-3"
                  minlength={3}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleRole}
                disabled={!RoleName.trim() || RoleName.trim().length < 3}
              >
                Add Role
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddingRole;