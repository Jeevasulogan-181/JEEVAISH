"use client"

import type { ReactNode } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[#000000]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <SidebarTrigger />
          <h1 className="font-serif font-semibold text-foreground">{title}</h1>
        </header>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
