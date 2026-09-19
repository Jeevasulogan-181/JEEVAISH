"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { QuotesWidget } from "./quotes-widget"
import {
  Heart, MessageCircle, BookOpen, ImageIcon, Popcorn, Settings, LogOut, Sparkles,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: MessageCircle },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/movies", label: "Watch Together", icon: Popcorn },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#f472b6] flex items-center justify-center animate-glow-pulse">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-[#f472b6] animate-pulse" />
          </div>
          <span className="font-serif font-bold text-lg cosmic-gradient-text">CosmicUs</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Our Space</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="p-0">
          <div className="px-2">
            <QuotesWidget />
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
          </span>
          <span className="text-xs text-sidebar-foreground font-medium truncate">{user?.displayName}</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Leave</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
