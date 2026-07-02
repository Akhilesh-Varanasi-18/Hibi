'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';

import leaveTypeApi from '@/Apis/leaveType_Api';
// import LeaveTypeTable from './LeaveTypeTable';
// import CreateLeaveType from './CreateLeaveType';
// import UpdateLeaveType from './UpdateLeaveType';
import AttendenceTypeTable from './AttendencetypeTable';
import CreateAttendenceType from './createAttendenceType';
import UpdateAttendenceType from './updateAttendenceType';
import attendenceTypeapi from '@/Apis/AttendenceTypes';
import { Skeleton } from '@/components/ui/skeleton';

export default function AttendenceTypeCard() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loader, setloader] = useState(true);

  const fetchLeaveTypes = async () => {
    const res = await attendenceTypeapi.getAttendence();
    if (res.success) {
      setLeaveTypes(res.data);
      console.log(res.data);
    } else {
      console.error('Error fetching leave types:', res.error);
    }
    setloader(false);
  };

  useEffect(() => { fetchLeaveTypes(); }, []);

  const handleEdit = (row) => {
    setSelected(row);
    setOpenUpdateDialog(true);
  };

  return (
    loader ?
      (<Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className='flex flex-col gap-2'>
            <Skeleton className="w-[120px] h-5" />
            <Skeleton className="w-[120px] h-5" />
          </div>
          <div>
            <Skeleton className="w-[120px] h-10" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-10" />
            ))
          }
        </CardContent>
      </Card>) :
      (<Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Attendance Types</CardTitle>
            <CardDescription>Manage different Attendance categories</CardDescription>
          </div>
          
          {/* Create Dialog */}
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" /> Add Attendance Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Attendance Type</DialogTitle>
              </DialogHeader>
              <CreateAttendenceType 
                refresh={fetchLeaveTypes} 
                close={() => setOpenCreateDialog(false)} 
              />
            </DialogContent>
          </Dialog>

          {/* Update Dialog */}
          <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Attendance Type</DialogTitle>
              </DialogHeader>
              <UpdateAttendenceType 
                data={selected} 
                refresh={fetchLeaveTypes} 
                close={() => setOpenUpdateDialog(false)} 
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <AttendenceTypeTable
            data={leaveTypes}
            onEdit={handleEdit}
            refresh={fetchLeaveTypes}
          />
        </CardContent>
      </Card>)
  );
}