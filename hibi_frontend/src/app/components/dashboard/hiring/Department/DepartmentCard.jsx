'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import DepartmentTable from './DepartmentTable';
import CreateDepartment from './CreateDepartment';
import UpdateDepartment from './UpdateDepartment';
import departmentApi from '@/Apis/department_Api';
import { Skeleton } from '@/components/ui/skeleton';

export default function DepartmentCard() {
    const [departments, setDepartments] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [mode, setMode] = useState('create');
    const [selected, setSelected] = useState(null);
    const [loader, setloader] = useState(true);

    const fetchDepartments = async () => {
        const res = await departmentApi.getDepartments();
        console.log(res)
        if (res.success) {
            setDepartments(res.data);
        } else {
            console.error('Error fetching departments:', res.error);
            
        }
        setloader(false);
    };

    useEffect(() => { fetchDepartments(); }, []);

    return (
        loader ?
            (
                <Card className="w-full">
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
                </Card>
            ) :
            (<Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Departments</CardTitle >
                        <CardDescription>Manage company departments</CardDescription>
                    </div >
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => { setMode('create'); setSelected(null); }}>
                                <PlusIcon className="mr-2 h-4 w-4" /> Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{mode === 'create' ? 'Add New Department' : 'Update Department'}</DialogTitle>
                            </DialogHeader>
                            {mode === 'create'
                                ? <CreateDepartment refresh={fetchDepartments} close={() => setOpenDialog(false)} />
                                : <UpdateDepartment data={selected} refresh={fetchDepartments} close={() => setOpenDialog(false)} />}
                        </DialogContent>
                    </Dialog>
                </CardHeader >
                <CardContent>
                    <DepartmentTable
                        data={departments}
                        onEdit={(row) => { setSelected(row); setMode('update'); setOpenDialog(true); }}
                        refresh={fetchDepartments}
                    />
                </CardContent>
            </Card >)
    );
}
