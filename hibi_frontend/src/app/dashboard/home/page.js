"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, Gift, Loader2, Plus } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { UsersContext } from "@/app/context/UserContext";
import BirthDays from "../../components/dashboard/home/BirthDays";
import homePageApi from "@/Apis/HomePageApi";
import HolidaysCard from "../../components/dashboard/home/Holidays";
import { useSearchParams, useRouter } from "next/navigation";
import digiloackerApi from "@/Apis/digiloacker";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import Announcements from "../../components/dashboard/home/Announcements";
import CreateAnnouncements from "../../components/dashboard/home/CreateAnnouncements";
import Comparing from "@/utils/CommonFunctionality";
import AttendenceStastics from "@/app/components/dashboard/home/AttendenceStastics";
import OrganizationAttendence from "@/app/components/dashboard/home/OrganizationAttendence";
import PageHeader from "@/app/components/ReusableComponents/PageHeader";
import TopAttendanceEmployees from "@/app/components/dashboard/home/TopAttendanceEmployees";
import TopLeavesEmployees from "@/app/components/dashboard/home/TopLeavesEmployees";
import TopTaskCompleted from "@/app/components/dashboard/home/TopTaskCompleted";

export default function page() {
  const { user, role, previlege } = useContext(UsersContext);
  const [refreshAnnouncements, setRefreshAnnouncements] = useState(0);
  const [used, setused] = useState(false);
  const currentHour = new Date().getHours();
  const [tokenLoader, settokenLoader] = useState(false);
  let greeting = "Good Evening";
  const { toast } = useToast();
  const router = useRouter();

  if (currentHour < 12) greeting = "Good Morning";
  else if (currentHour < 18) greeting = "Good Afternoon";


  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state && !used) {
      DigiLockerVerify(code);
    }
  }, [])

  async function DigiLockerVerify(code) {
    settokenLoader(true);
    const res = await digiloackerApi.Verify(code);
    if (res.success) {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> <span>{res?.message}</span>
        </div>,
      })
      setused(true);
      setTimeout(() => { router.push("/dashboard/home") }, 400)
    }
    else {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>{res?.error}</span>
        </div>,
      })
      setused(true);
      setTimeout(() => { router.push("/dashboard/home") }, 400)
    }
    settokenLoader(false);
  }

  if (tokenLoader) {
    return (
      <>
        <div className="w-full h-screen flex justify-center items-center">
          <div className="animate-spin">
            <Loader2 size={35} className="" />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="px-6 pb-10 space-y-8 min-h-screen  transition-colors">
      {/* Greeting Section */}
      <PageHeader
        title={
          <>
            {greeting},{" "}
            {user && (user.firstName || user.lastName)
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : ""}
          </>
        }
        rightContent={
          (Comparing.compareStrings(previlege, "SUPERADMIN") || Comparing.compareStrings(previlege, "ADMIN")) && (
            <CreateAnnouncements refresh={() => setRefreshAnnouncements(prev => prev + 1)} />
          )
        }
      />

      {/* <div>
            <TodayBirthday/>
      </div> */}
      <Announcements refresh={refreshAnnouncements} />

      <div className="w-full gap-4">
        {/* Inner Flex Group for Admin Cards */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 flex-1 items-stretch mb-4 w-full">
          {Comparing.compareStrings(previlege, "SUPERADMIN") && (
            <OrganizationAttendence />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Holidays Card */}
          <div className="flex-1 min-w-[280px] max-w-[370px] flex flex-col h-full">
            <HolidaysCard />
          </div>

          {/* BirthDays Card */}
          <div className="flex-1 min-w-[280px] max-w-[370px] flex flex-col h-full">
            <BirthDays />
          </div>

          {(Comparing.compareStrings(previlege, "ADMIN") || Comparing.compareStrings(previlege, "SUPERADMIN")) && (
            <div className="flex-1 min-w-[320px] max-w-[370px] flex flex-col">
              <AttendenceStastics />
            </div>
          )}

          {/* TopAttendanceEmployees and TopLeavesEmployees - Superadmins only */}
          {Comparing.compareStrings(previlege, "SUPERADMIN") && (
            <>
              <div className="flex-1 w-full flex flex-col h-full">
                <TopAttendanceEmployees />
              </div>
              <div className="flex-1 w-full flex flex-col h-full">
                <TopLeavesEmployees />
              </div>
            </>
          )}
          <div className="flex-1 w-full flex flex-col h-full">
            <TopTaskCompleted />
          </div>
        </div>
      </div>

    </div >
  );
}
