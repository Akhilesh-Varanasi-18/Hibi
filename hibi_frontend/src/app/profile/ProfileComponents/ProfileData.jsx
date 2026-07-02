"use client"
import { useContext, useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { differenceInDays, isToday, format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, Cake, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmployeeProfileDialog } from "./Dialogues/EditProfileDialog"
import { UsersContext } from "../../context/UserContext"
import LoginApi from "@/Apis/LoginApi"

export default function EmployeeCard() {
  const data = useContext(UsersContext);
  const [employee, setemployee] = useState(data?.user);
  const today = new Date();
  const dob = employee?.dateOfBirth ? new Date(employee?.dateOfBirth) : null;
  const isBirthday =
    dob &&
    dob.getDate() === today.getDate() &&
    dob.getMonth() === today.getMonth();

  async function onSuccess() {
    const res = await LoginApi.GetEmployeeData();
    if (res?.success) {
      setemployee(res?.data);
      data?.setUser(res?.data);
    }
  }

  return (
    <Card className="bg-neutral-50 dark:bg-neutral-950 relative">
      {/* Floating avatar */}
      <div className="absolute -top-12 left-6 z-10">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={employee?.profileImage} />
          <AvatarFallback className="bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-xl">
            {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      <CardHeader className="pt-16 pb-4 px-6">
        <div className="flex justify-end items-end w-full">
          <EmployeeProfileDialog onSuccess={onSuccess} data={employee} />
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <h2 className="text-2xl font-bold text-foreground">
            {employee?.firstName} {employee?.lastName}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Badge className="rounded-full text-xs">{employee?.employeeCode}</Badge>
            <span className="text-muted-foreground">•</span>
            <p className="text-muted-foreground">{employee?.roleId?.name}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-5">
        {/* Contact Details */}
        <div className="grid gap-4">
          <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/30">
            <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Email
              </p>
              <p className="text-foreground break-all">
                {employee?.personalEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/30">
            <div className="p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20">
              <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Phone
              </p>
              <p className="text-foreground">
                {employee?.phone}
              </p>
            </div>
          </div>

          {/* Date of Joining Section */}
          <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/30">
            <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Date of Joining
              </p>
              <p className="text-foreground">
                {employee?.dateOfJoining ? format(new Date(employee.dateOfJoining), "MMMM dd, yyyy") : "Not available"}
              </p>
            </div>
          </div>
        </div>

        {/* Birthday Banner */}
        {isBirthday && (
          <div className="p-4 rounded-xl border border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-pink-100/50 dark:bg-pink-900/20">
              <Cake className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Happy Birthday {employee?.firstName}! 🎉
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Wishing you an amazing year ahead
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}