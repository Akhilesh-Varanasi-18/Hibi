'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import axiosInstance from '@/config/axiosConfig';
import ShiftTable from './ShiftTable';
import CreateShift from './CreateShift';
import UpdateShift from './UpdateShift';
import shiftsApi from '@/Apis/shifts_Api';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShiftCard() {
  const [shifts, setShifts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
    const [loader, setloader] = useState(true);


  const fetchShifts = async () => {
    const res = await shiftsApi.getShifts();
      if(res.success){
        setShifts(res.data)
      }
      else{
        console.log("Error Creating Previlge", res.error)
      }
      setloader(false);
  };

  useEffect(() => { fetchShifts(); }, []);

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
      </Card>) 
    :
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Shifts</CardTitle>
          <CardDescription>Manage work shifts</CardDescription>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setMode('create'); setSelected(null); }}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === 'create' ? 'Add New Shift' : 'Update Shift'}</DialogTitle>
            </DialogHeader>
            {mode === 'create'
              ? <CreateShift refresh={fetchShifts} close={() => setOpenDialog(false)} />
              : <UpdateShift data={selected} refresh={fetchShifts} close={() => setOpenDialog(false)} />}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ShiftTable
          data={shifts}
          onEdit={(row) => { setSelected(row); setMode('update'); setOpenDialog(true); }}
          refresh={fetchShifts}
        />
      </CardContent>
    </Card>
  );
}
