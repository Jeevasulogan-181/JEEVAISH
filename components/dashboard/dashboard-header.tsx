"use client"

import { useAuth } from "@/lib/auth-context"
import { Heart, LogOut, Sparkles, Settings } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#000000] border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#f472b6] flex items-center justify-center animate-glow-pulse">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-[#f472b6] animate-pulse" />
          </div>
          <span className="font-serif font-bold text-lg cosmic-gradient-text hidden sm:block">JEEVAISHNEVI</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
          </span>
          <span className="text-xs text-[#e8e8f0] font-medium">{user?.displayName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm text-[#555577] hover:text-[#e8e8f0] transition-all px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] group"
          >
            <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-[#555577] hover:text-[#e8e8f0] transition-all px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </header>
  )
}
