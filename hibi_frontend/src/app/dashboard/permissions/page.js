"use client"

import { useContext, useEffect, useState } from "react";
import permissionsAPI from "@/Apis/Permissions_APIs";
import PermissionCard from "./components/EmployeeComponents/PermissionCard";
import { UsersContext } from "@/app/context/UserContext";
import ApprovalsCard from "./components/AdminComponents/ApprovalsCards";
import StatisticsCards from "./components/EmployeeComponents/StatisticsCards";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployeeShifts } from "@/Apis/Common_APIs";
import WFHCard from "./components/EmployeeComponents/WFHCard";
import { GoHome } from "react-icons/go";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/app/components/ReusableComponents/PageHeader";
import Comparing from "@/utils/CommonFunctionality";
import OrganizationApprovalsCards from "./components/AdminComponents/OrganizationApprovalsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWFHIconAndBg } from "@/utils/PermissionsIcons";


export default function Page() {
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [loadingPermissionTypes, setLoadingPermissionTypes] = useState(true);
  const [permissionTypesError, setPermissionTypesError] = useState(false);
  const { role, previlege } = useContext(UsersContext);
  const [refresh, setRefresh] = useState(0);
  const [curShift, setCurShift] = useState(null);

  async function fetchEmployeeShifts() {
    try {
      const res = await getEmployeeShifts();
      setCurShift(res);
    } catch (e) {
      setCurShift(null);
    }
  }

  async function fetchPermissionTypes() {
    setPermissionTypesError(false);
    try {
      const res = await permissionsAPI.getAllPermissionTypes();
      if (res.success) {
        setPermissionTypes(res.data || []);
        console.log(res)
        setPermissionTypesError(false);
      } else {
        setPermissionTypes([]);
        setPermissionTypesError(true);
      }
    } catch (error) {
      setPermissionTypes([]);
      setPermissionTypesError(true);
      // error fetching permission types
    }
  }

  useEffect(() => {
    let isMounted = true;
    setLoadingPermissionTypes(true);

    // load permissions and shift info
    Promise.all([
      fetchPermissionTypes(),
      // fetchNotifyTo(),
      fetchEmployeeShifts()
    ]).finally(() => {
      if (isMounted) setLoadingPermissionTypes(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Only show approvals for admins and superadmins
  const showPendingApprovals =
    previlege &&
    (previlege.toUpperCase() === "SUPERADMIN" || previlege.toUpperCase() === "ADMIN");

  // Loading skeleton for permission cards
  const PermissionCardSkeletons = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-xl bg-card" />
      ))}
    </div>
  );

  // Shown if no permission types
  const NoPermissionTypes = () => (
    <div className="w-full text-center py-8 text-neutral-500 dark:text-neutral-400">
      No permission types available.
    </div>
  );

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      {/* page title */}
      <PageHeader
        title="Permissions Management"
        rightContent={null}
      />

      {/* Employee View / This is only for applying requests */}
      {(Comparing.compareStrings(role, "EMPLOYEE") ||
        Comparing.compareStrings(role, "INTERN") ||
        Comparing.compareStrings(role, "ACCOUNTANT") ||
        Comparing.compareStrings(role, "DESIGNER")) ? (
        <>
          {/* quick actions for employees/interns */}
          {loadingPermissionTypes ? (
            <PermissionCardSkeletons />
          ) : permissionTypesError ? (
            <NoPermissionTypes />
          ) : permissionTypes.length === 0 ? (
            <NoPermissionTypes />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {
                curShift &&
                permissionTypes.map((item, i) => (
                  <PermissionCard
                    shiftDetails={curShift}
                    key={item._id || i}
                    card={item}
                    refresh={() => setRefresh(prev => prev + 1)}
                  />
                ))
              }
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {
              curShift &&
              <Card className={` hover:shadow-sm transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      Work From Home
                    </CardTitle>
                    {getWFHIconAndBg()}
                  </div>
                  <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                    Request permission for WFH
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WFHCard refresh={() => setRefresh(prev => prev + 1)} />
                </CardContent>
              </Card>
            }
          </div>
          {/* stats for employee/intern etc */}
          <div className="w-full ">
            <StatisticsCards refresh={refresh} />
          </div>
        </>
      ) : (
        <>
          {/* This is for Approvals , it could be done by any role other than EMPLOYEE / INTERN / Designer / ACCOUNTANT*/}
          {/* for CEO and COO all the organization approvals will also be visible */}
          {Comparing.compareStrings(previlege, "SUPERADMIN") 
            ? (
              <Tabs defaultValue="ActionRequired" className="w-full">
                <TabsList>
                  <TabsTrigger value="ActionRequired">
                    Your Approvals
                  </TabsTrigger>
                  <TabsTrigger value="AllRequests">
                    Organization Approvals
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ActionRequired" className="space-y-6 mt-6 w-full">
                  <ApprovalsCard />
                </TabsContent>
                <TabsContent value="AllRequests" className="space-y-6 mt-6 w-full">
                  <OrganizationApprovalsCards />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-wrap gap-6">
                {/* approvals for admin */}
                {showPendingApprovals && (
                  <ApprovalsCard />
                )}
              </div>
            )
          }
        </>
      )}
    </div>
  );
}