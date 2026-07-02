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
import { Textarea } from "@/components/ui/textarea";
import privilegeApi from '@/Apis/previlege_Api';
import { de } from 'date-fns/locale';


const AddingPrevilege = () => {
  const [PrevName, setPrevName] = useState('');
  const [PrevDescription, setPrevDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handlePrevilege() {
    const data = await privilegeApi.createPrevilege({
      name: PrevName,
      description: PrevDescription,
    })
    if (data.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setPrevName('');
        setPrevDescription('');
      }, 1500);
    }
    else{
      alert(data.message || 'Failed to create previlege');
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2`}>
          <PlusCircle className="h-4 w-4" />
          Add Previlege
        </Button>
      </DialogTrigger>

      <DialogContent className={`sm:max-w-[450px] `}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <DialogTitle className="text-center">Previlege Added</DialogTitle>
            <DialogDescription className="text-center">
              The role "{PrevName}" has been successfully created.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Previlege</DialogTitle>
              <DialogDescription>
                Define a new Previlege and its description. Click save when you're done.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role-name" className="text-right">
                  Previlege Name
                </Label>
                <Input
                  id="role-name"
                  value={PrevName}
                  onChange={(e) => setPrevName(e.target.value)}
                  placeholder="e.g., Administrator"
                  className="col-span-3"
                  minlength={3}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="role-description" className="text-right mt-2">
                  Description
                </Label>
                <Textarea
                  id="role-description"
                  value={PrevDescription}
                  onChange={(e) => setPrevDescription(e.target.value)}
                  placeholder="Describe the role's permissions and purpose"
                  className="col-span-3"
                  rows={3}
                  minlength={5}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handlePrevilege}
                disabled={(!PrevName.trim() || !PrevDescription.trim()) ||
                  PrevName.trim().length < 3 || PrevDescription.trim().length < 5}
              >
                Create Previlege
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddingPrevilege;