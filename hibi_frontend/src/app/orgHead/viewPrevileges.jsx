import React, { useState } from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import EditPrivilegeDialog from './EditPrevilege';
import DeletePrivilegeDialog from './deletePrevilege';
import privilegeApi from '@/Apis/previlege_Api';
import AddingPrevilege from './AddingPrevilege';

const ViewPrivilegesDialog = () => {
    const [currentPrivilege, setCurrentPrivilege] = useState(null);
    const [privileges, setPrivileges] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleEditClick = (privilege) => {
        setCurrentPrivilege(privilege);
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (privilege) => {
        setCurrentPrivilege(privilege);
        setDeleteDialogOpen(true);
    };

    const onEdit = (updatedPrivilege) => {
        fetchPrivileges();
        setEditDialogOpen(false);
    };

    const onDelete = (privilegeId) => {
        fetchPrivileges();
        setDeleteDialogOpen(false);
    };

    async function fetchPrivileges() {
        try {
            const response = await privilegeApi.getPrivileges();
            if (response.success) {
                setPrivileges(response.data);
            } else {
                console.error("Failed to fetch privileges:", response.error);
            }
        } catch (error) {
            console.error("Error fetching privileges:", error);
        }
    }

    const handleDialogOpen = async (open) => {
        setDialogOpen(open);
        if (open) {
            await fetchPrivileges();
        }
    };

    return (
        <>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View All Privileges
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <DialogHeader>
                        <DialogTitle>System Privileges</DialogTitle>
                        <DialogDescription>
                            Complete list of all available privileges in the system
                        </DialogDescription>
                        <div className="flex justify-end mb-4">
                            <div>
                                <AddingPrevilege onPrivilegeAdded={fetchPrivileges} />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Privilege Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {privileges.map((privilege) => (
                                    <TableRow key={privilege.id}>
                                        <TableCell className="font-medium">
                                            <Badge variant="secondary" className="font-mono">
                                                {privilege.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{privilege.description}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(privilege)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteClick(privilege)}
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

                    <div className="text-sm text-muted-foreground mt-2">
                        Showing {privileges.length} privileges in the system
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            {currentPrivilege && (
                <EditPrivilegeDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    privilege={currentPrivilege}
                    onSave={onEdit}
                />
            )}

            {/* Delete Dialog */}
            {currentPrivilege && (
                <DeletePrivilegeDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    privilege={currentPrivilege}
                    onDelete={onDelete}
                />
            )}
        </>
    );
};

export default ViewPrivilegesDialog;