'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';

import leaveTypeApi from '@/Apis/leaveType_Api';
import LeaveTypeTable from './LeaveTypeTable';
import CreateLeaveType from './CreateLeaveType';
import UpdateLeaveType from './UpdateLeaveType';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaveTypeCard() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loader, setloader] = useState(true);

  const fetchLeaveTypes = async () => {
    const res = await leaveTypeApi.getLeaveTypes();
    if (res.success) {
      setLeaveTypes(res.data);
    } else {
      console.error('Error fetching leave types:', res.error);
    }
    setloader(false);
  };

  useEffect(() => { fetchLeaveTypes(); }, []);

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
              <Skeleton className="w-full h-10" />

            ))
          }
        </CardContent>
      </Card>) :
      (<Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Manage different leave categories</CardDescription>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setMode('create'); setSelected(null); }}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Leave Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{mode === 'create' ? 'Add New Leave Type' : 'Update Leave Type'}</DialogTitle>
                </DialogHeader>
                {mode === 'create'
                  ? <CreateLeaveType refresh={fetchLeaveTypes} close={() => setOpenDialog(false)} />
                  : <UpdateLeaveType data={selected} refresh={fetchLeaveTypes} close={() => setOpenDialog(false)} />}
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <LeaveTypeTable
              data={leaveTypes}
              onEdit={(row) => { setSelected(row); setMode('update'); setOpenDialog(true); }}
              refresh={fetchLeaveTypes}
            />
          </CardContent>
        </Card>)
  );
}
