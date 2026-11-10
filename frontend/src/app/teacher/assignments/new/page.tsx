'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Link from 'next/link'

const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teacherSubjectId = searchParams.get('teacherSubjectId')
  const role = Cookies.get('role') || 'TEACHER'
  const fullName = Cookies.get('fullName') || 'ครูผู้สอน'

  const [today, setToday] = useState(getTodayDate)
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedDate: getTodayDate(),
    dueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const currentToday = getTodayDate()
    setToday(currentToday)
    setForm(prev => ({
      ...prev,
      assignedDate: prev.assignedDate || currentToday
    }))
  }, [])

  const clearFieldError = (field: string) => setFieldErrors(prev => ({ ...prev, [field]: '' }))

  const setApiFieldErrors = (errors: Record<string, string>) => {
    const mapped = Object.fromEntries(Object.entries(errors).map(([key, message]) => [key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key, message]))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['title', 'description', 'assigneddate', 'duedate'].includes(key)))
    if (!Object.keys(known).length) return false
    setFieldErrors(known)
    return true
  }
  const fieldError = (field: string) => fieldErrors[field] && <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-600">{fieldErrors[field]}</p>
  const fieldAttrs = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined })
  const fieldClass = (field: string) => fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
  const showFormError = (err: unknown) => {
    const parsed = parseApiError(err)
    if (!setApiFieldErrors(parsed.fieldErrors)) toast.error(parsed.message)
  }

  const validateForm = () => {
    const currentToday = today || getTodayDate()
    const errors = {
      ...(!form.title.trim() ? { title: 'กรุณากรอกชื่องาน' } : {}),
      ...(!form.assignedDate ? { assigneddate: 'กรุณาระบุวันสั่งงาน' } : {}),
      ...(form.assignedDate && currentToday && form.assignedDate < currentToday ? { assigneddate: 'วันสั่งงานต้องไม่อยู่ก่อนวันปัจจุบัน' } : {}),
      ...(!form.dueDate ? { duedate: 'กรุณาระบุวันกำหนดส่ง' } : {}),
      ...(form.dueDate && form.assignedDate && form.dueDate < form.assignedDate ? { duedate: 'วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน' } : {}),
      ...(form.dueDate && !form.assignedDate && currentToday && form.dueDate < currentToday ? { duedate: 'วันกำหนดส่งต้องไม่อยู่ก่อนวันปัจจุบัน' } : {}),
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherSubjectId) {
      toast.error('ไม่พบข้อมูลรายวิชา')
      return
    }
    if (!validateForm()) return

    setLoading(true)
    try {
      await api.post('/teacher/assignments', {
        ...form,
        teacherSubjectId: Number(teacherSubjectId)
      })
      toast.success('สร้างงานเรียบร้อยแล้ว')
      router.push(`/teacher/subjects/${teacherSubjectId}`)
    } catch (err: any) {
      showFormError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Link href="/teacher/schedule" className="hover:text-red-600 transition">แผงควบคุม</Link>
            <span className="mx-2">›</span>
            {teacherSubjectId ? (
              <Link href={`/teacher/subjects/${teacherSubjectId}`} className="hover:text-red-600 transition">รายละเอียดวิชา</Link>
            ) : (
              <span className="text-gray-400">รายละเอียดวิชา</span>
            )}
            <span className="mx-2">›</span>
            <Link href={`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`} className="hover:text-red-600 transition">ภาระงานทั้งหมด</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">สั่งงานใหม่</span>
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

        <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">สั่งงานใหม่ (Create Assignment)</h1>
            <p className="text-gray-500">สร้างภาระงานใหม่สำหรับวิชานี้ นักเรียนในห้องจะได้รับงานนี้ทั้งหมด</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-6" noValidate>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  ชื่องาน <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={e => { setForm({...form, title: e.target.value}); clearFieldError('title') }}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow bg-gray-50 focus:bg-white ${fieldClass('title')}`}
                  {...fieldAttrs('title')}
                  placeholder="เช่น แบบฝึกหัดบทที่ 1: สมการกำลังสอง"
                />
                {fieldError('title')}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  value={form.description}
                  onChange={e => { setForm({...form, description: e.target.value}); clearFieldError('description') }}
                  rows={4}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow bg-gray-50 focus:bg-white ${fieldClass('description')}`}
                  {...fieldAttrs('description')}
                  placeholder="อธิบายรายละเอียดงาน ข้อควรระวัง หรือแหล่งค้นคว้าเพิ่มเติม..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    วันสั่งงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={form.assignedDate}
                    onChange={e => {
                      const val = e.target.value
                      setForm(prev => ({ ...prev, assignedDate: val }))
                      if (val && today && val < today) {
                        setFieldErrors(prev => ({ ...prev, assigneddate: 'วันสั่งงานต้องไม่อยู่ก่อนวันปัจจุบัน' }))
                      } else {
                        clearFieldError('assigneddate')
                      }
                      if (form.dueDate && val && form.dueDate < val) {
                        setFieldErrors(prev => ({ ...prev, duedate: 'วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน' }))
                      } else if (form.dueDate && val && form.dueDate >= val) {
                        clearFieldError('duedate')
                      }
                    }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow bg-gray-50 focus:bg-white ${fieldClass('assigneddate')}`}
                    {...fieldAttrs('assigneddate')}
                  />
                  {fieldError('assigneddate')}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    วันกำหนดส่ง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={form.assignedDate || today}
                    value={form.dueDate}
                    onChange={e => {
                      const val = e.target.value
                      setForm(prev => ({ ...prev, dueDate: val }))
                      const minDue = form.assignedDate || today
                      if (val && minDue && val < minDue) {
                        setFieldErrors(prev => ({
                          ...prev,
                          duedate: form.assignedDate ? 'วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน' : 'วันกำหนดส่งต้องไม่อยู่ก่อนวันปัจจุบัน'
                        }))
                      } else {
                        clearFieldError('duedate')
                      }
                    }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow bg-gray-50 focus:bg-white ${fieldClass('duedate')}`}
                    {...fieldAttrs('duedate')}
                  />
                  {fieldError('duedate')}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 shadow-sm shadow-red-600/20"
                >
                  {loading ? 'กำลังบันทึก...' : 'สร้างงาน'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
