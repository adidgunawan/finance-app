import * as React from "react"

import { FiHelpCircle, FiLogOut, FiSettings } from "react-icons/fi"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

function getUserDisplayName(user: any) {
  if (user?.name) return user.name
  if (user?.email) return user.email.split("@")[0]
  return "User"
}

function getUserInitials(user: any) {
  const name = getUserDisplayName(user)
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function NavUser() {
  const { user, logout } = useAuth()

  const handleLogout = React.useCallback(async () => {
    try {
      await logout()
      window.location.href = "/login"
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error)
    }
  }, [logout])

  const displayName = getUserDisplayName(user)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              )}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={displayName} />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                {user?.email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side="top"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuItem className="cursor-pointer">
              <FiSettings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <FiHelpCircle className="mr-2 h-4 w-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
