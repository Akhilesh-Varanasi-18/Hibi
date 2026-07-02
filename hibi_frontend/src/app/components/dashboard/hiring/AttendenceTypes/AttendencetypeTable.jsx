'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
// import leaveTypeApi from '@/Apis/leaveType_Api';
import attendenceTypeapi from '@/Apis/AttendenceTypes';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function AttendenceTypeTable({ data, onEdit, refresh }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await attendenceTypeapi.deleteAttendence(id);
      if (res.success) {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
              <span>Attendance type deleted successfully!</span>
            </div>
          ),
        });
        refresh();
      } else {
        toast({
          title: (
            <div className='flex gap-2 items-center'>
              <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
              <span>{res?.error || "Failed to delete Attendance type."}</span>
            </div>
          ),
        });
        console.error('Delete failed:', res.error);
      }
    } catch (err) {
      toast({
        title: (
          <div className='flex gap-2 items-center'>
            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
            <span>Something went wrong.</span>
          </div>
        ),
      });
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmationText('');
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await handleDelete(deleteId);
      setDeleteId(null);
      setConfirmationText('');
      setOpenDialog(false);
    }
  };

  const handleCancel = () => {
    setDeleteId(null);
    setConfirmationText('');
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No Attendance types found.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Short Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row._id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="font-mono uppercase bg-muted/50 px-4 py-2 rounded-md text-sm">
                {row.shortName}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {/* <Button variant="outline" size="sm" onClick={() => onEdit(row)} disabled={loading}>
                  <PencilIcon className="h-4 w-4" />
                </Button> */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(row._id)}
                  disabled={loading}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this Attendance type? This action cannot be undone.</p>
            <div className="space-y-2">
              <label htmlFor="confirmation" className="text-sm">
                Type <span className="font-bold text-destructive">delete</span> to confirm
              </label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type delete here"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={loading || confirmationText !== 'delete'}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}