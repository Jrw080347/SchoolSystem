'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import Cookies from 'js-cookie'
import { parseApiError } from '@/lib/notificationErrors'

interface StudentAttendance {
  studentId: number
  studentName: string
  studentCode: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  note: string
}

export default function TeacherAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const role = Cookies.get('role') || 'TEACHER'

  useEffect(() => {
    // Load students for current class (teacherSubjectId=1 as example)
    api.get('/teacher/students?classroomId=1').then((res: any) => {
      const data = (res.data || []).map((s: any) => ({
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentCode: s.studentCode,
        status: 'PRESENT' as const,
        note: ''
      }))
      setStudents(data)
    }).catch((err) => {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายชื่อนักเรียนได้').message)
    })
  }, [])

  const updateStatus = (studentId: number, status: StudentAttendance['status']) => {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s))
  }

  const markAll = (status: StudentAttendance['status']) => {
    setStudents(prev => prev.map(s => ({ ...s, status })))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/teacher/attendance', {
        teacherSubjectId: 1,
        date,
        attendances: students.map(s => ({ studentId: s.studentId, status: s.status, note: s.note }))
      })
      toast.success('บันทึกการเช็คชื่อเรียบร้อยแล้ว')
    } catch (err) {
      toast.error(parseApiError(err, 'เกิดข้อผิดพลาดในการบันทึก').message)
    } finally {
      setSaving(false)
    }
  }

  const statusConfig = {
    PRESENT: { label: 'มา', color: 'bg-green-100 text-green-700 border-green-300', selected: 'bg-green-500 text-white' },
    ABSENT: { label: 'ขาด', color: 'bg-red-100 text-red-700 border-red-300', selected: 'bg-red-500 text-white' },
    LATE: { label: 'สาย', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', selected: 'bg-yellow-500 text-white' },
    EXCUSED: { label: 'ลา', color: 'bg-red-100 text-red-700 border-red-300', selected: 'bg-red-500 text-white' },
  }

  const presentCount = students.filter(s => s.status === 'PRESENT').length
  const absentCount = students.filter(s => s.status === 'ABSENT').length
  const totalItems = students.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">บันทึกการเช็คชื่อ</h1>
            <p className="text-gray-500 mt-1">บันทึกการเข้าเรียนของนักเรียนรายวัน</p>
          </div>
          <div className="flex items-center gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            <button onClick={handleSave} disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2 rounded-lg font-medium transition">
              {saving ? 'กำลังบันทึก...' : ' บันทึก'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'ทั้งหมด', value: students.length, color: 'text-gray-700' },
            { label: 'มาเรียน', value: presentCount, color: 'text-green-600' },
            { label: 'ขาดเรียน', value: absentCount, color: 'text-red-600' },
            { label: 'สาย/ลา', value: students.length - presentCount - absentCount, color: 'text-yellow-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <span className="text-sm text-gray-500 mr-2 self-center">เลือกทั้งหมด:</span>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => markAll(key as any)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${cfg.color}`}>
              {cfg.label}ทั้งหมด
            </button>
          ))}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">รหัส</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">สถานะ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map((s, idx) => (
                <tr key={s.studentId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-500">{startIndex + idx + 1}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.studentCode}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{s.studentName}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 justify-center">
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button key={key}
                          onClick={() => updateStatus(s.studentId, key as any)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                            s.status === key ? cfg.selected : cfg.color
                          }`}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input value={s.note}
                      onChange={e => setStudents(prev => prev.map(st => st.studentId === s.studentId ? {...st, note: e.target.value} : st))}
                      className="text-sm w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-red-400"
                      placeholder="หมายเหตุ..." />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-400">ไม่พบรายชื่อนักเรียน</p>
            </div>
          )}
          {totalItems > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
              <span>แสดง {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
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
          )}
        </div>
      </main>
    </div>
  )
}
