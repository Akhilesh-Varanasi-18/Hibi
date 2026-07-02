'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import PrivilegeTable from './PrivilegeTable';
import CreatePrivilege from './CreatePrivilege';
import UpdatePrivilege from './UpdatePrivilege';
import privilegeApi from '@/Apis/previlege_Api';
import { Skeleton } from '@/components/ui/skeleton';


export default function PrivilegeCard() {
  const [privileges, setPrivileges] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [loader, setloader] = useState(true);


  const fetchPrivileges = async () => {
    const res = await privilegeApi.getPrivileges();
    if (res.success) {
      setPrivileges(res.data)
    }
    else {
      console.log("Error Creating Previlge", res.error)
      setPrivileges([]);
    }
    setloader(false);

  };

  useEffect(() => { fetchPrivileges(); }, []);

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
      <Card >
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Privileges</CardTitle>
            <CardDescription>Manage system privileges and permissions</CardDescription>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setMode('create'); setSelected(null); }}>
                <PlusIcon className="mr-2 h-4 w-4" /> Add Privilege
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{mode === 'create' ? 'Add New Privilege' : 'Update Privilege'}</DialogTitle>
              </DialogHeader>
              {mode === 'create'
                ? <CreatePrivilege refresh={fetchPrivileges} close={() => setOpenDialog(false)} />
                : <UpdatePrivilege data={selected} refresh={fetchPrivileges} close={() => setOpenDialog(false)} />}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {privileges.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No privileges</div>
          ) : (
            <PrivilegeTable
              data={privileges}
              onEdit={(row) => { setSelected(row); setMode('update'); setOpenDialog(true); }}
              refresh={fetchPrivileges}
            />
          )}
        </CardContent>
      </Card>
  );
}
