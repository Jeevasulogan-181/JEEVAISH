"use client"

import { useEffect, useState } from "react"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { CosmicBackground } from "@/components/cosmic-background"
import { LoginPage } from "@/components/login-page"
import { Dashboard } from "@/components/dashboard/dashboard"
import { Spinner } from "@/components/ui/spinner"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return }
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [isLoading])

  if (isLoading && !timedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-[#8b5cf6] mx-auto mb-3" />
          <p className="text-[#9ca3af] text-sm">Entering the cosmos…</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <LoginPage />
}

export default function Home() {
  return (
    <AuthProvider>
      <CosmicBackground />
      <AppContent />
    </AuthProvider>
  )
}
