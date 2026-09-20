import '@/server/env'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { env } from '@/server/env'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'As-Sunnah Desk',
  description:
    'Service request management portal for As-Sunnah Foundation — dashboard, search, filters, and workflow updates.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" data-env={env.NODE_ENV}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
