'use client'

import Sidebar from '@/components/Sidebar'
import Cookies from 'js-cookie'
import Link from 'next/link'

export default function AdminImport() {
  const role = Cookies.get('role') || 'ADMIN'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูล</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <Link href="/admin/import/teachers" className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-md hover:border-red-200 transition-all group">
            <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-2 mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <img src="/images/school-logo.png" alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">นำเข้าข้อมูลคุณครู</h3>
            <p className="text-sm text-gray-500">นำเข้าไฟล์ Excel เพื่อเพิ่มข้อมูลครูในระบบ</p>
          </Link>

          <Link href="/admin/import/students" className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-md hover:border-red-200 transition-all group">
            <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-2 mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <img src="/images/school-logo.png" alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">นำเข้าข้อมูลนักเรียนและผู้ปกครอง</h3>
            <p className="text-sm text-gray-500">นำเข้า Excel เพื่อเพิ่มข้อมูลนักเรียนพร้อมผู้ปกครอง</p>
          </Link>
        </div>
      </main>
    </div>
  )
}