'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import { GraduationCap, School, ChevronRight, LogOut, User } from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  studentCode: string
  classroomName: string
}

export default function ParentStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('ผู้ปกครอง')

  useEffect(() => {
    setFullName(Cookies.get('fullName') || 'ผู้ปกครอง')
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await api.get('/parent/students')
      const studentList = res.data || []
      setStudents(studentList)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายชื่อนักเรียนได้').message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('role')
    Cookies.remove('fullName')
    toast.success('ออกจากระบบเรียบร้อยแล้ว')
    router.push('/auth/login')
  }

  const handleSelectStudent = (studentId: number) => {
    localStorage.setItem('selectedStudentId', String(studentId))
    router.push(`/parent/dashboard?studentId=${studentId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลนักเรียน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 text-slate-900">
      {/* Clean Navbar without tab links */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-slate-200 shrink-0">
              <img
                src="/images/school-logo.png"
                alt="ตราโรงเรียนบ้านแจ้งกู้เรือง"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-tight">ผู้ปกครอง</span>
              <p className="text-xs text-slate-500 font-medium">โรงเรียนบ้านแจ้งกู้เรือง</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 relative group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{fullName}</p>
                <p className="text-xs font-semibold text-primary-600">ผู้ปกครอง</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm transition-transform group-hover:scale-105">
                <User className="w-5 h-5" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50">
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100 mb-3">
            <GraduationCap className="w-4 h-4" />
            <span>ผู้ปกครอง โรงเรียนบ้านแจ้งกู้เรือง</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">เลือกนักเรียนในความดูแล</h1>
          <p className="text-slate-500 text-base mt-2">
            กรุณาเลือกนักเรียนที่ท่านต้องการตรวจสอบผลการเรียน การบ้าน และประวัติการมาเรียน
          </p>
        </div>

        {students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectStudent(s.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-500 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-bl-full pointer-events-none group-hover:bg-primary-100/50 transition-colors"></div>

                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md font-bold text-2xl group-hover:scale-105 transition-transform shrink-0">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      กำลังศึกษา
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                    {s.firstName} {s.lastName}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider w-20">รหัสนักเรียน:</span>
                      <strong className="text-slate-800">{s.studentCode}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider w-20">ชั้นเรียน:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        ห้อง {s.classroomName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-primary-600 font-bold text-sm">
                  <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                    เข้าสู่หน้าแดชบอร์ดนักเรียน
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-primary-50 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">ยังไม่มีข้อมูลนักเรียนที่เชื่อมโยง</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              บัญชีผู้ปกครองนี้ยังไม่ได้ถูกผูกกับข้อมูลนักเรียนในระบบ กรุณาติดต่อฝ่ายธุรการโรงเรียน
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
