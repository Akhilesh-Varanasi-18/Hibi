'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Announcements_Apis } from '@/Apis/Announcements_Apis'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'
import { Trash2 } from 'lucide-react'

const DeleteAnnouncement = ({ id, refresh }) => {
    const [open , setOpen] = useState(false);
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [confirmationText, setConfirmationText] = useState('')

    const handleDelete = async () => {
        setLoading(true)
        try {
            const res = await Announcements_Apis.deleteAnnouncement(id)
            if (res.success) {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Announcement deleted successfully!</span>
                        </div>
                    ),
                })
                if (typeof refresh === 'function') refresh()
                setOpen(false)
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error || "Failed to delete announcement."}</span>
                        </div>
                    ),
                })
            }
        } catch (err) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Something went wrong.</span>
                    </div>
                ),
            })
        } finally {
            setLoading(false)
            setConfirmationText('')
        }
    }

    const handleCancel = () => {
        setOpen(false)
        setConfirmationText('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
                    <Trash2 />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Announcement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>Are you sure you want to delete this announcement? This action cannot be undone.</p>
                    <div className="space-y-2">
                        <label htmlFor="confirmation" className="text-sm">
                            Type <span className="font-bold text-destructive">delete</span> to confirm
                        </label>
                        <Input
                            id="confirmation"
                            value={confirmationText}
                            onChange={e => setConfirmationText(e.target.value)}
                            placeholder="Type delete here"
                            disabled={loading}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading || confirmationText !== 'delete'}
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteAnnouncement
