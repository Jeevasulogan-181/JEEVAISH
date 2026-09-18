import type { Metadata, Viewport } from 'next'
import { Inter, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { RegisterServiceWorker } from '@/components/register-sw'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const syne  = Syne({ subsets: ['latin'], variable: '--font-syne' })

export const metadata: Metadata = {
  title: 'CosmicUs - Our Space',
  description: 'A private space for two hearts in the cosmos',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CosmicUs',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050510',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="font-sans antialiased bg-[#050510] text-[#e8e8f0] min-h-screen overflow-x-hidden">
        <AuthProvider>{children}</AuthProvider>
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  )
}
