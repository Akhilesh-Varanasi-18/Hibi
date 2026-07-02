"use client"
import ProfileAPi from '@/Apis/Profile_Api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, Building, User, Droplet, Heart, MapPin, Globe, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react';

const UserProfile = ({ id }) => {
    const { toast } = useToast();
    const [personal, setPersonal] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [contact, setContacts] = useState(null);
    const [loading, setLoading] = useState(true);

    async function getEmployeeDetails() {
        try {
            setLoading(true);
            const [personalres, employeeres, contactsres] = await Promise.all([
                ProfileAPi.GetPersonalDetails(id),
                ProfileAPi.GettingEmployeeData(id),
                ProfileAPi.GetContacts(id)
            ]);

            if (personalres.success) { setPersonal(personalres.data); }
            if (employeeres.success) setEmployee(employeeres.data);
            if (contactsres.success) setContacts(contactsres.data);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'>!</div>
                    <span>Failed to load employee data</span>
                </div>,
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getEmployeeDetails();
        // eslint-disable-next-line
    }, [id]);

    const formatProfileDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
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
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
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

    return (
        <div className="container mx-auto p-6 space-y-6">
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
                            <InfoField label="Role" value={employee?.roleId?.name} className="" />
                            {/* <InfoField label="Salary" value={`₹${employee?.salaryPerMonth?.toLocaleString()}/month`} /> */}
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
            </div>}
        </div>
    );
};

export default UserProfile;