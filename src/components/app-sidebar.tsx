import * as React from "react"
import { Link } from "react-router-dom"

import {
  FiBarChart2,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiRefreshCw,
  FiRepeat,
  FiUsers,
} from "react-icons/fi"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

const navItems: NavMainItem[] = [
  { url: "/home", title: "Dashboard", icon: FiHome },
  { url: "/chart-of-accounts", title: "Chart of Accounts", icon: FiBarChart2 },
  { url: "/transactions", title: "Transactions", icon: FiRepeat },
  { url: "/contacts", title: "Contacts", icon: FiUsers },
  { url: "/reports", title: "Reports", icon: FiFileText },
  { url: "/reconciliation", title: "Reconciliation", icon: FiRefreshCw },
  { url: "/banks", title: "Banks", icon: FiCreditCard },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Jenjun">
              <Link to="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Jenjun"
                    className="size-8 object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Jenjun</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Finance App
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
