import digiloackerApi from '@/Apis/digiloacker';
import LoginApi from '@/Apis/LoginApi';
import ProfileAPi from '@/Apis/Profile_Api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle ,DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, Eye, Mail, Phone, Calendar, Building, CreditCard, User, Shield, Droplet, Heart, MapPin, Globe, Home, Map, LinkedinIcon } from 'lucide-react';
import { RxCross2 } from 'react-icons/rx';
import { TiTick } from 'react-icons/ti';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react';
// import {  } from '@radix-ui/react-dialog';
import { FaLinkedinIn } from 'react-icons/fa';
const EmployeeProfileDataDialog = ({ id, open, setopen }) => {
    const { toast } = useToast();
    const [personal, setPersonal] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [contact, setContacts] = useState(null);
    const [bank, setBank] = useState(null);
    const [dgLocker, setDgLocker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    async function getEmployeeDetails() {
        try {
            setLoading(true);
            const [personalres, employeeres, contactsres, bankres, digidocres] = await Promise.all([
                ProfileAPi.GetPersonalDetails(id),
                ProfileAPi.GettingEmployeeData(id),
                ProfileAPi.GetContacts(id),
                ProfileAPi.getbankDetails(id),
                digiloackerApi.getDocuments(id)
            ]);

            if (personalres.success) { setPersonal(personalres.data); console.log(personalres.data) };
            if (employeeres.success) { setEmployee(employeeres.data); console.log(employeeres.data) };
            if (contactsres.success) setContacts(contactsres.data);
            if (bankres.success) setBank(bankres.data.bankDetails);
            if (digidocres) setDgLocker(digidocres?.data?.documents);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>Failed to load employee data</span>
                </div>,
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getEmployeeDetails();
    }, [id]);

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

    const formatDocumentDate = (dateString) => {
        const [day, month, year] = dateString.split('-');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatProfileDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
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
                    onClick={() => { handleDownloadDocument(documentUrl, name) }}
                    className="flex items-center space-x-2"
                >
                    <Download className="h-4 w-4" />
                    <span>Download to View</span>
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setopen}>
            <DialogContent className="h-[90%] overflow-scroll">
                {loading ? <ProfileSkeleton /> : <div className="grid lg:columns-2 p-2 space-y-6 ">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <Avatar className="h-16 w-16 border-2 border-border">
                                    <AvatarImage src={employee?.profileImage} />
                                    <AvatarFallback className="bg-muted text-foreground">
                                        {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {employee?.firstName} {employee?.lastName}
                                    </h1>
                                    <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1 mt-1">
                                        <Mail className="h-3 w-3" />
                                        {employee?.officeMail}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                                        <Badge variant="secondary" className="text-xs">
                                            {employee?.employeeCode}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {employee?.status?.statusType}
                                        </Badge>
                                        {employee?.linkedInProfile && (<a href={employee?.linkedInProfile} target='_blank'>
                                            <FaLinkedinIn />
                                        </a>)}
                                    </div>

                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                                <InfoField label="Personal Email" value={employee?.personalEmail} icon={<Mail className="h-3 w-3" />} />
                                <InfoField label="Phone" value={employee?.phone} icon={<Phone className="h-3 w-3" />} />
                                <InfoField label="Date of Birth" value={formatProfileDate(employee?.dateOfBirth)} icon={<Calendar className="h-3 w-3" />} />
                                <InfoField label="Gender" value={employee?.gender} />

                            </div>
                            {personal &&
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-9'>
                                    <InfoField
                                        label="Blood Group"
                                        value={personal?.bloodGroup}
                                        icon={<Droplet className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="Marital Status"
                                        value={personal?.maritalStatus}
                                        icon={<Heart className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="Secondary Phone"
                                        value={personal?.secondaryPhone}
                                        icon={<Phone className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="City"
                                        value={personal?.city}
                                        icon={<MapPin className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="State"
                                        value={personal?.state}
                                    />
                                    <InfoField
                                        label="Postal Code"
                                        value={personal?.postalCode}
                                        icon={<Mail className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="Country"
                                        value={personal?.country}
                                        icon={<Globe className="h-3 w-3" />}
                                    />
                                    <InfoField
                                        label="Address"
                                        value={personal?.address}
                                        className="md:col-span-2"
                                        icon={<Home className="h-3 w-3" />}
                                    />
                                </div>}
                        </CardContent>
                    </Card>



                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Employment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Organization" value={employee?.orgId?.name} />
                                <InfoField label="Date of Joining" value={formatProfileDate(employee?.dateOfJoining)} icon={<Calendar className="h-3 w-3" />} />
                                <InfoField label="Shift" value={`${employee?.shiftId?.name} (${employee?.shiftId?.startTime} - ${employee?.shiftId?.endTime})`} />
                                <InfoField label="Salary" value={`₹${employee?.salaryPerMonth?.toLocaleString()}/month`} />
                                <InfoField label="Role" value={employee?.roleId?.name} className="md:col-span-2" />
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Emergency Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contact ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="Name" value={contact.name} />
                                    <InfoField label="Relationship" value={contact.relationShip} />
                                    <InfoField label="Phone" value={contact.phone} icon={<Phone className="h-3 w-3" />} />
                                    <InfoField label="Email" value={contact.email} icon={<Mail className="h-3 w-3" />} />
                                    <InfoField label="Address" value={contact.address} className="md:col-span-2" />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-6">No emergency contact information available</p>
                            )}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Bank Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {bank ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="Bank Name" value={bank.bankName} />
                                    <InfoField label="Account Holder" value={bank.accountHolderName} />
                                    <InfoField label="Account Number" value={bank.accountNumber} />
                                    <InfoField label="IFSC Code" value={bank.ifscCode} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-6">No bank details available</p>
                            )}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Documents
                            </CardTitle>
                            <CardDescription>
                                {dgLocker?.length || 0} documents available
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dgLocker && dgLocker.length > 0 ? (
                                <div className="space-y-3">
                                    {dgLocker.map((doc) => (
                                        <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="p-2 bg-muted rounded">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate text-foreground">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{doc.issuer}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    onClick={() => handleViewDocument(doc)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDownloadDocument(doc.documentUrl, doc.name)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground text-sm">No documents available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-4xl max-h-[90vh] w-full">
                            <DialogHeader>
                                <DialogTitle className="text-base">{selectedDocument?.name}</DialogTitle>
                            </DialogHeader>

                            <div className="mt-4 flex-1 overflow-auto">
                                {selectedDocument && renderDocumentContent(selectedDocument)}
                            </div>

                            {selectedDocument && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        <span>Issued by: {selectedDocument.issuer}</span>
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
                </div>}

            </DialogContent>
        </Dialog>
    );
};

// Reusable Info Field Component
const InfoField = ({ label, value, icon, className = '' }) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            {icon}
            {label}
        </label>
        <p className="text-sm text-foreground font-normal">{value || 'N/A'}</p>
    </div>
);

// Skeleton Loading Component
const ProfileSkeleton = () => (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                        <Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
                        <div className="flex gap-2 justify-center sm:justify-start">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />

            {/* Content Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

export default EmployeeProfileDataDialog;