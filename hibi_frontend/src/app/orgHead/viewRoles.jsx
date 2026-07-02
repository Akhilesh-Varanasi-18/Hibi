import React, { useState } from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import EditRoleDialog from './editRoles';
import DeleteRoleDialog from './deleterole';
import AddingRole from './AddingRole';
import roleApi from '@/Apis/role_Api';

const ViewRolesDialog = () => {
    const [currentRole, setCurrentRole] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [roles, setRoles] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    async function fetchRoles() {
        try {
            const response = await roleApi.GettingRoles();
            if(response.success) {
                setRoles(response.data);
            } else {
                console.error("Failed to fetch roles:", response.error);
            }   
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    }

    function onEdit(data) {
        fetchRoles();
        setEditOpen(false);
    }

    function onDelete(data) {
        fetchRoles();
        setDeleteOpen(false);
    }

    const handleDialogOpen = async (open) => {
        setDialogOpen(open);
        if (open) {
            await fetchRoles();
        }
    };

    return (
        <>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Roles
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <DialogTitle>System Roles</DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    Manage all system roles
                                </p>
                            </div>
                            <AddingRole onRoleAdded={fetchRoles} />
                        </div>
                    </DialogHeader>

                    <div className="rounded-md border bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Role Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <Badge variant="secondary">{role.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentRole(role);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentRole(role);
                                                    setDeleteOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter className="sm:justify-start">
                        <p className="text-sm text-muted-foreground">
                            {roles.length} roles in system
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {currentRole && (
                <>
                    <EditRoleDialog
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        role={currentRole}
                        onSave={onEdit}
                    />
                    <DeleteRoleDialog
                        open={deleteOpen}
                        onOpenChange={setDeleteOpen}
                        role={currentRole}
                        onDelete={onDelete}
                    />
                </>
            )}
        </>
    );
};

export default ViewRolesDialog;