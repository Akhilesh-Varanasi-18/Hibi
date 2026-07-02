import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { HolidaysAPI } from "@/Apis/Holidays_Apis";
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"

const DeleteHoliday = ({ id, refresh }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {toast}=useToast();
  const handleDelete = async () => {
    setLoading(true);
      const res = await HolidaysAPI.deleteHoliday(id);
      if(res.success)
      {
      console.log("Delete holiday response:", res);
      toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>{res.message || "Holidays Deleted successfully!"}</span>
                        </div>
                    ),
                })
      setOpen(false);
      refresh && refresh();
      }else{
        toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{res.error}</span>
                    </div>
                ),
            })
      }
      setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-70 group-hover:opacity-100 transition"
          title="Delete"
        >
          <Trash2 className="w-5 h-5 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Holiday</DialogTitle>
        </DialogHeader>
        <div>
          <p>Are you sure you want to delete this holiday? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteHoliday;
