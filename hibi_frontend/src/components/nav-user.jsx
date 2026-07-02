"use client"

/**
 * NavUser component
 * 
 * This component renders the user profile section in the sidebar, including:
 * - The user's avatar, name, and email.
 * - A dropdown menu with options for viewing the account, changing the password, and logging out.
 * - Responsive alignment for mobile/desktop.
 * 
 * Functionality:
 * 1. The main button shows the user's avatar, full name, and office email.
 * 2. Clicking the button opens a dropdown menu with:
 *    - A label showing the user's avatar, full name, and personal email.
 *    - Menu items for "Account" (profile page), "Change Password", and "Log out".
 *    - (Notifications is present in code but commented out.)
 * 3. Uses the isMobile flag to align the dropdown appropriately.
 * 4. Uses Next.js Link for navigation.
 * 5. Uses Lucide icons for visual cues.
 */

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Settings } from "lucide-react";
import { Lock } from "lucide-react";
import CustomAvatar from "@/app/components/ReusableComponents/CustomAvatar"

export function NavUser({
  user
}) {
  // Get sidebar context to determine if on mobile for dropdown alignment
  const { isMobile } = useSidebar()
  // Construct the user's full name
  const fullName = user?.firstName + " " + user?.lastName

  return (
    // SidebarMenu is the container for the user menu in the sidebar
    <SidebarMenu>
      <SidebarMenuItem>
        {/* DropdownMenu wraps the user button and dropdown content */}
        <DropdownMenu>
          {/* DropdownMenuTrigger makes the button open the dropdown */}
          <DropdownMenuTrigger asChild>
            {/* SidebarMenuButton is the clickable user profile button */}
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-sidebar-accent-background hover:bg-accent hover:text-sidebar-accent-background ">
              {/* User avatar */}
              <CustomAvatar url={user?.profileImage} label={fullName} />
              {/* User name and office email */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{fullName}</span>
                <span className="truncate text-xs">{user?.officeMail || user?.personalEmail}</span>
              </div>
              {/* Dropdown indicator icon */}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {/* DropdownMenuContent: the dropdown itself */}
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            {/* Dropdown label: shows avatar, name, and personal email */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <CustomAvatar url={user?.profileImage} label={fullName} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{fullName}</span>
                  <span className="truncate text-xs">{user?.officeMail || user?.personalEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* Separators for visual grouping */}
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            {/* Group of account-related actions */}
            <DropdownMenuGroup>
              {/* Link to profile/account page */}
              <Link className="flex w-full cursor-pointer gap-2 items-center" href="/profile">
                <DropdownMenuItem className="w-full cursor-pointer">
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
              </Link>
              {/* Link to change password page */}
              <Link className="flex w-full cursor-pointer gap-2 items-center" href="/changePassword">
                <DropdownMenuItem className="w-full cursor-pointer">
                  <Lock className="w-6 h-6 dark:text-white text-gray-700" />
                  Change Password
                </DropdownMenuItem>
              </Link>
              {/* Notifications menu item (currently commented out) */}
              {/* <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Log out link */}
            <Link className="flex w-full cursor-pointer gap-2 items-center" href="/logout">
              <DropdownMenuItem className="w-full cursor-pointer">
                <LogOut size={16} />
                Log out
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
