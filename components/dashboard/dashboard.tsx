"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "./dashboard-header"
import { ChatBox } from "./chat-box"
import { Notes } from "./notes"
import { Gallery } from "./gallery"
import { QuotesWidget } from "./quotes-widget"
import { Heart, Star, Infinity } from "lucide-react"

export function Dashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Hero card */}
          <div className={`mb-6 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="relative overflow-hidden rounded-2xl cosmic-card">
              <div className="absolute -bottom-20 -left-20 w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-[#6366f1] to-[#f472b6] opacity-[0.04] blur-[60px]" />
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-gradient-to-bl from-[#8b5cf6] to-[#6366f1] opacity-[0.04] blur-[40px]" />
              <div className="relative px-6 py-5">
                <div className="flex items-center gap-5">
                  <div className="relative hidden sm:block">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#f472b6] flex items-center justify-center shadow-lg shadow-[#6366f1]/20 animate-float">
                      <Infinity className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: "12s" }}>
                      <div className="absolute -top-1 left-1/2 w-1.5 h-1.5 rounded-full bg-[#f472b6]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-serif text-2xl sm:text-3xl font-bold cosmic-gradient-text">Our Universe</h1>
                      <Heart className="w-4 h-4 text-[#f472b6] fill-[#f472b6] animate-heartbeat" />
                    </div>
                    <p className="text-[#8888aa] text-sm leading-relaxed">Everything we share lives here — our chats, memories, notes, and little love letters from the stars.</p>
                  </div>
                  <div className="hidden md:flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)]">
                      <Star className="w-3 h-3 text-[#6366f1]" />
                      <span className="text-[11px] text-[#818cf8] font-medium">Connected</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(244,114,182,0.08)] border border-[rgba(244,114,182,0.15)]">
                      <Heart className="w-3 h-3 text-[#f472b6] fill-[#f472b6]" />
                      <span className="text-[11px] text-[#f472b6] font-medium">Forever</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Chat */}
            <div className={`lg:col-span-5 xl:col-span-4 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="lg:sticky lg:top-20 h-[calc(100vh-6rem)]">
                <ChatBox />
              </div>
            </div>

            {/* Right: Widgets */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
              <div className={`transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <QuotesWidget />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={`transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                  <Notes />
                </div>
                <div className={`transition-all duration-700 delay-[400ms] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                  <Gallery />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
