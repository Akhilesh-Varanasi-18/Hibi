"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Home, Edit, Plus, Phone } from 'lucide-react';
import ProfileAPi from '@/Apis/Profile_Api';
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import { PersonalDetailsDialog } from './Dialogues/personalDetailsDialog';

export default function PersonalDetails() {
    const [data, setPersonalDetails] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loader, setLoader] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        GetProfile()
    }, [])

    const handleSavePersonalDetails = async (formData) => {
        setLoader(true);

        if (Object.keys(data).length === 0) {
            await AddingProfileDetails(formData);
        } else {
            await UpdatingpersonalDatails(formData);
        }
    };

    async function AddingProfileDetails(formData) {
        const response = await ProfileAPi.AddPersonalDetails(formData);
        if (response.success) {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
                    <span>{response?.data}</span>
                </div>,
            })
            setIsEditing(false);
            GetProfile();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                    <span>{response?.error}</span>
                </div>,
            })
        }
        setLoader(false);
    }

    async function UpdatingpersonalDatails(formData) {
        const response = await ProfileAPi.UpdatePersonalDetails(formData);
        if (response.success) {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
                    <span>{response?.data}</span>
                </div>,
            })
            setIsEditing(false);
            GetProfile();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
                    <span>{response?.error}</span>
                </div>,
            })
        }
        setLoader(false);
    }

    async function GetProfile() {
        const response = await ProfileAPi.GetPersonalDetails()
        if (response.success) {
            setPersonalDetails(response.data || {});
        } else {
            setPersonalDetails({});
        }
    }

    const handleOpenChange = (open) => {
        setIsEditing(open);
    };

    const hasPersonalData = data && Object.keys(data).length !== 0;

    return (
        <Card className="bg-neutral-50 dark:bg-neutral-950">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Personal Details</CardTitle>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                >
                    {hasPersonalData ? (
                        <>
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Details</span>
                        </>
                    )}
                </Button>
            </CardHeader>

            {/* Dialog Component */}
            <PersonalDetailsDialog
                open={isEditing}
                onOpenChange={handleOpenChange}
                data={data}
                onSave={handleSavePersonalDetails}
                isLoading={loader}
            />

            {/* Personal Details Display */}
            {hasPersonalData ? (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20">
                            <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                            <p className="font-medium">{data.address}</p>
                            <p className="text-sm text-muted-foreground">
                                {data.city}, {data.state} {data.postalCode}
                            </p>
                            <p className="text-sm text-muted-foreground">{data.country}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="p-3 rounded-lg bg-orange-100/50 dark:bg-orange-900/20">
                            <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-muted-foreground">Personal</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">Blood:</span>
                                        <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                            {data.bloodGroup}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">Status:</span>
                                        <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                            {data.maritalStatus}
                                        </Badge>
                                    </div>
                                </div>
                                {data.secondaryPhone && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            Secondary: {data.secondaryPhone}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="text-center p-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-muted/30">
                            <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No personal details added yet</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}