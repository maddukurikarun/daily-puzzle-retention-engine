import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import AchievementDisplay from '@/components/AchievementDisplay'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Daily Puzzle - Retention Engine',
  description: 'Daily puzzle game with streak tracking and offline support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ServiceWorkerRegistration />
          <AchievementDisplay />
          {children}
        </Providers>
      </body>
    </html>
  )
}
