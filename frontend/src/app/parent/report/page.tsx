'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParentReportRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/parent/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">กำลังนำท่านไปยังแดชบอร์ดผู้ปกครอง...</p>
      </div>
    </div>
  )
}
