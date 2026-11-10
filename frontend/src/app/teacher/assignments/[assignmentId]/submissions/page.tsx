'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Link from 'next/link'

interface Submission {
  submissionId: number
  studentId: number
  studentName: string
  studentCode: string
  status: string
  submittedAt: string | null
  score: number | null
  teacherNote: string | null
}

interface AssignmentData {
  id: number
  title: string
  description: string
  dueDate: string
  maxScore: number
  subjectName: string
  classroomName: string
}

export default function SubmissionsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const assignmentId = params.assignmentId
  const teacherSubjectId = searchParams.get('teacherSubjectId')
  const role = Cookies.get('role') || 'TEACHER'

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignment, setAssignment] = useState<AssignmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchSubmissions()
  }, [assignmentId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const res: any = await api.get(`/teacher/assignments/${assignmentId}/submissions`)
      setAssignment(res.data.assignment)
      setSubmissions(res.data.submissions || [])
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลการส่งงานได้').message)
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (subId: number, status: string) => {
    try {
      await api.put(`/teacher/submissions/${subId}`, { status })
      setSubmissions(prev => prev.map(s => s.submissionId === subId ? {
        ...s,
        status,
        submittedAt: (status === 'SUBMITTED' || status === 'LATE_SUBMITTED') && !s.submittedAt
          ? new Date().toISOString()
          : (status === 'NOT_SUBMITTED' ? null : s.submittedAt)
      } : s))
      toast.success('อัปเดตสถานะสำเร็จ')
    } catch (err: any) {
      toast.error(parseApiError(err, 'ไม่สามารถอัปเดตสถานะได้').message)
      fetchSubmissions()
    }
  }

  const markAllFiltered = async (status: string) => {
    const toUpdate = filteredSubmissions.filter(s => s.status !== status)
    if (!toUpdate.length) return
    try {
      await Promise.all(toUpdate.map(s => api.put(`/teacher/submissions/${s.submissionId}`, { status })))
      setSubmissions(prev => prev.map(s => {
        const matched = toUpdate.some(t => t.submissionId === s.submissionId)
        if (!matched) return s
        return {
          ...s,
          status,
          submittedAt: (status === 'SUBMITTED' || status === 'LATE_SUBMITTED') && !s.submittedAt
            ? new Date().toISOString()
            : (status === 'NOT_SUBMITTED' ? null : s.submittedAt)
        }
      }))
      toast.success('อัปเดตสถานะทั้งหมดสำเร็จ')
    } catch (err: any) {
      toast.error(parseApiError(err, 'ไม่สามารถอัปเดตสถานะได้').message)
      fetchSubmissions()
    }
  }

  const statusOptions = [
    {
      key: 'SUBMITTED',
      label: 'ส่งแล้ว',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      selected: 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-bold',
    },
    {
      key: 'LATE_SUBMITTED',
      label: 'ส่งช้า',
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      selected: 'bg-orange-500 text-white border-orange-500 shadow-sm font-bold',
    },
    {
      key: 'NOT_SUBMITTED',
      label: 'ยังไม่ส่ง',
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      selected: 'bg-red-500 text-white border-red-500 shadow-sm font-bold',
    },
  ]

  // Stats calculation
  const total = submissions.length
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED').length
  const lateCount = submissions.filter(s => s.status === 'LATE_SUBMITTED').length
  const notSubmittedCount = submissions.filter(s => s.status === 'NOT_SUBMITTED').length

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (filterStatus === 'SUBMITTED') return s.status === 'SUBMITTED'
    if (filterStatus === 'LATE_SUBMITTED') return s.status === 'LATE_SUBMITTED'
    if (filterStatus === 'NOT_SUBMITTED') return s.status === 'NOT_SUBMITTED'
    return true
  })
  const totalItems = filteredSubmissions.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>
  if (!assignment) return <div className="flex min-h-screen items-center justify-center">ไม่พบข้อมูลภาระงาน</div>

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-[#F8FAFC] px-8 py-6 shrink-0">
          <Link
            href={`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            กลับไปที่รายการภาระงาน
          </Link>

          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 text-sm">
                <span className="text-red-600 font-bold tracking-wide uppercase bg-red-50 px-2 py-0.5 rounded">{assignment.subjectName}</span>
                <span className="text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  กำหนดส่ง: {new Date(assignment.dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{assignment.title}</h1>
              <p className="text-gray-500">การตรวจสอบสถานะการส่งงานแบบละเอียดสำหรับนักเรียนห้อง {assignment.classroomName} สรุปข้อมูลการส่งและประเมินผลเบื้องต้น</p>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 xl:pb-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-[120px]">
                <p className="text-xs font-semibold text-gray-500 mb-1">นักเรียนทั้งหมด</p>
                <p className="text-3xl font-black text-gray-900">{total}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-[120px]">
                <p className="text-xs font-semibold text-gray-500 mb-1">ส่งแล้ว</p>
                <p className="text-3xl font-black text-emerald-500">{submittedCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-[120px]">
                <p className="text-xs font-semibold text-gray-500 mb-1">ส่งช้า</p>
                <p className="text-3xl font-black text-orange-500">{lateCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-[120px]">
                <p className="text-xs font-semibold text-gray-500 mb-1">ยังไม่ส่ง</p>
                <p className="text-3xl font-black text-red-500">{notSubmittedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหารหัสนักเรียน หรือ ชื่อ-นามสกุล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full md:w-80"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="text-xs text-gray-400 mr-1 hidden lg:inline">กรอง:</span>
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition ${filterStatus === 'ALL' ? 'bg-red-600 border-red-600 text-white font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setFilterStatus('SUBMITTED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition ${filterStatus === 'SUBMITTED' ? 'bg-red-600 border-red-600 text-white font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ส่งแล้ว ({submittedCount})
                </button>
                <button
                  onClick={() => setFilterStatus('LATE_SUBMITTED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition ${filterStatus === 'LATE_SUBMITTED' ? 'bg-red-600 border-red-600 text-white font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ส่งช้า ({lateCount})
                </button>
                <button
                  onClick={() => setFilterStatus('NOT_SUBMITTED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition ${filterStatus === 'NOT_SUBMITTED' ? 'bg-red-600 border-red-600 text-white font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ยังไม่ส่ง ({notSubmittedCount})
                </button>
                <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
                <span className="text-xs text-gray-400 mr-1 hidden sm:inline">เลือกทั้งหมด:</span>
                <button
                  type="button"
                  onClick={() => markAllFiltered('SUBMITTED')}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs hover:bg-emerald-100 transition font-medium"
                >
                  ส่งแล้วทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => markAllFiltered('NOT_SUBMITTED')}
                  className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs hover:bg-red-100 transition font-medium"
                >
                  ยังไม่ส่งทั้งหมด
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 w-16">เลขที่</th>
                    <th className="px-6 py-4">รหัสนักเรียน</th>
                    <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-4">วันที่/เวลาส่ง</th>
                    <th className="px-6 py-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSubmissions.length > 0 ? (
                    paginatedSubmissions.map((sub, idx) => (
                      <tr key={sub.submissionId} className="hover:bg-gray-50/80 transition group">
                        <td className="px-6 py-4 font-bold text-gray-900">{String(startIndex + idx + 1).padStart(2, '0')}</td>
                        <td className="px-6 py-4 text-gray-500">{sub.studentCode}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {sub.studentName.substring(0, 2)}
                            </div>
                            <span className="font-bold text-gray-900">{sub.studentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {sub.submittedAt ? (
                            <span>
                              {new Date(sub.submittedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })} |
                              {' '}{new Date(sub.submittedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => updateSubmissionStatus(sub.submissionId, opt.key)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                                  sub.status === opt.key ? opt.selected : opt.color
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูลนักเรียนที่ตรงกับการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p>แสดง {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <span className="min-w-20 text-center">หน้า {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
