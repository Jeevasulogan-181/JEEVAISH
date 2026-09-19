"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { CosmicBackground } from "@/components/cosmic-background"
import { AppShell } from "@/components/dashboard/app-shell"
import { Gallery } from "@/components/dashboard/gallery"
import { Spinner } from "@/components/ui/spinner"

export default function GalleryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.replace("/")
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <>
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8 text-[#8b5cf6]" />
        </div>
      </>
    )
  }

  return (
    <>
      <CosmicBackground />
      <AppShell title="Gallery">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto w-full">
            <Gallery />
          </div>
        </div>
      </AppShell>
    </>
  )
}
