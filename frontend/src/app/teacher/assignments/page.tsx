'use client'

import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface Assignment {
  id: number
  title: string
  description: string
  assignedDate: string
  dueDate: string
  maxScore: number
  subjectName: string
  classroomName: string
  totalStudents: number
  submittedCount: number
  notSubmittedCount: number
}

interface SubjectInfo {
  subjectCode: string
  subjectName: string
  classroomName: string
  academicYear: string
  semester: number
  totalStudents: number
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjectInfo, setSubjectInfo] = useState<SubjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'due'>('all')

  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; title: string }>({
    show: false,
    id: null,
    title: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const role = Cookies.get('role') || 'TEACHER'
  const fullName = Cookies.get('fullName') || 'ครูผู้สอน'
  const searchParams = useSearchParams()
  const router = useRouter()
  const teacherSubjectId = searchParams.get('teacherSubjectId')

  useEffect(() => {
    if (!teacherSubjectId) {
      router.push('/teacher/schedule')
      return
    }

    fetchData()
  }, [teacherSubjectId])

  useEffect(() => {
    setCurrentPage(1)
  }, [teacherSubjectId, searchTerm, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assignmentsRes, reportRes] = await Promise.all([
        api.get(`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`),
        api.get(`/teacher/report/class/${teacherSubjectId}`).catch(() => ({ data: null })),
      ])

      const list: Assignment[] = assignmentsRes.data || []
      setAssignments(list)

      if (reportRes?.data) {
        setSubjectInfo({
          subjectCode: reportRes.data.subjectCode,
          subjectName: reportRes.data.subjectName,
          classroomName: reportRes.data.classroomName,
          academicYear: reportRes.data.academicYear,
          semester: reportRes.data.semester,
          totalStudents: reportRes.data.totalStudents || 0,
        })
      } else if (list.length > 0) {
        setSubjectInfo({
          subjectCode: '',
          subjectName: list[0].subjectName,
          classroomName: list[0].classroomName,
          academicYear: '',
          semester: 1,
          totalStudents: list[0].totalStudents || 0,
        })
      }
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลภาระงานได้').message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (id: number, title: string) => {
    setDeleteModal({ show: true, id, title })
  }

  const executeDelete = async () => {
    if (!deleteModal.id) return
    try {
      setIsDeleting(true)
      await api.delete(`/teacher/assignments/${deleteModal.id}`)
      setAssignments((prev) => prev.filter((a) => a.id !== deleteModal.id))
      toast.success('ลบข้อมูลภาระงานสำเร็จ')
      setDeleteModal({ show: false, id: null, title: '' })
    } catch (err) {
      toast.error(parseApiError(err, 'เกิดข้อผิดพลาดในการลบงาน').message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats calculation
  const totalAssignments = assignments.length
  const totalPossible = assignments.reduce((acc, a) => acc + (a.totalStudents || 0), 0)
  const totalSubmitted = assignments.reduce((acc, a) => acc + (a.submittedCount || 0), 0)
  const avgSubmissionRate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeAssignmentsCount = assignments.filter((a) => {
    if (!a.dueDate) return true
    const due = new Date(a.dueDate)
    due.setHours(23, 59, 59, 999)
    return due >= now
  }).length

  const dueAssignmentsCount = totalAssignments - activeAssignmentsCount

  // Filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchSearch) return false

      if (filterStatus === 'active') {
        if (!a.dueDate) return true
        const due = new Date(a.dueDate)
        due.setHours(23, 59, 59, 999)
        return due >= now
      }
      if (filterStatus === 'due') {
        if (!a.dueDate) return false
        const due = new Date(a.dueDate)
        due.setHours(23, 59, 59, 999)
        return due < now
      }
      return true
    })
  }, [assignments, searchTerm, filterStatus])

  const totalItems = filteredAssignments.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Link href="/teacher/schedule" className="hover:text-red-600 transition">
              แผงควบคุม
            </Link>
            <span className="mx-2">›</span>
            {teacherSubjectId ? (
              <Link href={`/teacher/subjects/${teacherSubjectId}`} className="hover:text-red-600 transition">
                รายละเอียดวิชา
              </Link>
            ) : (
              <span className="text-gray-400">รายละเอียดวิชา</span>
            )}
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">ภาระงานทั้งหมด</span>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Content Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full space-y-6">

            {/* Subject Header Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {subjectInfo?.subjectCode && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                          {subjectInfo.subjectCode}
                        </span>
                      )}
                      <h1 className="text-xl font-bold text-gray-900">
                        {subjectInfo?.subjectName || 'ภาระงานทั้งหมด'}
                      </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500">
                      {subjectInfo?.classroomName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          ห้อง {subjectInfo.classroomName}
                        </span>
                      )}
                      {subjectInfo?.semester && subjectInfo?.academicYear && (
                        <span>เทอม {subjectInfo.semester}/{subjectInfo.academicYear}</span>
                      )}
                      <span>•</span>
                      <span className="text-gray-600">จัดการภาระงานและตรวจสอบการส่งงานของนักเรียน</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/teacher/subjects/${teacherSubjectId}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    กลับหน้ารายละเอียดวิชา
                  </Link>
                  <Link
                    href={`/teacher/assignments/new?teacherSubjectId=${teacherSubjectId}`}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition shadow-sm text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    สั่งงานใหม่
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">ภาระงานทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalAssignments} <span className="text-sm font-normal text-gray-400">งาน</span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">อัตราการส่งงานรวม</p>
                  <p className="text-2xl font-bold text-gray-900">{avgSubmissionRate}%</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">กำลังเปิดรับงาน</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeAssignmentsCount} <span className="text-sm font-normal text-gray-400">งาน</span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">ครบกำหนดส่งแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dueAssignmentsCount} <span className="text-sm font-normal text-gray-400">งาน</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assignments List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อภาระงาน หรือรายละเอียด..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 w-64 md:w-80"
                    />
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-md transition ${
                        filterStatus === 'all'
                          ? 'bg-white text-gray-900 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      ทั้งหมด ({totalAssignments})
                    </button>
                    <button
                      onClick={() => setFilterStatus('active')}
                      className={`px-3 py-1.5 rounded-md transition ${
                        filterStatus === 'active'
                          ? 'bg-white text-gray-900 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      กำลังเปิดรับ ({activeAssignmentsCount})
                    </button>
                    <button
                      onClick={() => setFilterStatus('due')}
                      className={`px-3 py-1.5 rounded-md transition ${
                        filterStatus === 'due'
                          ? 'bg-white text-gray-900 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      ครบกำหนดแล้ว ({dueAssignmentsCount})
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  แสดง {filteredAssignments.length} จาก {totalAssignments} ภาระงาน
                </div>
              </div>

              {/* List Content */}
              {loading ? (
                <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm">กำลังโหลดข้อมูลภาระงาน...</p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {searchTerm || filterStatus !== 'all' ? 'ไม่พบภาระงานที่ตรงตามเงื่อนไข' : 'ยังไม่มีภาระงานในวิชานี้'}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                    {searchTerm || filterStatus !== 'all'
                      ? 'ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูภาระงานทั้งหมด'
                      : 'เริ่มต้นสร้างภาระงานแรก เพื่อมอบหมายงานและติดตามการส่งงานของนักเรียน'}
                  </p>
                  {searchTerm || filterStatus !== 'all' ? (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setFilterStatus('all')
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  ) : (
                    <Link
                      href={`/teacher/assignments/new?teacherSubjectId=${teacherSubjectId}`}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      + สร้างงานใหม่
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paginatedAssignments.map((a) => {
                    const isDue = a.dueDate && new Date(a.dueDate) < now
                    const pct = a.totalStudents > 0 ? Math.round((a.submittedCount / a.totalStudents) * 100) : 0

                    return (
                      <div
                        key={a.id}
                        className="p-6 hover:bg-gray-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                      >
                        {/* Info Section */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/teacher/assignments/${a.id}/submissions?teacherSubjectId=${teacherSubjectId}`}
                                className="font-bold text-gray-900 text-base hover:text-red-600 transition truncate"
                              >
                                {a.title}
                              </Link>
                              {a.maxScore != null && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
                                  {a.maxScore} คะแนน
                                </span>
                              )}
                              {isDue ? (
                                <span className="bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2 py-0.5 rounded-full font-medium">
                                  ครบกำหนดแล้ว
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">
                                  กำลังเปิดรับ
                                </span>
                              )}
                            </div>

                            {a.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {a.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                สั่งเมื่อ: {formatDate(a.assignedDate)}
                              </span>
                              <span>•</span>
                              <span className={`flex items-center gap-1 ${isDue ? 'text-orange-600 font-medium' : ''}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                กำหนดส่ง: {formatDate(a.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress & Actions Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0 pl-16 lg:pl-0">
                          {/* Progress indicator */}
                          <div className="sm:w-48">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-gray-500">การส่งงาน</span>
                              <span className="font-bold text-gray-900">
                                {a.submittedCount}/{a.totalStudents} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/teacher/assignments/${a.id}/submissions?teacherSubjectId=${teacherSubjectId}`}
                              className="px-4 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5 group"
                            >
                              <svg className="w-4 h-4 text-red-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              ตรวจสอบการส่ง
                            </Link>

                            <Link
                              href={`/teacher/assignments/${a.id}/edit?teacherSubjectId=${teacherSubjectId}`}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                              title="แก้ไขภาระงาน"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Link>

                            <button
                              onClick={() => confirmDelete(a.id, a.title)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="ลบภาระงาน"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination footer */}
              {!loading && totalItems > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 bg-gray-50/50">
                  <span>
                    แสดง {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium shadow-sm transition"
                    >
                      ก่อนหน้า
                    </button>
                    <span className="min-w-20 text-center text-xs font-medium">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium shadow-sm transition"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setDeleteModal({ show: false, id: null, title: '' })}
            ></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบภาระงาน</h3>
                </div>

                <p className="text-gray-700 mb-4">
                  คุณแน่ใจหรือไม่ว่าต้องการลบภาระงาน <span className="font-bold">"{deleteModal.title}"</span>?
                </p>

                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p>การดำเนินการนี้จะทำให้ข้อมูลการส่งงานของนักเรียนในงานชิ้นนี้หายไปด้วยทั้งหมด และไม่สามารถกู้คืนได้</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal({ show: false, id: null, title: '' })}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                  {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
