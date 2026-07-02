'use client';
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import RoleTable from "./RoleTable";
import CreateRole from "./CreateRole";
import UpdateRole from "./UpdateRole";
import roleApi from "@/Apis/role_Api";
import { Skeleton } from '@/components/ui/skeleton';


export default function RoleCard() {
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [loader, setloader] = useState(true);


  const fetchRoles = async () => {
    const res = await roleApi.GettingRoles();
    if (res.success) {
      setRoles(res.data);
    } else {
      console.error("Error fetching roles:", res.error);
      setRoles([]);
    }
    setloader(false);
  };

  useEffect(() => { fetchRoles(); }, []);

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
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage user roles</CardDescription>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setMode("create"); setSelected(null); }}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Add New Role" : "Update Role"}</DialogTitle>
            </DialogHeader>
            {mode === "create"
              ? <CreateRole refresh={fetchRoles} close={() => setOpenDialog(false)} />
              : <UpdateRole data={selected} refresh={fetchRoles} close={() => setOpenDialog(false)} />}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <RoleTable
          data={roles}
          onEdit={(row) => { setSelected(row); setMode("update"); setOpenDialog(true); }}
          refresh={fetchRoles}
        />
      </CardContent>
    </Card>
  );
}
