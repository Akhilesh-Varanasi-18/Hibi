"use client"

/**
 * TeamSwitcher component
 * 
 * This component is responsible for displaying and allowing the user to switch between different roles (teams)
 * that they have access to within the application. It is typically used in the sidebar of the app.
 * 
 * Main functionalities:
 * 
 * 1. **Role Display & Switching**:
 *    - If the user has only one role, it simply displays the current role (no dropdown/switcher).
 *    - If the user has multiple roles, it displays a dropdown menu allowing the user to switch between roles.
 *    - When a new role is selected, it updates both the local state and calls the provided setRole function (if any).
 * 
 * 2. **Sync with Props**:
 *    - The component keeps its internal activeRole state in sync with the `role` prop and the `roles` array.
 *    - If the `role` prop changes or the available `roles` change, it updates the activeRole accordingly.
 * 
 * 3. **Styling & Theming**:
 *    - The component adapts its background color based on the current theme (dark or light).
 *    - Uses icons for visual clarity (GalleryVerticalEnd for role, ChevronsUpDown for dropdown indicator).
 * 
 * 4. **Responsiveness**:
 *    - The dropdown menu aligns differently on mobile (bottom) vs desktop (right) using the isMobile flag from sidebar context.
 * 
 * 5. **Accessibility**:
 *    - If there is no active role, the component renders nothing.
 */

import React, { useContext, useEffect } from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UsersContext } from "@/app/context/UserContext"

export function TeamSwitcher({
  roles = [],
  role,
  setRole
}) {
  const { isMobile } = useSidebar()
  const { colorPalettesFromBackend } = useContext(UsersContext);
  // console.log(colorPalettesFromBackend)
  // Default to roles[0] if role is not provided
  const initialRole = role || roles[0] || "";
  const [activeRole, setActiveRole] = React.useState(initialRole);

  /**
   * useEffect: Keeps the activeRole state in sync with the role prop and roles array.
   * - If the role prop is present and valid, set it as activeRole.
   * - If not, but roles array has at least one role, set the first role as activeRole and call setRole if provided.
   * - If no roles, clear activeRole.
   */
  useEffect(() => {
    if (role && roles.includes(role)) {
      setActiveRole(role);
    } else if (roles.length > 0) {
      setActiveRole(roles[0]);
      if (setRole) setRole(roles[0]);
    } else {
      setActiveRole("");
    }
  }, [role, roles, setRole]);

  // If there is no active role, render nothing
  if (!activeRole) {
    return null;
  }

  // If only one role, just show the role, not a switcher
  if (roles.length < 2) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-accent data-[state=open]:text-sidebar-accent-background hover:bg-accent hover:text-sidebar-accent-background ">
            {/* Role icon with theme-based background */}
            <div
              className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground"
              style={{ backgroundColor: colorPalettesFromBackend?.mainColor }}
            >
              <GalleryVerticalEnd className="size-4" color={colorPalettesFromBackend?.textOnMainColor} />
            </div>
            {/* Role name */}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeRole}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If more than one role, allow switching via dropdown menu
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-sidebar-accent-background hover:bg-accent hover:text-sidebar-accent-background ">
              {/* Role icon with theme-based background */}
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground"
                style={{ backgroundColor: colorPalettesFromBackend?.mainColor }}
              >
                <GalleryVerticalEnd className="size-4" color={colorPalettesFromBackend?.textOnMainColor}/>
              </div>
              {/* Current active role name */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeRole}
                </span>
              </div>
              {/* Dropdown indicator */}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            {/* Dropdown label */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              roles
            </DropdownMenuLabel>
            {/* List all available roles as menu items */}
            {roles.map((r, index) => (
              <DropdownMenuItem
                key={r}
                onClick={() => {
                  setActiveRole(r);
                  setRole && setRole(r);
                }}
                className="gap-2 p-2"
              >
                {/* Role icon for each menu item, with theme-based accent */}
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <GalleryVerticalEnd className="size-4 shrink-0" />
                </div>
                {r}
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
