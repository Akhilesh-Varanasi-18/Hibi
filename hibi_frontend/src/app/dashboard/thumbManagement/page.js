"use client";
import React, { useContext, useState } from "react";
import NewRequest from "./NewRequest";
import GetRequests from "./GetRequests";
import GetActionRequests from "./GetActionRequests";
import { UsersContext } from "@/app/context/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationRequests from "./OrganizationRequests";
import Comparing from "@/utils/CommonFunctionality";

const page = () => {
  const { role, user, previlege } = useContext(UsersContext);
  const [refreshCnt, setRefreshCnt] = useState(0);
  console.log(role, user, previlege);
  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen">
      <div className="flex flex-col gap-2 w-full ">
        <div className="flex justify-between flex-wrap pb-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Thumb Management
          </h1>
          {/* Only show NewRequest for EMPLOYEE, INTERN, ACCOUNTANT, DESIGNER */}
          {(Comparing.compareStrings(role, "EMPLOYEE") ||
            Comparing.compareStrings(role, "INTERN") ||
            Comparing.compareStrings(role, "ACCOUNTANT") ||
            Comparing.compareStrings(role, "DESIGNER")) && (
            <NewRequest refresh={() => setRefreshCnt(p => p + 1)} />
          )}
        </div>

        {/* Show GetRequests for EMPLOYEE, INTERN, ACCOUNTANT, DESIGNER */}
        {(Comparing.compareStrings(role, "EMPLOYEE") ||
          Comparing.compareStrings(role, "INTERN") ||
          Comparing.compareStrings(role, "ACCOUNTANT") ||
          Comparing.compareStrings(role, "DESIGNER")) ? (
          <GetRequests refresh={refreshCnt} />
        ) : (
          /* SUPERADMIN see all requests in tabs, others see GetActionRequests */
          (Comparing.compareStrings(previlege, "SUPERADMIN")) ? (
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
                <GetActionRequests />
              </TabsContent>
              <TabsContent value="AllRequests" className="space-y-6 mt-6 w-full">
                <OrganizationRequests />
              </TabsContent>
            </Tabs>
          ) : (
            <GetActionRequests />
          )
        )}
      </div>
    </div>
  );
};

export default page;
