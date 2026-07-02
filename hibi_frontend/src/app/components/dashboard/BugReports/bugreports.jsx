"use client";
import bugReportApi from '@/Apis/bugReportApi';
import React, { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Image, File, Download, User, Calendar, AlertCircle, X, Mail, Hash, Video } from 'lucide-react';
import { TiTick } from 'react-icons/ti';
import { useToast } from '@/hooks/use-toast';
import { RxCross2 } from 'react-icons/rx';
import { UsersContext } from '@/app/context/UserContext';
import Comparing from '@/utils/CommonFunctionality';
import { Skeleton } from '@/components/ui/skeleton';

const Bugreports = () => {
    const [bugReports, setBugReports] = useState([]);
    const { role,previlege } = useContext(UsersContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [remark, setRemark] = useState('');
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        GetData();
    }, []);

    async function GetData() {
        try {
            setLoading(true);
            const res = await bugReportApi.getBugs();
            if (res.success) {
                setBugReports(res.data.bugReports);
                console.log(res.data.bugReports);
                setError(null);
            } else {
                setError(res.error);
                console.log(res.error);
            }
        } catch (err) {
            setError('Failed to fetch bug reports');
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const timePart = dateString.split("T")[1]?.replace("Z", "");
        let [hour, minute] = timePart.split(":");

        hour = parseInt(hour, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        return `${hour}:${minute} ${ampm}`;
    }

    const getFileType = (url) => {
        const extension = url.split('.').pop().toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
        const textTypes = ['txt', 'log', 'csv'];
        const pdfTypes = ['pdf'];
        const docTypes = ['doc', 'docx'];
        const excelTypes = ['xls', 'xlsx'];

        if (imageTypes.includes(extension)) return 'image';
        if (videoTypes.includes(extension)) return 'video';
        if (textTypes.includes(extension)) return 'text';
        if (pdfTypes.includes(extension)) return 'pdf';
        if (docTypes.includes(extension)) return 'document';
        if (excelTypes.includes(extension)) return 'excel';
        return 'other';
    };

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image':
                return <Image className="h-3 w-3 text-blue-400" />;
            case 'video':
                return <Video className="h-3 w-3 text-purple-400" />;
            case 'text':
                return <FileText className="h-3 w-3 text-gray-400" />;
            case 'pdf':
                return <FileText className="h-3 w-3 text-red-400" />;
            case 'document':
                return <FileText className="h-3 w-3 text-blue-400" />;
            case 'excel':
                return <FileText className="h-3 w-3 text-green-400" />;
            default:
                return <File className="h-3 w-3 text-gray-400" />;
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'PENDING':
                return 'destructive';
            case 'COMPLETED':
                return 'default';
            case 'IN_PROCESS':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const renderAttachmentPreview = (url) => {
        const fileType = getFileType(url);

        switch (fileType) {
            case 'image':
                return (
                    <div className="w-full h-48 flex items-center justify-center">
                        <img
                            src={url}
                            alt="Attachment"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="w-full max-h-96 flex items-center justify-center">
                        <video
                            controls
                            className="max-w-full max-h-full rounded-lg"
                        >
                            <source src={url} type={`video/${url.split('.').pop()}`} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            case 'text':
            case 'pdf':
            case 'document':
                return (
                    <iframe
                        src={url}
                        className="w-full h-80 border-0 rounded-lg dark:bg-black"
                        title="Document Preview"
                    />
                );

            case 'excel':
                return (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg dark:bg-black">
                        <div className="text-center">
                            <FileText className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Download to view Excel file</p>
                            <Button
                                onClick={() => window.open(url, '_blank')}
                                className="mt-2 h-8 text-xs"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg dark:bg-black">
                        <div className="text-center">
                            <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Preview not available</p>
                            <Button
                                onClick={() => window.open(url, '_blank')}
                                className="mt-2 h-8 text-xs"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    const handleAttachmentClick = (url) => {
        setSelectedAttachment(url);
        setIsDialogOpen(true);
    };

    const handleUpdateClick = (bug, status) => {
        setSelectedBug(bug);
        setUpdateStatus(status);
        setRemark('');
        setIsUpdateDialogOpen(true);
    };

    const handleUpdateClose = () => {
        setIsUpdateDialogOpen(false);
        setSelectedBug(null);
        setUpdateStatus('');
        setRemark('');
    };

    const HandleUpdate = async () => {
        if (!selectedBug) return;

        try {
            setUpdating(true);
            console.log(remark);
            const res = await bugReportApi.updateBugs({
                bugReportId: selectedBug._id,
                status: updateStatus,
                remarks: remark || undefined
            });

            if (res.success) {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg">
                                <TiTick />
                            </div>
                            <span>{res.message || 'Status updated successfully'}</span>
                        </div>
                    ),
                });

                GetData();

                handleUpdateClose();
            } else {
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{res.error || 'Failed to update status'}</span>
                        </div>
                    ),
                });
            }
        } catch (err) {
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-red-500 rounded-full text-lg">
                            <RxCross2 />
                        </div>
                        <span>An error occurred while updating</span>
                    </div>
                ),
            });
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const canUpdateBug = (bug) => {
        return (Comparing.compareStrings("superadmin", previlege)) &&
            (Comparing.compareStrings("pending", bug.status) || Comparing.compareStrings("in_process", bug.status));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center w-full flex-col gap-3 mt-2 px-10">
                <Skeleton className="w-full h-[150px]" />
                <Skeleton className="w-full h-[150px]" />
                <Skeleton className="w-full h-[150px]" />
                <Skeleton className="w-full h-[150px]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-48">
                <div className="text-red-500 text-sm">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen overflow-y-scroll mx-auto py-4 space-y-4">
            {/* <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Bug Reports</h1>
                <Badge variant="outline" className="text-xs">
                    {bugReports.length} total
                </Badge>
            </div> */}

            {bugReports.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">No reports found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {bugReports.map((bug) => (
                        <Card key={bug._id} className="">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-base font-medium">
                                                {bug.title}
                                            </CardTitle>
                                            <Badge variant={getStatusVariant(bug.status)} className="text-xs">
                                                {bug.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs line-clamp-2">
                                            {bug.description}
                                        </CardDescription>
                                    </div>
                                    <Avatar className="h-8 w-8 text-xs">
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {bug.employeeId?.firstName?.[0]}{bug.employeeId?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0 space-y-3">
                                {/* Employee Info */}
                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-white">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{bug.employeeId?.firstName} {bug.employeeId?.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        <span>{bug.employeeId?.employeeCode}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate max-w-[120px]">{bug.employeeId?.officeMail}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(bug.createdAt)} , {formatTime(bug.createdAt)}</span>
                                    </div>
                                </div>



                                {/* Attachments */}
                                {bug.attachments && bug.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-white">
                                            <FileText className="h-3 w-3" />
                                            Attachments ({bug.attachments.length})
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {bug.attachments.map((url, index) => {
                                                const fileType = getFileType(url);
                                                const fileName = url.split('/').pop();

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border text-xs cursor-pointer hover:bg-gray-100 transition-colors dark:bg-zinc-900"
                                                        onClick={() => handleAttachmentClick(url)}
                                                    >
                                                        {getFileIcon(fileType)}
                                                        <span className="max-w-[80px] truncate text-gray-600">
                                                            {fileName}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(url, '_blank');
                                                            }}
                                                        >
                                                            <Download className="h-2.5 w-2.5" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {bug.remarks && (
                                    <div className="mt-3 border-l-4 border-l-gray-300 pl-3 py-1">
                                        <p className="text-xs text-gray-500 italic">"{bug.remarks}"</p>
                                    </div>
                                )}
                            </CardContent>

                            {canUpdateBug(bug) && (
                                <CardFooter>
                                    <div className='w-full flex justify-end gap-2'>
                                        {!Comparing.compareStrings("in_process", bug.status) && (
                                            <Button
                                                onClick={() => handleUpdateClick(bug, "IN PROCESS")}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Mark as In Progress
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleUpdateClick(bug, "RESOLVED")}
                                            size="sm"
                                        >
                                            Mark as Resolved
                                        </Button>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Update Status Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Bug Report Status</DialogTitle>
                        <DialogDescription>
                            Update the status for: <strong>{selectedBug?.title}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">New Status</Label>
                            <Input
                                id="status"
                                value={updateStatus === "IN PROCESS" ? "In Progress" : "Resolved"}
                                disabled
                                className="font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remark">Remark (Optional)</Label>
                            <Textarea
                                id="remark"
                                placeholder="Add any remarks or notes about this update..."
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                Optional: Add any additional context or notes about this status change.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleUpdateClose}
                            disabled={updating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={HandleUpdate}
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Update Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Attachment Preview Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] p-0">
                    <DialogHeader className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-sm font-medium">Preview</DialogTitle>
                                <DialogDescription className="text-xs">
                                    {selectedAttachment && selectedAttachment.split('/').pop()}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 overflow-auto">
                        {selectedAttachment && renderAttachmentPreview(selectedAttachment)}
                    </div>

                    <div className="flex justify-end gap-2 p-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDialogOpen(false)}
                            className="h-8 text-xs"
                        >
                            Close
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => window.open(selectedAttachment, '_blank')}
                            className="h-8 text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Bugreports;