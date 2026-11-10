'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import { School } from 'lucide-react'

interface Classroom {
  id: number
  name: string
  gradeLevel: number
  roomNumber: string
  academicYear: string
  homeroomTeacherId: number | null
  homeroomTeacherName: string
  studentCount: number
  maxStudents: number
}

interface Teacher {
  id: number
  firstName: string
  lastName: string
  role: string
}

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ gradeLevel: 1, roomNumber: '', academicYear: '2568', homeroomTeacherId: '', maxStudents: 30 })
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const role = Cookies.get('role') || 'ADMIN'

  const [showPromoteConfirmModal, setShowPromoteConfirmModal] = useState(false)
  const [isPromotingAll, setIsPromotingAll] = useState(false)

  const handlePromoteAll = async () => {
    setIsPromotingAll(true)
    try {
      const res: any = await api.post('/admin/classrooms/promote-all')
      toast.success(res.data?.message || 'เลื่อนชั้นเรียนทั้งโรงเรียนเรียบร้อยแล้ว')
      setShowPromoteConfirmModal(false)
      const updated: any = await api.get('/admin/classrooms')
      setClassrooms(updated.data || [])
    } catch (err) {
      toast.error(parseApiError(err, 'การเลื่อนชั้นล้มเหลว').message)
    } finally {
      setIsPromotingAll(false)
    }
  }

  const clearFieldError = (field: string) => setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  const fieldError = (field: string) => fieldErrors[field] && <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-600">{fieldErrors[field]}</p>
  const fieldClass = (field: string) => fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
  const fieldAttrs = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined })

  const showFieldErrors = (errors: Record<string, string>) => {
    const mapped = Object.fromEntries(Object.entries(errors).map(([key, value]) => [key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key, value]))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['roomnumber', 'academicyear', 'maxstudents'].includes(key)))
    if (!Object.keys(known).length) return false
    setFieldErrors(known)
    return true
  }

  const showSubmitError = (err: unknown) => {
    const parsed = parseApiError(err)
    if (!showFieldErrors(parsed.fieldErrors)) toast.error(parsed.message)
  }

  useEffect(() => {
    api.get('/admin/classrooms').then((res: any) => setClassrooms(res.data || [])).catch(err => {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลห้องเรียนได้').message)
    })
    Promise.all([
      api.get('/admin/users?role=TEACHER'),
      api.get('/admin/users?role=HOMEROOM_TEACHER')
    ]).then(([teacherRes, homeroomRes]: any) => {
      const combined = [...(teacherRes.data || []), ...(homeroomRes.data || [])]
      const uniqueTeachers = Array.from(new Map(combined.map((t: Teacher) => [t.id, t])).values())
      setTeachers(uniqueTeachers)
    }).catch(err => {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายชื่อครูได้').message)
    })
  }, [])

  const generatedName = `ป.${form.gradeLevel}/${form.roomNumber}`

  const resetForm = () => {
    setForm({ gradeLevel: 1, roomNumber: '', academicYear: '2568', homeroomTeacherId: '', maxStudents: 30 })
    setEditingId(null)
    setFieldErrors({})
    setShowForm(false)
  }

  const openEdit = (c: Classroom) => {
    setEditingId(c.id)
    setFieldErrors({})
    setForm({ gradeLevel: c.gradeLevel, roomNumber: c.roomNumber || '', academicYear: c.academicYear, homeroomTeacherId: c.homeroomTeacherId ? String(c.homeroomTeacherId) : '', maxStudents: c.maxStudents || 30 })
    setShowForm(true)
  }

  const validateRoom = (roomNumber: string, academicYear: string, maxStudents: number) => {
    const errors: Record<string, string> = {}
    if (!roomNumber || Number(roomNumber) < 1) errors.roomnumber = !roomNumber ? 'กรุณาระบุหมายเลขห้อง' : 'หมายเลขห้องต้องเป็นเลข 1 ขึ้นไป'
    if (!academicYear.trim()) errors.academicyear = 'กรุณาระบุปีการศึกษา'
    if (maxStudents < 1) errors.maxstudents = 'จำนวนนักเรียนสูงสุดต้องเป็นอย่างน้อย 1 คน'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    if (!validateRoom(form.roomNumber, form.academicYear, form.maxStudents)) return
    if (isClassroomNameDuplicate(generatedName, form.academicYear, editingId)) {
      setFieldErrors({ roomnumber: `ห้อง ${generatedName} มีอยู่ในระบบแล้ว` })
      return
    }
    try {
      const payload = { ...form, name: generatedName, homeroomTeacherId: form.homeroomTeacherId ? Number(form.homeroomTeacherId) : null, maxStudents: form.maxStudents }
      const res: any = await api.put(`/admin/classrooms/${editingId}`, payload)
      setClassrooms(prev => prev.map(c => c.id === editingId ? res.data : c))
      toast.success('แก้ไขห้องเรียนเรียบร้อยแล้ว')
      resetForm()
    } catch (err) {
      showSubmitError(err)
    }
  }

  const currentHomeroomTeacherId = editingId ? classrooms.find(c => c.id === editingId)?.homeroomTeacherId : null

  const availableTeachersForEdit = () => {
    return teachers.filter(t => {
      if (currentHomeroomTeacherId && t.id === currentHomeroomTeacherId) {
        return true
      }
      const isAssigned = classrooms.some(c =>
        c.id !== editingId &&
        c.homeroomTeacherId === t.id &&
        (!form.academicYear || !c.academicYear || c.academicYear === form.academicYear)
      )
      if (isAssigned) return false
      if (t.role === 'HOMEROOM_TEACHER') return false
      return true
    })
  }

  const handleRoomNumberChange = (value: string, setter: (v: string) => void) => {
    const numericOnly = value.replace(/[^0-9]/g, '')
    const trimmed = numericOnly.replace(/^0+/, '') || ''
    setter(trimmed)
  }

  const isClassroomNameDuplicate = (name: string, academicYear: string, excludeId?: number) => classrooms.some(c => c.name === name && c.academicYear === academicYear && c.id !== excludeId)

  const filtered = classrooms.filter(c => {
    if (gradeFilter && String(c.gradeLevel) !== gradeFilter) return false
    return true
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginated = filtered.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-800">รายการห้องเรียน</h1><p className="text-gray-500 mt-1">แก้ไข และจัดการห้องเรียนทั้งหมด</p></div>
          <button
            type="button"
            onClick={() => setShowPromoteConfirmModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition"
          >
            <span>🎓</span> เลื่อนชั้นเรียนทั้งโรงเรียน
          </button>
        </div>

        {/* Grade Quick Filter Tabs (คัดกรองตามระดับชั้น ป.1 - ป.6) */}
        <div className="bg-white border border-gray-200 rounded-xl p-2 mb-6 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => { setGradeFilter(''); setCurrentPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${gradeFilter === ''
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <School size={16} /> ทุกระดับชั้น
              <span className={`text-xs px-2 py-0.5 rounded-full ${gradeFilter === '' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {classrooms.length}
              </span>
            </button>

            {[1, 2, 3, 4, 5, 6].map(g => {
              const count = classrooms.filter(c => c.gradeLevel === g).length
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGradeFilter(String(g)); setCurrentPage(1) }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${gradeFilter === String(g)
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  ป.{g}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${gradeFilter === String(g) ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">แก้ไขห้องเรียน</h2>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ระดับชั้น</label>
                    <select value={form.gradeLevel} onChange={e => setForm({ ...form, gradeLevel: Number(e.target.value) })} className="w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">{[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ป.{g}</option>)}</select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">ห้อง <span className="text-red-500">*</span></label>
                    <input required type="number" min="1" value={form.roomNumber} onChange={e => { handleRoomNumberChange(e.target.value, v => setForm({ ...form, roomNumber: v })); clearFieldError('roomnumber') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('roomnumber')}`} {...fieldAttrs('roomnumber')} placeholder="เช่น 1" />
                    {fieldError('roomnumber')}
                  </div>
                </div>
                {form.roomNumber && (
                  <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${isClassroomNameDuplicate(generatedName, form.academicYear, editingId ?? undefined) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <span className="font-medium">ชื่อห้องเรียนที่ได้:</span>
                    <span className="font-bold text-lg bg-white px-2 py-0.5 rounded border border-red-200">{generatedName}</span>
                    {isClassroomNameDuplicate(generatedName, form.academicYear, editingId ?? undefined) && <span className="text-red-600 text-xs font-medium ml-auto">ชื่อห้องซ้ำ!</span>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ปีการศึกษา <span className="text-red-500">*</span></label>
                    <input required value={form.academicYear} onChange={e => { setForm({ ...form, academicYear: e.target.value }); clearFieldError('academicyear') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('academicyear')}`} {...fieldAttrs('academicyear')} />
                    {fieldError('academicyear')}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">จำนวนนักเรียนสูงสุด</label>
                    <input type="number" min="1" value={form.maxStudents} onChange={e => { setForm({ ...form, maxStudents: Number(e.target.value) }); clearFieldError('maxstudents') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('maxstudents')}`} {...fieldAttrs('maxstudents')} />
                    {fieldError('maxstudents')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">อาจารย์ที่ปรึกษา (ครูประจำชั้น)</label>
                  <select value={form.homeroomTeacherId} onChange={e => setForm({ ...form, homeroomTeacherId: e.target.value })} className="w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">-- ไม่ระบุ --</option>
                    {availableTeachersForEdit().map(t => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}{currentHomeroomTeacherId && t.id === currentHomeroomTeacherId ? ' (ครูประจำชั้นห้องนี้)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">ยกเลิก</button>
                  <button type="submit" disabled={form.roomNumber ? isClassroomNameDuplicate(generatedName, form.academicYear, editingId ?? undefined) : false} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg py-2.5 font-medium transition">บันทึกการแก้ไข</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Promote Confirm Modal Popup */}
        {showPromoteConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎓</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">ยืนยันการเลื่อนชั้นเรียนทั้งโรงเรียน</h2>
                  <p className="text-xs text-gray-500">การดำเนินการนี้จะมีผลกับทุกชั้นเรียนและทุกห้องในระบบทันที</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 space-y-2 mb-6">
                <p className="font-semibold text-blue-800">เงื่อนไขการเลื่อนชั้น:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-800/90 pl-1">
                  <li>นักเรียนชั้น <strong>ป.1 ถึง ป.5</strong> จะเลื่อนขึ้นชั้นถัดไป พร้อมเพิ่มปีการศึกษา 1 ปี</li>
                  <li>นักเรียนชั้น <strong>ป.6</strong> ทั้งหมดจะเปลี่ยนสถานะเป็น <strong>"จบการศึกษา"</strong></li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPromoteConfirmModal(false)}
                  disabled={isPromotingAll}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handlePromoteAll}
                  disabled={isPromotingAll}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 font-medium transition shadow flex items-center justify-center gap-2"
                >
                  {isPromotingAll ? 'กำลังดำเนินการ...' : 'ยืนยันเลื่อนชั้นทั้งหมด'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ห้องเรียน</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ระดับชั้น</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ครูประจำชั้น</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">นักเรียน</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">ปีการศึกษา</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">จัดการ</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(c => {
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4"><span className="font-bold text-gray-800">{c.name}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">ป.{c.gradeLevel}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.homeroomTeacherName || '-'}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{c.studentCount}/{c.maxStudents}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{c.academicYear}</td>
                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(c)} className="text-sm text-red-600 hover:text-red-800 font-medium">แก้ไข</button></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>{gradeFilter ? `ไม่พบห้องเรียนระดับชั้น ป.${gradeFilter}` : 'ยังไม่มีห้องเรียน'}</p>
            </div>
          )}
          {filtered.length > 0 && <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">แสดง {startIndex + 1} ถึง {Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">← ก่อนหน้า</button>
              <span className="text-sm font-medium text-gray-600">หน้า {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">ถัดไป →</button>
            </div>
          </div>}
        </div>
      </main>
    </div>
  )
}
