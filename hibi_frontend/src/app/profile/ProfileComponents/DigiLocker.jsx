import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import digiloackerApi from '@/Apis/digiloacker'
import { useToast } from '@/hooks/use-toast'
import { RxCross2 } from 'react-icons/rx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Eye, X } from "lucide-react"
import { TiTick } from 'react-icons/ti'
import { Skeleton } from '@/components/ui/skeleton'

export const DigiLocker = () => {
    const { toast } = useToast();
    const [documents, setdocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [linkloader, setlinkLoader] = useState(false);
    const [dataloader, setDataloader] = useState(false);
    const [refetch, setRefetch] = useState(false);

    async function getLink() {
        setlinkLoader(true);
        const res = await digiloackerApi.getDigiLink();
        console.log("res", res);
        if (res.success) {
            if (res.data.authorizationUrl);
            window.open(res.data.authorizationUrl, '_blank');
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> <span>{res?.message}</span>
                </div>,
            })
        }
        else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>{res?.error}</span>
                </div>,
            })
        }
        setlinkLoader(false);
    }

    async function getdocuments() {
        setDataloader(true);
        const res = await digiloackerApi.getDocuments();
        if (res.success) {
            console.log(res?.data?.documents);
            setdocuments(res?.data?.documents);

        }
        else {
            console.log(res.error)
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>{res?.error}</span>
                </div>,
            })
        }
        setDataloader(false);
    }


    async function Refresh() {
        setRefetch(true);
        const res = await digiloackerApi.getRefreshDoc();
        if (res.success) {
            console.log(res?.data);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> <span>{res?.data?.message}</span>
                </div>,
            })
            getdocuments();
        }
        else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>{res?.error}</span>
                </div>,
            })
        }
        setRefetch(false);
    }

    useEffect(() => {
        getdocuments();
    }, []);

    const handleViewDocument = (document) => {
        setSelectedDocument(document);
        setIsDialogOpen(true);
    };

    const handleDownloadDocument = (documentUrl, documentName) => {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.click();
    };

    const formatDate = (dateString) => {
        const [day, month, year] = dateString.split('-');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderDocumentContent = (document) => {
        const { mime, documentUrl, name } = document;

        if (mime === 'application/pdf') {
            return (
                <div className="w-full h-full">
                    <iframe
                        src={documentUrl}
                        title={name}
                        className="w-full h-full min-h-[500px] border-0"
                        loading="lazy"
                    />
                </div>
            );
        }

        if (mime.startsWith('image/')) {
            return (
                <div className="flex justify-center">
                    <img
                        src={documentUrl}
                        alt={name}
                        className="max-w-full max-h-[600px] object-contain"
                    />
                </div>
            );
        }

        if (mime === 'text/plain' || mime === 'text/html') {
            return (
                <div className="w-full h-full">
                    <iframe
                        src={documentUrl}
                        title={name}
                        className="w-full h-full min-h-[500px] border-0"
                    />
                </div>
            );
        }

        // For unsupported MIME types, show download option
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Document Preview Not Available</h3>
                    <p className="text-muted-foreground mt-2">
                        This document type ({mime}) cannot be previewed directly.
                    </p>
                </div>
                <Button
                    onClick={() => handleDownloadDocument(documentUrl, name)}
                    className="flex items-center space-x-2"
                >
                    <Download className="h-4 w-4" />
                    <span>Download to View</span>
                </Button>
            </div>
        );
    };

    return (
        <div className='w-full p-6'>
            <div className='flex justify-between items-center mb-8 flex-wrap'>
                <h1 className='text-3xl font-bold'>DigiLocker Documents</h1>
                <div className='flex gap-2 flex-wrap mt-6 justify-end w-full'>
                    <Button onClick={() => { getLink() }} disabled={linkloader}>
                        {linkloader ? "Processing..." :
                            "Authorize Digi Locker"}</Button>
                    <Button onClick={() => { Refresh() }} >
                        {
                            refetch ? "Refetching..." : "Refetch"
                        } </Button>
                </div>
            </div>

            <div>
                <div className="space-y-6 h-screen overflow-scroll">
                    {
                        dataloader ? (
                            <div className='flex flex-col gap-2'>
                                <Skeleton className="w-full h-[200px]" />
                                <Skeleton className="w-full h-[200px]" />
                            </div>
                        )
                            :
                            (


                                < div className='"space-y-6'>
                                    {
                                        documents.length === 0 && (
                                            <div className="text-center py-12">
                                                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-muted-foreground">No documents found</h3>
                                                <p className="text-muted-foreground mt-2">Click "Upload Document" to add documents from DigiLocker</p>
                                            </div>
                                        )
                                    }
                                    {documents.map((doc) => (
                                        <Card key={doc._id} className="hover:shadow-lg transition-shadow duration-200 mt-5">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <FileText className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl text-foreground">
                                                                {doc.name}
                                                            </CardTitle>
                                                            <CardDescription className="text-sm mt-1">
                                                                {doc.description}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {doc.doctype}
                                                    </Badge>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="pt-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Issued by:</span>
                                                            <span className="text-foreground font-medium">{doc.issuer}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Issue Date:</span>
                                                            <span className="text-foreground font-medium">
                                                                {formatDate(doc.date)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Document ID:</span>
                                                            <span className="text-foreground font-mono text-xs">
                                                                {doc.uri}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">File Type:</span>
                                                            <span className="text-foreground font-medium">
                                                                {doc.mime.split('/')[1].toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Issuer ID:</span>
                                                            <span className="text-foreground font-medium">
                                                                {doc.issuerid}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Format:</span>
                                                            <Badge variant="outline" className="capitalize">
                                                                {doc.mime}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-3 mt-6 pt-4 border-t">
                                                    <Button
                                                        onClick={() => handleViewDocument(doc)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span>View Document</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleDownloadDocument(doc.documentUrl, doc.name)}
                                                        variant="default"
                                                        size="sm"
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span>Download</span>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                    )
                                    }
                                </div>)
                    }
                </div>

                {/* Document Viewer Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] w-full">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                <span>{selectedDocument?.name}</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-4 flex-1 overflow-auto">
                            {selectedDocument && renderDocumentContent(selectedDocument)}
                        </div>

                        {selectedDocument && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    <span>Issued by: {selectedDocument.issuer}</span>
                                    <span className="mx-2">•</span>
                                    <span>Date: {formatDate(selectedDocument.date)}</span>
                                </div>
                                <Button
                                    onClick={() => handleDownloadDocument(selectedDocument.documentUrl, selectedDocument.name)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center space-x-2"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Download</span>
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    )
}