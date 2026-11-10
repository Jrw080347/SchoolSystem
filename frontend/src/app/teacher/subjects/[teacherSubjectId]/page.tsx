'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

interface StudentReport {
  studentId: number
  studentName: string
  studentCode: string
  submittedCount: number
  notSubmittedCount: number
}

interface ClassReport {
  subjectCode: string
  subjectName: string
  classroomName: string
  academicYear: string
  semester: number
  totalStudents: number
  totalAssignments: number
  students: StudentReport[]
}

interface SubjectSchedule {
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

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'จันทร์',
  TUESDAY: 'อังคาร',
  WEDNESDAY: 'พุธ',
  THURSDAY: 'พฤหัสบดี',
  FRIDAY: 'ศุกร์',
}

export default function SubjectDetailPage() {
  const params = useParams()
  const role = Cookies.get('role') || 'TEACHER'
  const fullName = Cookies.get('fullName') || 'ครูผู้สอน'
  const teacherSubjectId = params.teacherSubjectId as string

  const [report, setReport] = useState<ClassReport | null>(null)
  const [subjectSchedule, setSubjectSchedule] = useState<SubjectSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (!teacherSubjectId) return
    fetchData()
  }, [teacherSubjectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reportRes, scheduleRes] = await Promise.all([
        api.get(`/teacher/report/class/${teacherSubjectId}`),
        api.get('/teacher/schedule')
      ])
      setReport(reportRes.data)

      // Find this subject's schedule from the list
      const allSubjects: SubjectSchedule[] = scheduleRes.data || []
      const thisSubject = allSubjects.find((s: any) => String(s.teacherSubjectId) === teacherSubjectId)
      setSubjectSchedule(thisSubject || null)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลรายวิชาได้').message)
    } finally {
      setLoading(false)
    }
  }

  const schedules = subjectSchedule?.schedules || []
  const students = report?.students || []
  const submissionRate = subjectSchedule?.submissionRate || 0
  const totalItems = students.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">กำลังโหลด...</div>
  if (!report) return <div className="flex min-h-screen items-center justify-center text-gray-500">ไม่พบข้อมูลรายวิชา</div>

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Link href="/teacher/schedule" className="hover:text-red-600">แผงควบคุม</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">รายละเอียดวิชา</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{fullName}</p>
              <p className="text-xs text-gray-500">{role === 'HOMEROOM_TEACHER' ? 'ครูประจำชั้น' : 'ครูผู้สอน'}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
              {fullName.charAt(0)}
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">

            {/* Subject Header Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 8.56l-1.22-.522v4.204a2 2 0 001.272 1.856l4 1.714A2 2 0 008 16V10.573L3.31 8.56z" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">{report.subjectCode}</span>
                      <h1 className="text-xl font-bold text-gray-900">{report.subjectName}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        ห้อง {report.classroomName}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {fullName}
                      </span>
                      <span>เทอม {report.semester}/{report.academicYear}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/teacher/schedule"
                  className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  กลับไปแผงควบคุม
                </Link>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column */}
              <div className="flex-[2] space-y-8">

                {/* Student List */}
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                    รายชื่อนักเรียน ({students.length} คน)
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {students.length > 0 ? (
                      <>
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 w-16">เลขที่</th>
                              <th className="px-6 py-3">รหัสนักเรียน</th>
                              <th className="px-6 py-3">ชื่อ-นามสกุล</th>
                              <th className="px-6 py-3 text-center">สถิติส่งงาน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedStudents.map((s: any, idx: number) => {
                              const total = (s.submittedCount || 0) + (s.notSubmittedCount || 0)
                              const pct = total > 0 ? ((s.submittedCount || 0) / total) * 100 : 0
                              return (
                                <tr key={s.studentId} className="hover:bg-gray-50 transition">
                                  <td className="px-6 py-3 text-gray-500 font-medium">{String(startIndex + idx + 1).padStart(2, '0')}</td>
                                  <td className="px-6 py-3 text-gray-600">{s.studentCode}</td>
                                  <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                                        {(s.studentName || '?').substring(0, 2)}
                                      </div>
                                      <span className="font-medium text-gray-900">{s.studentName}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${total > 0 ? pct : 0}%` }}></div>
                                      </div>
                                      <span className="text-xs font-bold text-gray-600 w-10">{total > 0 ? `${s.submittedCount}/${total}` : '-'}</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                          <span>แสดง {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ก่อนหน้า
                            </button>
                            <span className="min-w-20 text-center">หน้า {currentPage} / {totalPages}</span>
                            <button
                              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ถัดไป
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-gray-400">ยังไม่มีนักเรียนในห้องนี้</div>
                    )}
                  </div>
                </section>

              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-6">

                {/* Stats Cards */}
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    สถิติ
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                      <div className="w-11 h-11 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">นักเรียนทั้งหมด</p>
                        <p className="text-xl font-bold text-gray-900">{report.totalStudents} <span className="text-sm font-normal text-gray-400">คน</span></p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                      <div className="w-11 h-11 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">งานมอบหมาย</p>
                        <p className="text-xl font-bold text-gray-900">{report.totalAssignments} <span className="text-sm font-normal text-gray-400">งาน</span></p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-11 h-11 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">อัตราส่งงาน</p>
                          <p className="text-xl font-bold text-gray-900">{report.totalAssignments > 0 ? `${submissionRate}%` : '-'}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${report.totalAssignments > 0 ? submissionRate : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quick Actions */}
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    เมนูจัดการ
                  </h2>
                  <div className="space-y-3">
                    <Link
                      href={`/teacher/assignments/new?teacherSubjectId=${teacherSubjectId}`}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-sm transition group"
                    >
                      <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">สั่งงานใหม่</h3>
                        <p className="text-xs text-gray-500">Create Assignment</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>

                    <Link
                      href={`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-sm transition group"
                    >
                      <div className="w-10 h-10 bg-orange-50 group-hover:bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">จัดการภาระงาน</h3>
                        <p className="text-xs text-gray-500">Manage Assignments</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>

                    <Link
                      href={`/teacher/students?teacherSubjectId=${teacherSubjectId}`}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-sm transition group"
                    >
                      <div className="w-10 h-10 bg-purple-50 group-hover:bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">ดูรายชื่อนักเรียน</h3>
                        <p className="text-xs text-gray-500">View Students</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                </section>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
