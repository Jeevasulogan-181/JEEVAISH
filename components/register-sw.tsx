"use client"

import { useEffect } from "react"

/** Registers the PWA service worker. Renders nothing. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("[CosmicUs] Service worker registration failed:", err))
  }, [])

  return null
}
