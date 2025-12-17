import * as React from "react"
import { useLocation, NavLink } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavMainItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const location = useLocation()

  const isItemActive = React.useCallback(
    (url: string) => {
      const path = location.pathname
      if (url === "/home" && path === "/") return true
      if (path === url) return true
      // highlight parent routes like /reports/*
      return path.startsWith(`${url}/`)
    },
    [location.pathname]
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon
            const active = isItemActive(item.url)

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <NavLink to={item.url}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
