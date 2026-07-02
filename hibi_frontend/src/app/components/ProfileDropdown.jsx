import {
  DropdownMenu,
  DropdownMenuContent,  
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BadgeCheck, Lock, LogOut } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import CustomAvatar from './ReusableComponents/CustomAvatar'

// ProfileDropdown component displays a user profile dropdown menu -> used in Product Owner page and Organization Head page. 
const ProfileDropdown = ({ user }) => {
  const fullName = user?.firstName + " " + user?.lastName
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
        <CustomAvatar url={user?.profileImage} label={fullName} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="end"
        sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <CustomAvatar url={user?.profileImage} label={fullName} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{fullName}</span>
              <span className="truncate text-xs">{user?.personalEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
              <Link className="flex gap-2 items-center" href="/profile">
            <DropdownMenuItem>
                <BadgeCheck />
                Account
            </DropdownMenuItem>
              </Link>
            <Link className="flex w-full cursor-pointer gap-2 items-center" href="/changePassword">
                <DropdownMenuItem className="w-full cursor-pointer">
                  <Lock className="w-6 h-6 dark:text-white text-gray-700" />
                  Change Password
                </DropdownMenuItem>
              </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link className="flex w-full cursor-pointer gap-2 items-center" href="/logout">
          <DropdownMenuItem className="w-full cursor-pointer">
            <LogOut size={16} />
            Log out
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileDropdown