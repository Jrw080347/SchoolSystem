'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ParentNavbar from '@/components/ParentNavbar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import {
  CalendarCheck,
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ArrowLeft,
  X
} from 'lucide-react'

interface Attendance {
  id: number
  studentId: number
  studentName: string
  date: string
  status: string
  note: string | null
}

const DAY_NAMES = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

export default function ParentAttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get('studentId')

  const [studentId] = useState<number | null>(() => {
    if (studentIdParam) return Number(studentIdParam)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedStudentId') : null
    return saved ? Number(saved) : null
  })

  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDayRecord, setSelectedDayRecord] = useState<{ date: string; att?: Attendance } | null>(null)

  useEffect(() => {
    if (!studentId) {
      router.push('/parent/students')
      return
    }
    localStorage.setItem('selectedStudentId', String(studentId))
    fetchData(studentId)
  }, [studentId, router])

  const fetchData = async (id: number) => {
    try {
      setLoading(true)
      const [resAtt, resInfo] = await Promise.all([
        api.get(`/parent/students/${id}/attendance`),
        api.get(`/parent/students/${id}/info`)
      ])
      setAttendances(resAtt.data || [])
      setStudentInfo(resInfo.data || null)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลการเข้าเรียนได้').message)
    } finally {
      setLoading(false)
    }
  }

  // Stats (Based on all attendance records)
  const totalDays = attendances.length
  const presentCount = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length
  const lateCount = attendances.filter(a => a.status === 'LATE').length
  const leaveCount = attendances.filter(a => a.status === 'LEAVE' || a.status === 'EXCUSED').length
  const attendanceRate = totalDays > 0 ? (presentCount / totalDays) * 100.0 : 0

  // Calendar calculations
  const yearNum = currentDate.getFullYear()
  const monthNum = currentDate.getMonth() // 0-11

  const prevMonth = () => {
    setCurrentDate(new Date(yearNum, monthNum - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(yearNum, monthNum + 1, 1))
  }

  const firstDayOfMonth = new Date(yearNum, monthNum, 1)
  const lastDayOfMonth = new Date(yearNum, monthNum + 1, 0)

  // Monday-first grid: 0 = Monday, ..., 6 = Sunday
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6

  const daysInMonth = lastDayOfMonth.getDate()

  // Map attendances by date YYYY-MM-DD
  const attendanceMap = new Map<string, Attendance>()
  attendances.forEach(att => {
    if (att.date) {
      const dateKey = att.date.split('T')[0]
      attendanceMap.set(dateKey, att)
    }
  })

  if (loading && attendances.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดประวัติการเข้าเรียน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 text-slate-900">
      <ParentNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
              <Link href="/parent/dashboard" className="hover:text-primary-600 transition">หน้าหลัก</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">บันทึกการเข้าเรียน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">บันทึกการเข้าเรียน</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              ปฏิทินประวัติการเข้าแถวและการเช็คชื่อเข้าชั้นเรียนของ {studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName} (ห้อง ${studentInfo.classroomName})` : 'นักเรียน'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/parent/students"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition border border-slate-200 shadow-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>เปลี่ยนนักเรียน</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">จำนวนครั้งที่มาเรียน</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{presentCount}</span>
                <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                จากการเช็คชื่อทั้งหมด {totalDays} วัน
              </p>
            </div>
            <div className="w-11 h-11 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 border border-primary-100">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">จำนวนการขาดเรียน</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">{absentCount}</span>
                <span className="text-xs text-slate-500 font-medium">วัน</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {absentCount === 0 ? 'ไม่มีประวัติการขาดเรียน' : 'ควรติดตามสาเหตุการขาด'}
              </p>
            </div>
            <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">การมาสาย</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight">{lateCount}</span>
                <span className="text-xs text-slate-500 font-medium">วัน</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lateCount > 3 ? 'ควรปรับปรุงเวลาเดินทาง' : 'อยู่ในเกณฑ์ปกติ'}
              </p>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">จำนวนวันลา</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-blue-600 tracking-tight">{leaveCount}</span>
                <span className="text-xs text-slate-500 font-medium">วัน</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ลาป่วยและลากิจ
              </p>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 border border-primary-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">ปฏิทินการเข้าเรียน</h3>
                <p className="text-xs text-slate-400">แสดงผลสถานะการเข้าเรียนรายวันประจำเดือน</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="PRESENT">มาเรียน</option>
                  <option value="ABSENT">ขาดเรียน</option>
                  <option value="LATE">มาสาย</option>
                  <option value="LEAVE">ลา</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-600 transition"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-bold text-slate-800 min-w-[110px] text-center">
                  {MONTHS[monthNum]} {yearNum + 543}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-600 transition"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 sm:px-5 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">คำอธิบายสถานะ:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> มาเรียน
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> มาสาย
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> ขาดเรียน
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> ลา
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3 sm:p-5">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
              {DAY_NAMES.map((dayName, idx) => (
                <div key={idx} className="text-xs font-bold text-slate-500 py-0.5">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty slots for offset */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-14 sm:h-16 bg-slate-50/40 rounded-xl border border-slate-100/50"></div>
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const mStr = String(monthNum + 1).padStart(2, '0')
                const dStr = String(day).padStart(2, '0')
                const dateKey = `${yearNum}-${mStr}-${dStr}`
                const att = attendanceMap.get(dateKey)

                // Status checks
                const isPresent = att?.status === 'PRESENT'
                const isAbsent = att?.status === 'ABSENT'
                const isLate = att?.status === 'LATE'
                const isLeave = att?.status === 'LEAVE' || att?.status === 'EXCUSED'

                // Filter check
                let matchesFilter = true
                if (filterStatus !== 'all') {
                  if (filterStatus === 'PRESENT' && !isPresent) matchesFilter = false
                  if (filterStatus === 'ABSENT' && !isAbsent) matchesFilter = false
                  if (filterStatus === 'LATE' && !isLate) matchesFilter = false
                  if (filterStatus === 'LEAVE' && !isLeave) matchesFilter = false
                }

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDayRecord({ date: dateKey, att })}
                    className={`h-14 sm:h-16 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition cursor-pointer relative ${matchesFilter && att
                        ? isPresent
                          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                          : isLate
                            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                            : isAbsent
                              ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50'
                              : isLeave
                                ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between leading-none">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">{day}</span>
                      <div className="flex items-center gap-1">
                        {att?.note && <span className="w-1 h-1 rounded-full bg-slate-400" title="มีหมายเหตุ" />}
                        {att && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : isLate ? 'bg-amber-500' : isAbsent ? 'bg-rose-500' : 'bg-blue-500'
                            }`} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-center">
                      {att ? (
                        <div>
                          {isPresent && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold leading-none">
                              มาเรียน
                            </span>
                          )}
                          {isLate && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold leading-none">
                              มาสาย
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold leading-none">
                              ขาดเรียน
                            </span>
                          )}
                          {isLeave && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold leading-none">
                              ลา
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Day Detail Modal */}
        {selectedDayRecord && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="font-bold text-slate-900 text-sm">
                  รายละเอียดการเข้าเรียนวันที่ {new Date(selectedDayRecord.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>
                <button
                  onClick={() => setSelectedDayRecord(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs sm:text-sm">
                {selectedDayRecord.att ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500">สถานะ:</span>
                      <strong className="text-slate-800">
                        {selectedDayRecord.att.status === 'PRESENT' && 'มาเรียน'}
                        {selectedDayRecord.att.status === 'LATE' && 'มาสาย'}
                        {selectedDayRecord.att.status === 'ABSENT' && 'ขาดเรียน'}
                        {(selectedDayRecord.att.status === 'LEAVE' || selectedDayRecord.att.status === 'EXCUSED') && 'ลา'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block mb-1">หมายเหตุ:</span>
                      <p className="text-slate-800 font-medium">
                        {selectedDayRecord.att.note || 'ไม่มีหมายเหตุเพิ่มเติม'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <p>ไม่มีบันทึกข้อมูลการเข้าเรียนในวันนี้</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedDayRecord(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 โรงเรียนบ้านแจ้งกู้เรือง สงวนลิขสิทธิ์</p>
        <div className="flex gap-5">
          <span className="hover:text-slate-700 cursor-pointer transition">ระบบบริหารสถานศึกษา</span>
          <span className="text-slate-300">•</span>
          <span className="hover:text-slate-700 cursor-pointer transition">พอร์ทัลผู้ปกครอง</span>
        </div>
      </footer>
    </div>
  )
}
