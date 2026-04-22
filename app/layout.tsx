import type { Metadata } from 'next'
import { Inter, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const syne  = Syne({ subsets: ['latin'], variable: '--font-syne' })

export const metadata: Metadata = {
  title: 'CosmicUs - Our Space',
  description: 'A private space for two hearts in the cosmos',
}

export const viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="font-sans antialiased bg-[#050510] text-[#e8e8f0] min-h-screen overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
