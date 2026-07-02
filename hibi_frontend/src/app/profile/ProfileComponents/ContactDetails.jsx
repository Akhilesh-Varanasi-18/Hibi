"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Contact, Plus, Edit } from 'lucide-react';
import ProfileAPi from '@/Apis/Profile_Api';
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import { ContactDialog } from './Dialogues/contactsDialog';
export function Contacts() {
    const [data, setEmergencyContact] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loader, setLoader] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        GetContact();
    }, [])

    const handleSaveContact = async (formData) => {
        setLoader(true);

        if (data && Object.keys(data).length === 0) {
            await saveEmergencyContact(formData);
        } else {
            await UpdateEmergencyContact(formData);
        }
    };

    async function saveEmergencyContact(formData) {
        setLoader(true);
        const response = await ProfileAPi.AddEmergencyContacts(formData);
        if (response.success) {
            setIsEditing(false);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{response?.data}</span>
                </div>,
            });
            GetContact();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{response?.error}</span>
                </div>,
            });
        }
        setLoader(false);
    }

    async function UpdateEmergencyContact(formData) {
        setLoader(true);
        const value = { ...formData };
        value.relationShip = formData.relationship;
        value.phone = formData.contactNumber;
        value.contactId = formData._id;
        const response = await ProfileAPi.UpdateContacts(value);
        if (response.success) {
            setIsEditing(false);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{response?.data}</span>
                </div>,
            });
            GetContact();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{response?.error}</span>
                </div>,
            });
        }
        setLoader(false);
    }

    async function GetContact() {
        const response = await ProfileAPi.GetContacts();
        if (response.success) {
            if(response?.data?.phone)
            response.data.contactNumber=response.data?.phone || "";
            if(response.data?.relationShip)
            response.data.relationship=response.data?.relationShip || "";
            setEmergencyContact(response.data || {});
        } else {
            setEmergencyContact({});
        }
    }

    const handleOpenChange = (open) => {
        setIsEditing(open);
    };

    const hasContactData = data && Object.keys(data).length !== 0;

    return (
        <Card className="bg-neutral-50 dark:bg-neutral-950">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-red-100/50 dark:bg-red-900/20">
                        <Contact className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Contacts</CardTitle>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                >
                    {hasContactData ? (
                        <>
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Contact</span>
                        </>
                    )}
                </Button>
            </CardHeader>

            {/* Dialog Component */}
            <ContactDialog
                open={isEditing}
                onOpenChange={handleOpenChange}
                data={data}
                onSave={handleSaveContact}
                isLoading={loader}
            />

            {/* Contact Display */}
            {hasContactData ? (
                <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6">
                    <div className='flex justify-start flex-wrap'>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                            <div className="p-3 rounded-lg bg-red-100/50 dark:bg-red-900/20">
                                <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                                <p className="font-medium">{data.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                    {data.relationShip}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                            <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                                <p className="font-medium">{data.phone}</p>
                                {data.email && <p className="text-sm text-muted-foreground">{data.email}</p>}
                            </div>
                        </div>

                        {(data.address || data.city || data.state || data.postalCode || data.country) && (
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                                <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
                                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                                    {data.address && <p className="font-medium">{data.address}</p>}
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        {data.city && <span>{data.city}</span>}
                                        {data.state && <span>{data.city && data.state ? ', ' : ''}{data.state}</span>}
                                        {data.postalCode && <span>{data.city || data.state ? ', ' : ''}{data.postalCode}</span>}
                                        {data.country && <span>{data.city || data.state || data.postalCode ? ', ' : ''}{data.country}</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            ) : (
                <CardContent className="text-center p-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-muted/30">
                            <Contact className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No contact added yet</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}