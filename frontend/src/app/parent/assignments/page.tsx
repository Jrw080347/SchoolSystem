'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ParentNavbar from '@/components/ParentNavbar'
import api from '@/lib/api'
import Link from 'next/link'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react'

interface Assignment {
  assignmentId: number
  title: string
  description: string
  subjectName: string
  assignedDate: string
  dueDate: string
  maxScore: number
  status: string
  score: number | null
  submittedAt: string | null
}

export default function ParentAssignmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get('studentId')

  const [studentId, setStudentId] = useState<number | null>(() => {
    if (studentIdParam) return Number(studentIdParam)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedStudentId') : null
    return saved ? Number(saved) : null
  })

  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null)
  const itemsPerPage = 15

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
      const [resAssign, resInfo] = await Promise.all([
        api.get(`/parent/students/${id}/assignments`),
        api.get(`/parent/students/${id}/info`)
      ])
      setAssignments(resAssign.data || [])
      setStudentInfo(resInfo.data || null)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลการบ้านได้').message)
    } finally {
      setLoading(false)
    }
  }

  // Derived state for filters
  const uniqueSubjects = Array.from(new Set(assignments.map(a => a.subjectName).filter(Boolean)))

  const filteredAssignments = assignments.filter(a => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchTitle = a.title?.toLowerCase().includes(query)
      const matchSubject = a.subjectName?.toLowerCase().includes(query)
      const matchDesc = a.description?.toLowerCase().includes(query)
      if (!matchTitle && !matchSubject && !matchDesc) return false
    }

    // Subject filter
    if (subjectFilter !== 'all' && a.subjectName !== subjectFilter) return false

    // Status filter
    if (statusFilter !== 'all') {
      const isSubmitted = a.status === 'SUBMITTED'
      const isLateSubmitted = a.status === 'LATE_SUBMITTED'
      const isOverdue = a.status === 'NOT_SUBMITTED' && new Date(a.dueDate) < new Date()
      const isPending = a.status === 'NOT_SUBMITTED' && !isOverdue

      if (statusFilter === 'SUBMITTED' && !isSubmitted) return false
      if (statusFilter === 'LATE' && !isLateSubmitted) return false
      if (statusFilter === 'OVERDUE' && !isOverdue) return false
      if (statusFilter === 'PENDING' && !isPending) return false
    }

    return true
  }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  // Pagination Logic
  const totalItems = filteredAssignments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [subjectFilter, statusFilter, searchQuery, studentId])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // Stats (on all assignments)
  const pendingCount = assignments.filter(a => a.status === 'NOT_SUBMITTED' && new Date(a.dueDate) >= new Date()).length
  const overdueCount = assignments.filter(a => a.status === 'NOT_SUBMITTED' && new Date(a.dueDate) < new Date()).length
  const lateSubmittedCount = assignments.filter(a => a.status === 'LATE_SUBMITTED').length
  const submittedCount = assignments.filter(a => a.status === 'SUBMITTED').length
  const thisWeekCount = assignments.filter(a => {
    const due = new Date(a.dueDate)
    const now = new Date()
    const diff = (due.getTime() - now.getTime()) / (1000 * 3600 * 24)
    return diff >= 0 && diff <= 7
  }).length

  if (loading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลการบ้าน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 text-slate-900">
      <ParentNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
              <Link href="/parent/dashboard" className="hover:text-primary-600 transition">หน้าหลัก</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">สถานะการส่งงาน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">สถานะการส่งงาน</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              ติดตามการบ้าน แบบฝึกหัด และกำหนดเวลาส่งงานของ {studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName} (ห้อง ${studentInfo.classroomName})` : 'นักเรียน'}
            </p>
          </div>

          <Link
            href="/parent/students"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>เปลี่ยนนักเรียน</span>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">รอดำเนินการ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">{pendingCount}</p>
              <p className="text-xs text-slate-400 mt-1">ยังไม่ถึงกำหนดส่ง</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">เกินกำหนด</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">{overdueCount}</p>
              <p className="text-xs text-slate-400 mt-1">เลยกำหนดเวลา</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ส่งช้า</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 tracking-tight">{lateSubmittedCount}</p>
              <p className="text-xs text-slate-400 mt-1">ส่งหลังกำหนด</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ส่งแล้ว</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">{submittedCount}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">เรียบร้อยแล้ว</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between col-span-2 md:col-span-1">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">จำนวนงานในสัปดาห์นี้</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-700 tracking-tight">{thisWeekCount}</p>

            </div>
            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 border border-primary-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Assignments Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* Header & Filter Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 border border-primary-100">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">รายการงานและแบบฝึกหัด</h3>
                <p className="text-xs text-slate-400">ค้นหาและกรองตามวิชาหรือสถานะ</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 sm:flex-initial sm:w-48">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหางาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                />
              </div>

              {/* Subject Filter */}
              <div className="relative flex-1 sm:flex-initial sm:w-40">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                >
                  <option value="all">ทุกรายวิชา</option>
                  {uniqueSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative flex-1 sm:flex-initial sm:w-36">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="OVERDUE">เกินกำหนด</option>
                  <option value="LATE">ส่งช้า</option>
                  <option value="SUBMITTED">ส่งแล้ว</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Reset filter button */}
              {(subjectFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '') && (
                <button
                  onClick={() => {
                    setSubjectFilter('all')
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
                <tr>
                  <th className="px-6 py-3.5 w-[15%]">รหัสวิชา</th>
                  <th className="px-6 py-3.5 w-[30%]">หัวข้องาน</th>
                  <th className="px-6 py-3.5 w-[20%]">วันที่มอบหมาย</th>
                  <th className="px-6 py-3.5 w-[20%]">กำหนดส่ง</th>
                  <th className="px-6 py-3.5 w-[15%]">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAssignments.length > 0 ? (
                  paginatedAssignments.map((task: Assignment) => {
                    const isSubmitted = task.status === 'SUBMITTED'
                    const isLateSubmitted = task.status === 'LATE_SUBMITTED'
                    const isOverdue = task.status === 'NOT_SUBMITTED' && new Date(task.dueDate) < new Date()
                    const isPending = task.status === 'NOT_SUBMITTED' && !isOverdue

                    const code = `SJ${100 + (task.assignmentId % 100)}`

                    return (
                      <tr
                        key={task.assignmentId}
                        onClick={() => setSelectedTask(task)}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="bg-primary-50 text-primary-700 border border-primary-100 font-bold px-2.5 py-1 rounded-lg text-xs">
                            {code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 truncate max-w-sm hover:text-primary-600 transition">{task.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{task.subjectName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs sm:text-sm">
                            {task.assignedDate ? new Date(task.assignedDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs sm:text-sm">
                            {isPending && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {new Date(task.dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto text-center">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                        <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองวิชาและสถานะ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 text-xs sm:text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
            <span>
              แสดง {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} จากทั้งหมด {totalItems} รายการ
            </span>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1
                const isActive = page === currentPage
                if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400">...</span>
                  return null
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition text-xs font-bold ${isActive
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium inline-flex items-center gap-1"
              >
                ถัดไป
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="bg-primary-50 text-primary-700 border border-primary-100 font-bold px-2 py-0.5 rounded text-xs">
                    {selectedTask.subjectName}
                  </span>
                  <span className="text-xs text-slate-400">รายละเอียดงาน</span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedTask.title}</h4>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedTask.description || 'ไม่มีคำอธิบายรายละเอียดสำหรับงานนี้'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">วันที่มอบหมาย</span>
                    <strong className="text-slate-800 text-sm">
                      {selectedTask.assignedDate ? new Date(selectedTask.assignedDate).toLocaleDateString('th-TH') : '-'}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">กำหนดส่ง</span>
                    <strong className="text-slate-800 text-sm">
                      {new Date(selectedTask.dueDate).toLocaleDateString('th-TH')}
                    </strong>
                  </div>
                </div>

                {selectedTask.submittedAt && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ส่งงานเมื่อ: {new Date(selectedTask.submittedAt).toLocaleString('th-TH')}</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedTask(null)}
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
