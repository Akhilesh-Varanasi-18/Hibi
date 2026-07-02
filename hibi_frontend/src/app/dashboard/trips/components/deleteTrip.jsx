import TripApi from '@/Apis/TripsApi';
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import React, { useState } from 'react'
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';
import { useToast } from '@/hooks/use-toast';

const DeleteTrip = ({ open, setOpen, onSuccess, data }) => {
    const [loader, setLoader] = useState(false);
    const {toast}=useToast();
    async function handleDelete() {
        setLoader(true);
        try {
            const res = await TripApi.deleteTrip(data?._id);
            if (res?.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'>
                                <TiTick />
                            </div>
                            <span>{res?.data?.message ?? "Trip deleted successfully"}</span>
                        </div>
                    ),
                });
                setOpen(false);
                onSuccess();
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'>
                                <RxCross2 />
                            </div>
                            <span>{res?.error ?? "Failed to delete trip"}</span>
                        </div>
                    ),
                });
            }
        } catch (error) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'>
                            <RxCross2 />
                        </div>
                        <span>An error occurred while deleting the trip</span>
                    </div>
                ),
            });
            console.error('Delete trip error:', error);
        } finally {
            setLoader(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600 text-xl">
                        Delete Trip
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 pt-2">
                        Are you sure you want to delete the trip <span className="font-semibold text-black">"{data?.tripTitle}"</span>? 
                        This action cannot be undone and all trip data will be permanently removed.
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="w-full sm:w-auto border-gray-300 text-black hover:bg-gray-100"
                        disabled={loader}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700"
                        disabled={loader}
                    >
                        {loader ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deleting...
                            </div>
                        ) : (
                            'Delete Trip'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteTrip