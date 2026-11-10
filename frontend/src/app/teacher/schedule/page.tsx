'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import Link from 'next/link'

interface ScheduleBlock {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface TeacherSubject {
  teacherSubjectId: number
  subjectCode: string
  subjectName: string
  classroomName: string
  academicYear: string
  semester: number
  totalStudents: number
  totalAssignments: number
  submissionRate: number
  schedules: ScheduleBlock[]
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'จันทร์',
  TUESDAY: 'อังคาร',
  WEDNESDAY: 'พุธ',
  THURSDAY: 'พฤหัสบดี',
  FRIDAY: 'ศุกร์',
}

const COLORS = [
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', accent: 'bg-red-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', accent: 'bg-emerald-500' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', accent: 'bg-purple-500' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', accent: 'bg-orange-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', accent: 'bg-pink-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', accent: 'bg-cyan-500' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', accent: 'bg-yellow-500' },
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', accent: 'bg-red-500' },
]

// Build time slots from actual schedule data
function buildTimeSlots(subjects: TeacherSubject[]): string[] {
  const timesSet = new Set<string>()
  subjects.forEach(s => {
    s.schedules.forEach(sch => {
      const start = sch.startTime?.substring(0, 5) || ''
      const end = sch.endTime?.substring(0, 5) || ''
      if (start && end) {
        timesSet.add(`${start}-${end}`)
      }
    })
  })
  return Array.from(timesSet).sort()
}

// Map subject to color based on teacherSubjectId
function getColorForSubject(id: number, allIds: number[]) {
  const idx = allIds.indexOf(id)
  return COLORS[idx % COLORS.length]
}

export default function TeacherSchedulePage() {
  const router = useRouter()
  const role = Cookies.get('role') || 'TEACHER'
  const fullName = Cookies.get('fullName') || 'ครูผู้สอน'

  const [subjects, setSubjects] = useState<TeacherSubject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/teacher/schedule')
      setSubjects(res.data || [])
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดตารางสอนได้').message)
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = buildTimeSlots(subjects)
  const allIds = subjects.map(s => s.teacherSubjectId)

  // Build grid data: day -> timeSlot -> subject info
  const grid: Record<string, Record<string, TeacherSubject | null>> = {}
  DAYS.forEach(day => {
    grid[day] = {}
    timeSlots.forEach(slot => {
      grid[day][slot] = null
    })
  })

  subjects.forEach(subject => {
    subject.schedules.forEach(sch => {
      const start = sch.startTime?.substring(0, 5) || ''
      const end = sch.endTime?.substring(0, 5) || ''
      const slot = `${start}-${end}`
      if (grid[sch.dayOfWeek] && timeSlots.includes(slot)) {
        grid[sch.dayOfWeek][slot] = subject
      }
    })
  })

  const dateDisplay = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Stats
  const totalSubjects = subjects.length
  const totalStudents = subjects.reduce((sum, s) => sum + (s.totalStudents || 0), 0)
  const totalAssignments = subjects.reduce((sum, s) => sum + (s.totalAssignments || 0), 0)

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">ตารางสอน</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                <p className="text-xs text-gray-500">
                  {role === 'HOMEROOM_TEACHER' ? 'ครูประจำชั้น' : 'ครูผู้สอน'}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                {fullName.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">

            {/* Welcome */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">สวัสดีค่ะ คุณครู{fullName.split(' ')[0]}!</h2>
              <p className="text-gray-500 mt-1">{dateDisplay}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 8.56l-1.22-.522v4.204a2 2 0 001.272 1.856l4 1.714A2 2 0 008 16V10.573L3.31 8.56z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">วิชาที่สอนทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubjects} <span className="text-sm font-normal text-gray-400">วิชา</span></p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">นักเรียนทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents} <span className="text-sm font-normal text-gray-400">คน</span></p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">งานที่มอบหมาย</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssignments} <span className="text-sm font-normal text-gray-400">งาน</span></p>
                </div>
              </div>
            </div>

            {/* Timetable Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                ตารางสอน
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">กำลังโหลด...</div>
            ) : timeSlots.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="font-medium text-gray-500">ยังไม่มีตารางสอน</p>
                <p className="text-sm">ยังไม่มีรายวิชาที่สอนในระบบ</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-r border-gray-200 w-28">
                          วัน / คาบ
                        </th>
                        {timeSlots.map((slot, i) => (
                          <th key={slot} className="px-3 py-3 text-center text-xs font-bold text-gray-600 border-b border-r border-gray-200 last:border-r-0 min-w-[140px]">
                            <div className="text-gray-400 text-[10px] mb-0.5">คาบที่ {i + 1}</div>
                            <div>{slot}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => (
                        <tr key={day} className="hover:bg-gray-50/50">
                          <td className="px-4 py-4 text-sm font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                            {DAY_LABELS[day]}
                          </td>
                          {timeSlots.map(slot => {
                            const subject = grid[day][slot]
                            if (!subject) {
                              return (
                                <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                  <div className="h-16"></div>
                                </td>
                              )
                            }
                            const color = getColorForSubject(subject.teacherSubjectId, allIds)
                            return (
                              <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                <Link
                                  href={`/teacher/subjects/${subject.teacherSubjectId}`}
                                  className={`block ${color.bg} ${color.border} border rounded-lg p-2.5 h-16 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent} rounded-l-lg`}></div>
                                  <div className="pl-1.5">
                                    <p className={`text-xs font-bold ${color.text} truncate leading-tight`}>{subject.subjectName}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{subject.classroomName}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{subject.subjectCode}</p>
                                  </div>
                                </Link>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subject Legend */}
            {subjects.length > 0 && (
              <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-700 mb-3">รายวิชาที่สอน</h4>
                <div className="flex flex-wrap gap-3">
                  {subjects.map(subject => {
                    const color = getColorForSubject(subject.teacherSubjectId, allIds)
                    return (
                      <Link
                        key={subject.teacherSubjectId}
                        href={`/teacher/subjects/${subject.teacherSubjectId}`}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${color.bg} ${color.border} border hover:shadow-sm transition text-sm`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${color.accent}`}></div>
                        <span className={`font-medium ${color.text}`}>{subject.subjectCode}</span>
                        <span className="text-gray-600">{subject.subjectName}</span>
                        <span className="text-gray-400 text-xs">({subject.classroomName})</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
