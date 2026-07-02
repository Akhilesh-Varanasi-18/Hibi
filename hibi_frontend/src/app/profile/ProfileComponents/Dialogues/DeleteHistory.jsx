import CarrierApi from '@/Apis/CarrierHistory';
import CustomAlert from '@/app/components/ReusableComponents/CustomAlert';
import { Button } from '@/components/ui/button';
import { DialogContent, Dialog, DialogHeader, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react'
import { RxCross2 } from 'react-icons/rx';
import { TiTick } from 'react-icons/ti';

const DeleteHistory = ({ open, setOpen, data, onSucess }) => {
    const [isLoading, setisLoading] = useState(false);
    const { toast } = useToast();
    async function handleSave() {
        setisLoading(true);
        const res = await CarrierApi.deleteHistory(data._id);
        if (res.success) {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{res?.data?.message}</span>
                </div>,
            })
            onSucess();
            setOpen(false);
        }
        else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{res?.error}</span>
                </div>,
            })
        }
        setisLoading(false);
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Delete Carrier History
                    </DialogTitle>
                    <DialogDescription>
                        you are Deleting Your Carrier History of ({data.organizationName})
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => { setOpen(false) }}
                        disabled={isLoading}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        type="button"
                        variant="destructive"
                    >
                        {isLoading ? "Deleting.." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteHistory