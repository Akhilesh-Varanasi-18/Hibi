"use client"

// main navigation for sidebar (supports submenus and highlights current route)

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";
import BgIcon from "@/app/components/BgIcon";
import { useSidebar } from "@/components/ui/sidebar";

// main menu for the sidebar
export function NavMain({ items, isMobile }) {
  const path = usePathname(); // current route
  const { setOpenMobile } = useSidebar();

  // close sidebar on mobile after clicking a menu item
  const handleNavigationClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  // checks if menu or any submenu matches current url
  const isItemActive = (item) => {
    if (item.url && path === item.url) return true;
    if (item.items && item.items.length > 0) {
      return item.items.some((subItem) => path === subItem.url);
    }
    return false;
  };
  
  return (
    <SidebarGroup>
      {/* Sidebar main label */}
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          // menu with subitems
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isItemActive(item)} // open if any sub is active
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isItemActive(item)}
                    className="hover:bg-accent hover:text-sidebar-accent-background"
                  >
                    {/* icon with color */}
                    {item.icon && <BgIcon icon={item.icon} color={item.color} />}
                    <span>{item.title}</span>
                    {/* chevron for expandable */}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title} isActive={isItemActive(subItem)}>
                        <SidebarMenuSubButton
                          className="hover:bg-accent hover:text-sidebar-accent-background"
                          asChild
                          isActive={path === subItem.url}
                          onClick={handleNavigationClick}
                        >
                          <Link href={subItem.url}>
                            {/* subitem icon */}
                            {subItem.icon && <BgIcon icon={subItem.icon} color={subItem.color} />}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            // plain menu item (no submenu)
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={path === item.url}
                className="hover:bg-accent hover:text-sidebar-accent-background"
                onClick={handleNavigationClick}
              >
                <Link href={item.url} className="flex items-center w-full">
                  {/* icon for menu item */}
                  {item.icon && <BgIcon icon={item.icon} color={item.color} />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
