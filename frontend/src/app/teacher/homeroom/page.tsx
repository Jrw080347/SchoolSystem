'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'

interface Student {
  id: number
  studentCode: string
  firstName: string
  lastName: string
  fullName: string
}

interface HomeroomDetails {
  classroomId: number
  classroomName: string
  totalStudents: number
  students: Student[]
}

interface AttendanceRecord {
  studentId: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  note: string
}

export default function HomeroomAttendancePage() {
  const role = Cookies.get('role') || 'HOMEROOM_TEACHER'

  const [details, setDetails] = useState<HomeroomDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Mapping studentId -> AttendanceRecord
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceRecord>>({})

  const todayDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const [currentDate] = useState(todayDate)

  useEffect(() => {
    fetchHomeroom()
  }, [])

  const fetchHomeroom = async () => {
    try {
      setLoading(true)
      const res = await api.get('/teacher/homeroom')
      const data = res.data
      setDetails(data)

      // Fetch existing attendance for today
      try {
        const attRes = await api.get(`/teacher/attendance?classroomId=${data.classroomId}&date=${currentDate}`)
        const existingRecords = attRes.data || []

        const initialMap: Record<number, AttendanceRecord> = {}

        // Default all to PRESENT
        data.students.forEach((s: Student) => {
          initialMap[s.id] = { studentId: s.id, status: 'PRESENT', note: '' }
        })

        // Override with existing
        existingRecords.forEach((r: any) => {
          if (initialMap[r.studentId]) {
            initialMap[r.studentId] = {
              studentId: r.studentId,
              status: r.status as any,
              note: r.note || ''
            }
          }
        })

        setAttendanceMap(initialMap)
      } catch (err) {
        toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลการเข้าเรียนเดิมได้').message)
        const initialMap: Record<number, AttendanceRecord> = {}
        data.students.forEach((s: Student) => {
          initialMap[s.id] = { studentId: s.id, status: 'PRESENT', note: '' }
        })
        setAttendanceMap(initialMap)
      }
    } catch (err: any) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลห้องเรียนได้').message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleNoteChange = (studentId: number, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }))
  }

  const handleSave = async () => {
    if (!details) return
    try {
      setSaving(true)
      const payload = {
        classroomId: details.classroomId,
        date: currentDate,
        attendances: Object.values(attendanceMap)
      }
      await api.post('/teacher/attendance', payload)
      toast.success('บันทึกการเช็คชื่อเรียบร้อยแล้ว')
    } catch (err: any) {
      toast.error(parseApiError(err, 'เกิดข้อผิดพลาดในการบันทึก').message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredStudents = details?.students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentCode.includes(searchTerm)
  ) || []
  const totalItems = filteredStudents.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>

  if (!details) return (
    <div className="flex min-h-screen font-sans bg-gray-50">
      <Sidebar role={role} />
      <div className="flex-1 flex items-center justify-center text-gray-500">
        คุณไม่ได้เป็นครูประจำชั้นของห้องใดเลย
      </div>
    </div>
  )

  const summary = Object.values(attendanceMap).reduce((acc, curr) => {
    if (curr.status === 'PRESENT') acc.present++
    if (curr.status === 'ABSENT') acc.absent++
    if (curr.status === 'LATE') acc.late++
    if (curr.status === 'EXCUSED') acc.excused++
    return acc
  }, { present: 0, absent: 0, late: 0, excused: 0 })

  const dateDisplay = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Link href="/teacher/schedule" className="hover:text-red-600">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <span className="hover:text-red-600 cursor-pointer">ห้องเรียน</span>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">บันทึกการเข้าเรียนรายวัน</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{dateDisplay}</span>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full pb-32">

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{details.classroomName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {dateDisplay}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    นักเรียนทั้งหมด {details.totalStudents} คน
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-center border border-green-100">
                <div className="text-xs font-medium">มา</div>
                <div className="text-2xl font-bold">{summary.present}</div>
              </div>
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-center border border-red-100">
                <div className="text-xs font-medium">ขาด</div>
                <div className="text-2xl font-bold">{summary.absent}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อนักเรียน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 w-64"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button
                onClick={() => {
                  const map = { ...attendanceMap }
                  filteredStudents.forEach(s => {
                    map[s.id] = { ...map[s.id], status: 'PRESENT' }
                  })
                  setAttendanceMap(map)
                }}
                className="text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
              >
                มาทั้งหมด
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 w-16">เลขที่</th>
                    <th className="px-6 py-4">นักเรียน</th>
                    <th className="px-6 py-4 w-96 text-center">สถานะ</th>
                    <th className="px-6 py-4">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedStudents.length > 0 ? paginatedStudents.map((student, idx) => {
                    const record = attendanceMap[student.id]
                    if (!record) return null

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-500 font-medium">{String(startIndex + idx + 1).padStart(2, '0')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=${student.firstName}&background=random`} alt="" className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="font-bold text-gray-900">{student.fullName}</p>
                              <p className="text-xs text-gray-500">ID: {student.studentCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusChange(student.id, 'PRESENT')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${record.status === 'PRESENT' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> มา
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'ABSENT')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${record.status === 'ABSENT' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> ขาด
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'LATE')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${record.status === 'LATE' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> สาย
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${record.status === 'EXCUSED' ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> ลา
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="เพิ่มหมายเหตุ..."
                            value={record.note}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-red-400 transition"
                          />
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        ไม่พบข้อมูลนักเรียน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                <span>แสดง {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
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
            )}
          </div>

        </div>

        {/* Bottom Fixed Action Bar */}
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-8 py-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="flex items-center gap-6 text-sm font-medium">
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> มาเรียน {summary.present} คน</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> ขาดเรียน {summary.absent} คน</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> สาย {summary.late} คน</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div> ลา {summary.excused} คน</span>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">ยกเลิก</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเช็คชื่อ'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
