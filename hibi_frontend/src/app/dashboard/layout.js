"use client"
import { AppSidebar } from "@/app/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useContext, useEffect, useState } from "react"
import { UsersContext } from "../context/UserContext"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DataContext, { CommonDataContext } from "./context/CommonDataContext"
import statusApi from "@/Apis/status_Api"
import DashBoardWrapper from "./DashBoardWrapper"
import UnauthorizedPage from "../components/ReusableComponents/UnauthorizedPage"

export default function layout({ children }) {
  const { role, previlege } = useContext(UsersContext);

  if (!role || role == "PRODUCTMANAGER" || role == "ORGANIZATIONHEAD" || !previlege) {
    return (
      <UnauthorizedPage />
    );
  }



  return (
    <div className="max-w-full">
      <DataContext>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex w-full items-center justify-between gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
            <DashBoardWrapper>
              {children}
            </DashBoardWrapper>
          </SidebarInset>
        </SidebarProvider>
      </DataContext>
    </div>
  )
}
