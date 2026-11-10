'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import Link from 'next/link'

interface Student {
  id: number
  studentCode: string
  firstName: string
  lastName: string
  fullName?: string
  studentName?: string
}

export default function TeacherStudentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teacherSubjectId = searchParams.get('teacherSubjectId')
  const role = Cookies.get('role') || 'TEACHER'

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectInfo, setSubjectInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (!teacherSubjectId) {
      router.push('/teacher/schedule')
      return
    }
    fetchData()
  }, [teacherSubjectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Get class report to get subject info and students
      const res = await api.get(`/teacher/report/class/${teacherSubjectId}`)
      const data = res.data

      setSubjectInfo({
        subjectCode: data.subjectCode,
        subjectName: data.subjectName,
        classroomName: data.classroomName
      })

      // The report returns studentReports which has the info we need
      setStudents(data.students || [])
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายชื่อนักเรียนได้').message)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s =>
    (s.fullName || s.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalItems = filteredStudents.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, teacherSubjectId])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>
  if (!subjectInfo) return <div className="flex min-h-screen items-center justify-center">ไม่พบข้อมูลรายวิชา</div>

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Link href="/teacher/schedule" className="hover:text-red-600">Home</Link>
            <span className="mx-2">›</span>
            <Link href={`/teacher/subjects/${teacherSubjectId}`} className="hover:text-red-600">Subject Detail</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">Students</span>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">รายชื่อนักเรียน</h1>
              <p className="text-gray-500">
                วิชา {subjectInfo.subjectName} ({subjectInfo.subjectCode}) • ห้อง {subjectInfo.classroomName}
              </p>
            </div>
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium border border-red-100">
              นักเรียนทั้งหมด {students.length} คน
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหารหัสนักเรียน, ชื่อ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 w-64"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 w-16">เลขที่</th>
                    <th className="px-6 py-4">รหัสนักเรียน</th>
                    <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-4 text-center">สถิติการส่งงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student: any, idx: number) => {
                      const totalTasks = student.submittedCount + student.notSubmittedCount
                      const progress = totalTasks > 0 ? (student.submittedCount / totalTasks) * 100 : 0

                      return (
                        <tr key={student.studentId} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-gray-500 font-medium">{String(startIndex + idx + 1).padStart(2, '0')}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{student.studentCode}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={`https://ui-avatars.com/api/?name=${student.studentName || 'Student'}&background=random`} alt="" className="w-8 h-8 rounded-full" />
                              <span className="font-bold text-gray-900">{student.studentName || student.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-32 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${totalTasks > 0 ? progress : 0}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-gray-700 w-12">{totalTasks > 0 ? `${student.submittedCount}/${totalTasks}` : '-'}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        ไม่พบข้อมูลนักเรียน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
              <span>แสดง {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <span className="min-w-20 text-center">หน้า {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
