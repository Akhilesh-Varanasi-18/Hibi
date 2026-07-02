'use client'
import React, { useEffect, useState, useContext } from 'react'
import { Building2, CalendarDays, BadgeInfo, User, Mail, Phone, Edit } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import HireCEO from './HireCEO'
import OrganizationApi from '@/Apis/Organization_Management'
import { UsersContext } from '../context/UserContext'
import ProfileDropdown from '../components/ProfileDropdown'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import ProfileAPi from '@/Apis/Profile_Api'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import UnauthorizedPage from '../components/ReusableComponents/UnauthorizedPage'

// CEO data validation schema
const ceoSchema = z.object({
  CeoNameFirstName: z.string().min(1, "First name is required"),
  CeoNameLastName: z.string().min(1, "Last name is required"),
  ceoPersonalEmail: z.string().min(1, "Invalid email address"),
  // ceoId: z.string().min(1, "CEO ID is required")
});

function OrganizationSkeleton() {
  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-48 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-32 rounded" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <Separator className="bg-border" />

      {/* Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-8 w-32 rounded" />
                <Skeleton className="h-3 w-20 mt-1 rounded" />
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div>
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-20 mt-1 rounded" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32 rounded" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow hidden lg:block">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32 rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details Skeleton */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <Skeleton className="h-4 w-32 rounded" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrganizationDashboard() {
  const { role, previlege } = useContext(UsersContext);
  const [organizationData, setOrganizationData] = useState(null)
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgError, setOrgError] = useState(null)
  const { user } = useContext(UsersContext);
  const [editdialog, setEditdialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast();

  // React Hook Form setup
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(ceoSchema),
    defaultValues: {
      CeoNameFirstName: "",
      CeoNameLastName: "",
      ceoPersonalEmail: "",
      ceoId: ""
    }
  });

  // Load organization data
  const fetchOrgData = async () => {
    setOrgLoading(true)
    try {
      const res = await OrganizationApi.getOrganizationData();
      console.log(res)
      if (res.success) {
        // Handle both array and object response
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setOrganizationData(data)
      } else {
        setOrgError('Failed to load organization data')
      }
    } catch (error) {
      setOrgError('An error occurred while fetching organization data')
      console.error(error)
    } finally {
      setOrgLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgData();
  }, [])

  const refreshOrganizationData = () => {
    fetchOrgData();
  }

  const HandledialgoeOpen = () => {
    if (organizationData) {
      setValue("CeoNameFirstName", organizationData.CeoNameFirstName || "")
      setValue("CeoNameLastName", organizationData.CeoNameLastName || "")
      setValue("ceoPersonalEmail", organizationData.ceoPersonalEmail || "")
      setValue("ceoId", organizationData.ceoId || "")
    }
    setEditdialog(true);
  }

  const HandleCloseDialog = () => {
    reset()
    setEditdialog(false)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    console.log(data)
    try {
      const formData = new FormData();
      formData.append("employeeId", data.ceoId);
      formData.append("firstName", data.CeoNameFirstName)
      formData.append("lastName", data.CeoNameLastName)
      formData.append("personalEmail", data.ceoPersonalEmail)

      const response = await ProfileAPi.updateEmployeeData(formData);
      if (response.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>{" "}
              <span>{response?.data}</span>
            </div>
          ),
        });
        setEditdialog(false);
        refreshOrganizationData();
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>{" "}
              <span>{response?.error || "Failed to update CEO details"}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>{" "}
            <span>An error occurred while updating CEO details</span>
          </div>
        ),
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!previlege || previlege !== "ULTIMATEADMIN") {
    return (
      <UnauthorizedPage />
    );
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen w-full bg-background p-4 md:p-8 flex items-start justify-center">
        <OrganizationSkeleton />
      </div>
    )
  }

  if (orgError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <span className="text-destructive text-lg">{orgError}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      {!organizationData ? (
        <h1 className='text-2xl md:text-3xl font-bold tracking-tight text-foreground'>
          No data to show, haven't received any data from server
        </h1>
      ) : (
        <div className="w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {organizationData?.name || 'Organization'}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">
                  {organizationData?.address ? organizationData.address : 'No address provided'}
                </span>
                <span>•</span>
                <Badge variant={organizationData?.status === 'Active' ? 'default' : 'secondary'}>
                  {organizationData?.status}
                </Badge>
              </div>
            </div>
            <div className='flex gap-4 items-center'>
              {!organizationData?.CeoNameFirstName && <HireCEO refresh={refreshOrganizationData} />}
              <ProfileDropdown user={user} />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Main Content */}
          {organizationData && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* GST Card with Registration Date */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BadgeInfo className="h-4 w-4 text-primary" />
                        GST Information
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Tax ID
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-mono font-bold tracking-tight">
                          {organizationData.gstNumber ? organizationData.gstNumber : <span className="text-muted-foreground">Not Provided</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">GST Number</p>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {organizationData.regDate ? organizationData.regDate : <span className="text-muted-foreground">Not Provided</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">Registration Date</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Head Card */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Organization Head
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={organizationData?.headProfileImage}
                        />
                        <AvatarFallback>
                          {organizationData.HeadName && organizationData.HeadName[0] ? organizationData.HeadName[0] : 'N/A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-medium text-lg">
                          {organizationData.HeadName || 'N/A'} (You)
                        </p>
                        <p className="text-sm text-muted-foreground">Head of Organization</p>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <Mail className="h-3 w-3" />
                          <span>{organizationData.headpersonalEmail || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{organizationData.headphone || 'N/A'}</span>
                        </div>
                        <div className="mt-2 flex gap-2 items-center">
                          <p className="text-sm text-muted-foreground">Head Employee Code : </p>
                          <span>{organizationData.headEmployeeCode}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CEO Card */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 justify-between">
                      <div>
                        <User className="h-4 w-4 text-primary" />
                        CEO
                      </div>
                      <div>
                        {organizationData.CeoNameFirstName ? (
                          <Button
                            variant="outline"
                            onClick={HandledialgoeOpen}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Ceo Details
                          </Button>
                        ) : null}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {organizationData.CeoNameFirstName ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={organizationData?.ceoProfileImage}
                          />
                          <AvatarFallback>
                            {organizationData.CeoNameFirstName && organizationData.CeoNameFirstName[0]
                              ? organizationData.CeoNameFirstName[0]
                              : 'N/A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium text-lg">
                            {organizationData.CeoNameFirstName} {organizationData.CeoNameLastName}
                          </p>
                          <p className="text-sm text-muted-foreground">Chief Executive Officer</p>
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <Mail className="h-3 w-3" />
                            <span>{organizationData.ceoPersonalEmail || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{organizationData.ceoPhone || 'N/A'}</span>
                          </div>
                          <div className="mt-2 flex gap-2 items-center">
                            <p className="text-sm text-muted-foreground">CEO Employee Code : </p>
                            <span>{organizationData.ceoEmployeeCode}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Avatar className="h-12 w-12 mb-2">
                          <AvatarFallback>N/A</AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-muted-foreground mb-1">
                          No CEO Assigned
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          You have not assigned a CEO to your organization yet.
                        </p>
                        {/* Optionally, you could add a button to hire/assign CEO here */}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information Section */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{organizationData.address || 'N/A'}</p>
                  </div>
                  {/* You can add more org details here if needed */}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <Dialog open={editdialog} onOpenChange={setEditdialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editing CEO Details</DialogTitle>
            <DialogDescription>
              You can only edit CEO email, first name and last name
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <input type="hidden" {...register("ceoId")} />
              <Label htmlFor="CeoNameFirstName">First Name *</Label>
              <Input
                id="CeoNameFirstName"
                {...register("CeoNameFirstName")}
                placeholder="First Name"
              />
              {errors.CeoNameFirstName && (
                <p className="text-sm text-destructive">{errors.CeoNameFirstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="CeoNameLastName">Last Name *</Label>
              <Input
                id="CeoNameLastName"
                {...register("CeoNameLastName")}
                placeholder="Last Name"
              />
              {errors.CeoNameLastName && (
                <p className="text-sm text-destructive">{errors.CeoNameLastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceoPersonalEmail">Email *</Label>
              <Input
                id="ceoPersonalEmail"
                type="email"
                {...register("ceoPersonalEmail")}
                placeholder="Personal Email"
                required
              />
              {errors.ceoPersonalEmail && (
                <p className="text-sm text-destructive">{errors.ceoPersonalEmail.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={HandleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Updating...
                  </>
                ) : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}