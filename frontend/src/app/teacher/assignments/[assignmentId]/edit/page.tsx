'use client'

import { useEffect, useState } from 'react'


import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Link from 'next/link'

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const assignmentId = params.assignmentId
  const teacherSubjectId = searchParams.get('teacherSubjectId')
  const role = Cookies.get('role') || 'TEACHER'
  const fullName = Cookies.get('fullName') || 'ครูผู้สอน'

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
  })
  const [assignedDate, setAssignedDate] = useState('')
  const [subjectInfo, setSubjectInfo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearFieldError = (field: string) => setFieldErrors(prev => ({ ...prev, [field]: '' }))
  const fieldError = (field: string) => fieldErrors[field] && <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-600">{fieldErrors[field]}</p>
  const fieldAttrs = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined })
  const fieldClass = (field: string) => fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
  const showSaveError = (err: unknown) => {
    const parsed = parseApiError(err)
    const mapped = Object.fromEntries(Object.entries(parsed.fieldErrors).map(([key, message]) => [key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key, message]))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['title', 'description', 'duedate'].includes(key)))
    if (Object.keys(known).length) setFieldErrors(known)
    else toast.error(parsed.message)
  }
  const validateForm = () => {
    const errors = {
      ...(!form.title.trim() ? { title: 'กรุณากรอกหัวข้อภาระงาน' } : {}),
      ...(!form.dueDate ? { duedate: 'กรุณาระบุวันกำหนดส่ง' } : {}),
      ...(form.dueDate && assignedDate && form.dueDate < assignedDate ? { duedate: 'วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน' } : {}),
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }
  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  const fetchAssignment = async () => {
    try {
      setLoading(true)
      const res: any = await api.get(`/teacher/assignments/${assignmentId}`)
      const data = res.data

      setForm({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : ''
      })
      if (data.assignedDate) {
        setAssignedDate(data.assignedDate.split('T')[0])
      }
      setSubjectInfo(`${data.subjectName} - ${data.classroomName}`)
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลภาระงานได้')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      await api.put(`/teacher/assignments/${assignmentId}`, form)
      toast.success('อัปเดตภาระงานสำเร็จ')
      router.push(`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`)
    } catch (err: any) {
      showSaveError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>
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
            <span className="text-gray-800 font-medium">แก้ไขภาระงาน</span>
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
            <Link
              href={`/teacher/assignments?teacherSubjectId=${teacherSubjectId}`}
              className="inline-flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-800 transition mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              กลับไปที่รายการภาระงาน
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">แก้ไขภาระงาน</h1>
            <p className="text-gray-500">อัปเดตรายละเอียดและข้อกำหนดสำหรับงานที่มอบหมาย</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <form onSubmit={handleSubmit} className="p-8 space-y-6" noValidate>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    หัวข้อภาระงาน
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={e => { setForm({...form, title: e.target.value}); clearFieldError('title') }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-900 ${fieldClass('title')}`}
                    {...fieldAttrs('title')}
                  />
                  {fieldError('title')}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    วิชา
                  </label>
                  <div className="relative">
                    <input
                      disabled
                      value={subjectInfo}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">ไม่สามารถเปลี่ยนรายวิชาได้หลังจากสร้างภาระงานแล้ว</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    รายละเอียดและบันทึกจากคุณครู
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => { setForm({...form, description: e.target.value}); clearFieldError('description') }}
                    rows={4}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-900 ${fieldClass('description')}`}
                    {...fieldAttrs('description')}
                  />
                  {fieldError('description')}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    วันกำหนดส่ง
                  </label>
                  <input
                    type="date"
                    required
                    min={assignedDate}
                    value={form.dueDate}
                    onChange={e => {
                      const val = e.target.value
                      setForm({...form, dueDate: val})
                      if (val && assignedDate && val < assignedDate) {
                        setFieldErrors(prev => ({ ...prev, duedate: 'วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน' }))
                      } else {
                        clearFieldError('duedate')
                      }
                    }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition text-gray-900 ${fieldClass('duedate')}`}
                    {...fieldAttrs('duedate')}
                  />
                  {fieldError('duedate')}
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition shadow-sm"
                  >
                    {saving ? 'กำลังบันทึก...' : 'อัปเดตภาระงาน'}
                  </button>
                </div>
              </form>

              {/* Footer Note */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-start gap-3 text-sm text-gray-500">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <p>การแก้ไขรายละเอียดภาระงานจะถูกแจ้งเตือนไปยังแอปพลิเคชันของนักเรียนและผู้ปกครองโดยอัตโนมัติ</p>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}
