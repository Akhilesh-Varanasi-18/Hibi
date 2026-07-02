'use client';
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import statusApi from "@/Apis/status_Api";
import StatusTypeTable from "./StatusTypeTable";
import CreateStatusType from "./CreateStatusType";
import UpdateStatusType from "./UpdateStatusType";
import { Skeleton } from '@/components/ui/skeleton';


export default function StatusTypeCard() {
  const [statusTypes, setStatusTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState("create");
    const [loader, setloader] = useState(true);

  const [selected, setSelected] = useState(null);

  const fetchStatusTypes = async () => {
    const res = await statusApi.getStatusTypes();
    if (res.success) {
      setStatusTypes(res.data);
    } else {
      console.error("Error fetching status types:", res.error);
      setStatusTypes([]);
    }
    setloader(false);
  };

  useEffect(() => { fetchStatusTypes(); }, []);

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
          <CardTitle>Status Types</CardTitle>
          <CardDescription>Manage workflow status types</CardDescription>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setMode("create"); setSelected(null); }}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Status Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Add New Status Type" : "Update Status Type"}</DialogTitle>
            </DialogHeader>
            {mode === "create"
              ? <CreateStatusType refresh={fetchStatusTypes} close={() => setOpenDialog(false)} />
              : <UpdateStatusType data={selected} refresh={fetchStatusTypes} close={() => setOpenDialog(false)} />}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <StatusTypeTable
          data={statusTypes}
          onEdit={(row) => { setSelected(row); setMode("update"); setOpenDialog(true); }}
          refresh={fetchStatusTypes}
        />
      </CardContent>
    </Card>
  );
}
