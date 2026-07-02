'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import PermissionTable from './PermissionTable';
import CreatePermission from './CreatePermission';
import UpdatePermission from './UpdatePermission';
import permissionApi from '@/Apis/permission_Api';
import { Skeleton } from '@/components/ui/skeleton';

export default function PermissionCard() {
    const [permissions, setPermissions] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [mode, setMode] = useState('create');
    const [selected, setSelected] = useState(null);
    const [loader, setloader] = useState(true);


    const fetchPermissions = async () => {
        const res = await permissionApi.getPermissionTypes();
        if (res.success) setPermissions(res.data);
        else console.error('Error fetching permissions:', res.error);
        setloader(false);
    };

    useEffect(() => { fetchPermissions(); }, []);

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
                        <CardTitle>Permission Types</CardTitle>
                        <CardDescription>Manage system permission types</CardDescription>
                    </div>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => { setMode('create'); setSelected(null); }}>
                                <PlusIcon className="mr-2 h-4 w-4" /> Add Permission
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{mode === 'create' ? 'Add New Permission' : 'Update Permission'}</DialogTitle>
                            </DialogHeader>
                            {mode === 'create'
                                ? <CreatePermission refresh={fetchPermissions} close={() => setOpenDialog(false)} />
                                : <UpdatePermission data={selected} refresh={fetchPermissions} close={() => setOpenDialog(false)} />}
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <PermissionTable
                        data={permissions}
                        onEdit={(row) => { setSelected(row); setMode('update'); setOpenDialog(true); }}
                        refresh={fetchPermissions}
                    />
                </CardContent>
            </Card>
    );
}
