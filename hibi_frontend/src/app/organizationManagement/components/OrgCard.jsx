"use client";
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { FileText, Mail, MoreVertical, Phone, Trash2, Users } from 'lucide-react';
import EditOrganizationDialog from './EditOrganizationDialog';
import DeleteOrganizationDialog from './DeleteOrganizationDialog';
import CreateOrganizationEmployee from './CreateOrganizationEmployee';
import UpdateOrganizationHeadDialog from './UpdateOrganizationHeadDialog';
import { Badge } from '@/components/ui/badge';


const OrgCard = ({
  refresh,
  org,
  getInitials,
  handleOrganizationUpdated,
  handleOrganizationDeleted,
  handleHeadUpdated
}) => {
  const headData = org?.organizationHeads;

  return (
    <Card className={`hover:shadow-lg shadow-md transition-shadow duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 shadow">
            <AvatarFallback className="dark:bg-neutral-800 bg-neutral-200 text-emerald-700 dark:text-emerald-300 font-bold text-lg">
              {getInitials(org.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {org.name}
            </CardTitle>
            <CardDescription className="text-xs break-all text-neutral-500 dark:text-neutral-400">
              {org.gstNumber}
            </CardDescription>
            {org.organizationEmail && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="flex items-center text-xs font-normal dark:border-neutral-700 border-neutral-300 bg-white/70 dark:bg-neutral-900/70 px-2 py-1"
                >
                  <Mail className="h-3 w-3 mr-1.5 text-emerald-600 dark:text-emerald-300" />
                  <span className="break-all">{org.organizationEmail}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-300">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="dark:bg-neutral-900 dark:border-neutral-800">
            <EditOrganizationDialog
              organization={org}
              onSuccess={handleOrganizationUpdated}
              asChild
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FileText className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
            </EditOrganizationDialog>
            <DeleteOrganizationDialog
              organizationId={org._id}
              onSuccess={handleOrganizationDeleted}
              asChild
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DeleteOrganizationDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pb-4">
        <Card className={`shadow-none`}>
          {headData ? (
            <CardHeader
              className="flex flex-row items-center gap-4 p-4 bg-white/80 dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm"
            >
              <Avatar className="h-12 w-12 shadow-sm ring-2 ring-emerald-100 dark:ring-emerald-900">
                {headData.profileImage ? (
                  <AvatarImage src={headData.profileImage} alt={headData.firstName || "Head"} />
                ) : null}
                <AvatarFallback className="dark:bg-neutral-700 bg-neutral-300 text-emerald-700 dark:text-emerald-300 font-bold text-lg">
                  {getInitials(headData.firstName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {headData.firstName} {headData.lastName}
                  </CardTitle>
                  {/* 
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-300 p-1"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="dark:bg-neutral-900 dark:border-neutral-800">
                      <UpdateOrganizationHeadDialog
                        head={headData}
                        onSuccess={handleHeadUpdated}
                        asChild
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <FileText className="h-4 w-4 mr-2" />
                          Edit Head
                        </DropdownMenuItem>
                      </UpdateOrganizationHeadDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  */}
                </div>
                <div className="flex flex-wrap gap-2 py-2">
                  <Badge
                    variant="outline"
                    className="flex items-center text-xs font-normal dark:border-neutral-700 border-neutral-300 bg-white/70 dark:bg-neutral-900/70 px-2 py-1"
                  >
                    <Mail className="h-3 w-3 mr-1.5 text-emerald-600 dark:text-emerald-300" />
                    <span className="break-all">{headData.personalEmail}</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center text-xs font-normal dark:border-neutral-700 border-neutral-300 bg-white/70 dark:bg-neutral-900/70 px-2 py-1"
                  >
                    <Phone className="h-3 w-3 mr-1.5 text-emerald-600 dark:text-emerald-300" />
                    <span className="break-all">{headData.phone}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
          ) : (
            <CardHeader className="p-4">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Users className="h-8 w-8 text-neutral-400 mb-2" />
                <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                  No head assigned
                </CardTitle>
                <CreateOrganizationEmployee refresh={refresh} orgId={org?._id} />
              </div>
            </CardHeader>
          )}
        </Card>
      </CardContent>
    </Card>
  );
}

export default OrgCard;