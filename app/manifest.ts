import type { MetadataRoute } from "next"

// Next.js auto-serves this at /manifest.webmanifest and links it in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CosmicUs",
    short_name: "CosmicUs",
    description: "A private space for two hearts in the cosmos",
    start_url: "/",
    display: "standalone",
    background_color: "#050510",
    theme_color: "#050510",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
