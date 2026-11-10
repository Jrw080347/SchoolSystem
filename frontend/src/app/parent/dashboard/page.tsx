'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ParentNavbar from '@/components/ParentNavbar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Link from 'next/link'
import {
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  CheckCircle2,
  Clock,
  School,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowLeft,
  TrendingUp
} from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  studentCode: string
  classroomName: string
  gender?: string
}

interface RecentAttendance {
  id: number
  studentId: number
  studentName: string
  date: string
  status: string
  note: string | null
}

interface Report {
  student: Student
  attendanceRate: number
  totalAttendanceDays?: number
  presentAttendanceCount?: number
  totalAssignments: number
  submittedAssignments: number
  pendingAssignments: number
  recentAssignments: any[]
  recentAttendances?: RecentAttendance[]
}

const DAY_MAP: Record<number, string> = {
  0: 'อา.',
  1: 'จ.',
  2: 'อ.',
  3: 'พ.',
  4: 'พฤ.',
  5: 'ศ.',
  6: 'ส.'
}

export default function ParentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get('studentId')

  const [studentId, setStudentId] = useState<number | null>(() => {
    if (studentIdParam) return Number(studentIdParam)
    const saved = localStorage.getItem('selectedStudentId')
    return saved ? Number(saved) : null
  })

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      router.push('/parent/students')
      return
    }
    localStorage.setItem('selectedStudentId', String(studentId))
    fetchReport(studentId)
  }, [studentId, router])

  const fetchReport = async (id: number) => {
    try {
      setLoading(true)
      const res = await api.get(`/parent/students/${id}/report`)
      setReport(res.data)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายงานนักเรียนได้').message)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> มาเรียน
          </span>
        )
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ขาดเรียน
          </span>
        )
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> มาสาย
          </span>
        )
      case 'LEAVE':
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ลา
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            {status}
          </span>
        )
    }
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    )
  }

  const completionPercent = report && report.totalAssignments > 0
    ? Math.round((report.submittedAssignments / report.totalAssignments) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 text-slate-900">
      <ParentNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header & Switch Student button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>ภาพรวมการเรียน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">แดชบอร์ดนักเรียน</h1>
            <p className="text-slate-500 text-sm mt-0.5">ติดตามผลการเรียน ความก้าวหน้า และบันทึกการเข้าเรียนของบุตรหลาน</p>
          </div>
          <Link
            href="/parent/students"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>เปลี่ยนนักเรียน</span>
          </Link>
        </div>

        {report && (
          <div className="space-y-6">
            {/* Student Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-primary-700 via-primary-600 to-teal-600 relative px-6 pt-3.5 sm:pt-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-white">
                    <School className="w-4 h-4" />
                  </div>
                  <span className="text-white/90 text-xs font-medium tracking-wide">โรงเรียนบ้านแจ้งกู้เรือง</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full text-white text-xs font-semibold border border-white/30 shadow-sm">
                  รหัสประจำตัว: {report.student.studentCode}
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-5">
                <div className="-mt-14 shrink-0 relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-primary-50 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-primary-700 font-bold text-3xl">
                    <GraduationCap className="w-12 h-12 text-primary-600" />
                  </div>
                  <div className="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full absolute bottom-1 right-1" title="กำลังศึกษา"></div>
                </div>

                <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {report.student.firstName} {report.student.lastName}
                    </h2>
                    <span className="inline-flex items-center self-center sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      กำลังศึกษา
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <School className="w-4 h-4 text-slate-400" />
                      ชั้นเรียน: <strong className="text-slate-800">{report.student.classroomName}</strong>
                    </span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-500 text-xs">
                      ปีการศึกษาปัจจุบัน
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/parent/assignments?studentId=${studentId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    ดูการบ้าน
                  </Link>
                  <Link
                    href={`/parent/attendance?studentId=${studentId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-bold transition border border-primary-200"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    ดูประวัติการมาเรียน
                  </Link>
                </div>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Attendance Count */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">จำนวนครั้งที่มาเรียน</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {report.presentAttendanceCount ?? 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    จากการเช็คชื่อทั้งหมด {report.totalAttendanceDays ?? 0} วัน
                  </p>
                </div>
                <div className="w-11 h-11 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 border border-primary-100">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Total Assignments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ภาระงานทั้งหมด</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {report.totalAssignments}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">รายการ</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    งานและแบบฝึกหัดที่ได้รับมอบหมาย
                  </p>
                </div>
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Submitted Assignments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ส่งงานแล้ว</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                      {report.submittedAssignments}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">รายการ</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ส่งงานแล้ว {completionPercent}%
                  </p>
                </div>
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Pending Assignments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">งานค้าง / รอดำเนินการ</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-3xl font-extrabold tracking-tight ${report.pendingAssignments > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {report.pendingAssignments}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">รายการ</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {report.pendingAssignments > 0 ? 'ควรเร่งติดตามการส่งงาน' : 'ไม่มีงานค้างส่ง'}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${report.pendingAssignments > 0
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Progress Bar Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ความก้าวหน้าการส่งการบ้านและแบบฝึกหัด</h3>
                  <p className="text-xs text-slate-500 mt-0.5">ภาพรวมการส่งงานเทียบกับงานทั้งหมดที่ได้รับมอบหมาย</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">ส่งแล้ว ({report.submittedAssignments})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="text-slate-600">รอดำเนินการ ({report.pendingAssignments})</span>
                  </div>
                  <Link
                    href={`/parent/assignments?studentId=${studentId}`}
                    className="text-primary-600 hover:text-primary-700 font-bold inline-flex items-center gap-1 ml-2 transition"
                  >
                    ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-500 rounded-l-full"
                  style={{ width: `${completionPercent}%` }}
                  title={`ส่งแล้ว ${completionPercent}%`}
                ></div>
                <div
                  className="bg-amber-400 transition-all duration-500 rounded-r-full"
                  style={{ width: `${100 - completionPercent}%` }}
                  title={`รอดำเนินการ ${100 - completionPercent}%`}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                <span>อัตราความสำเร็จ: <strong className="text-slate-800">{completionPercent}%</strong></span>
                <span>มอบหมายทั้งหมด: <strong className="text-slate-800">{report.totalAssignments} งาน</strong></span>
              </div>
            </div>

            {/* Split Grid: Recent Assignments & Recent Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Card: Recent Assignments */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 border border-primary-100">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">งานที่มอบหมายล่าสุด</h3>
                      <p className="text-xs text-slate-400">รายการการบ้านและงานที่ต้องส่ง</p>
                    </div>
                  </div>
                  <Link
                    href={`/parent/assignments?studentId=${studentId}`}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition inline-flex items-center gap-0.5"
                  >
                    ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 flex-1">
                  {report.recentAssignments && report.recentAssignments.length > 0 ? (
                    report.recentAssignments.slice(0, 5).map((task: any) => {
                      const isSubmitted = task.status === 'SUBMITTED'
                      const isLateSubmitted = task.status === 'LATE_SUBMITTED'
                      const isOverdue = task.status === 'NOT_SUBMITTED' && new Date(task.dueDate) < new Date()
                      const isPending = task.status === 'NOT_SUBMITTED' && !isOverdue

                      return (
                        <div key={task.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {task.subjectName}
                              </span>
                              <span className="text-xs text-slate-400">
                                กำหนดส่ง: {new Date(task.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ส่งแล้ว
                              </span>
                            ) : isLateSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ส่งช้า
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> เกินกำหนด
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> รอดำเนินการ
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      ไม่พบข้อมูลงานที่มอบหมาย
                    </div>
                  )}
                </div>

                <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 text-center">
                  <Link
                    href={`/parent/assignments?studentId=${studentId}`}
                    className="text-xs font-bold text-slate-600 hover:text-primary-600 transition inline-flex items-center gap-1"
                  >
                    ตรวจสอบงานทั้งหมด ({report.totalAssignments} รายการ)
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card: Recent Attendances */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 border border-primary-100">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">ประวัติการเข้าเรียนล่าสุด</h3>
                      <p className="text-xs text-slate-400">บันทึกการเช็คชื่อเข้าแถวและชั้นเรียน</p>
                    </div>
                  </div>
                  <Link
                    href={`/parent/attendance?studentId=${studentId}`}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition inline-flex items-center gap-0.5"
                  >
                    ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 flex-1">
                  {report.recentAttendances && report.recentAttendances.length > 0 ? (
                    report.recentAttendances.slice(0, 5).map((att: RecentAttendance) => {
                      const parts = att.date ? att.date.split('T')[0].split('-') : []
                      const yNum = parts[0] ? parseInt(parts[0], 10) : 0
                      const mNum = parts[1] ? parseInt(parts[1], 10) - 1 : 0
                      const dNum = parts[2] ? parseInt(parts[2], 10) : 1
                      const dateObj = new Date(yNum, mNum, dNum)
                      const dayName = DAY_MAP[dateObj.getDay()] || '-'
                      const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

                      return (
                        <div key={att.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-600 text-[10px] font-bold border border-slate-200">
                              <span>{dayName}</span>
                              <span className="text-slate-800 text-xs leading-none">{dNum}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{dateStr}</p>
                              {att.note ? (
                                <p className="text-xs text-slate-500 mt-0.5">{att.note}</p>
                              ) : (
                                <p className="text-xs text-slate-400 mt-0.5">ไม่มีหมายเหตุ</p>
                              )}
                            </div>
                          </div>

                          <div>
                            {getAttendanceBadge(att.status)}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      ไม่พบประวัติการเข้าเรียนล่าสุด
                    </div>
                  )}
                </div>

                <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 text-center">
                  <Link
                    href={`/parent/attendance?studentId=${studentId}`}
                    className="text-xs font-bold text-slate-600 hover:text-primary-600 transition inline-flex items-center gap-1"
                  >
                    ดูประวัติการเข้าเรียนทั้งหมด
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
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
