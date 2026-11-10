import type { Metadata } from 'next'
import './globals.css'
import { NotificationProvider } from '@/components/ui/NotificationProvider'

export const metadata: Metadata = {
  title: 'ระบบตรวจสอบงานนักเรียน | โรงเรียนบ้านแจ้งกู้เรื่อง',
  description: 'ระบบตรวจสอบงานและสถานการณ์บ้านนักเรียนสำหรับผู้ปกครอง',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  )
}
