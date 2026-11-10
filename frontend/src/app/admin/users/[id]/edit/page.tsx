'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'

interface UserDetail {
  id: number
  firstName: string
  lastName: string
  phone: string
  role: string
  status: string
  lastLogin: string | null
  lastPasswordChange: string | null
}

const roleNameToCode: Record<string, number> = {
  ADMIN: 1,
  TEACHER: 2,
  HOMEROOM_TEACHER: 3,
  PARENT: 4,
}

const isValidRoleCode = (role: number | undefined): role is number => {
  return role === 1 || role === 2 || role === 3 || role === 4
}

export default function EditUser() {
  const params = useParams()
  const router = useRouter()
  const role = Cookies.get('role') || 'ADMIN'
  const userId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 2,
    status: 'ACTIVE',
    classroomId: null as number | null,
  })
  const [lastLogin, setLastLogin] = useState<string | null>(null)
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const availableClassrooms = classrooms.filter(c =>
    !c.homeroomTeacherId ||
    c.homeroomTeacherId === Number(userId) ||
    c.id === form.classroomId
  )

  const getFilteredClassroom = (list: any[]) => {
    if (!list || list.length === 0) return null

    let targetName = ''
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const q = urlParams.get('classroom')
        if (q) targetName = q.trim()
      } catch {}

      if (!targetName) {
        try {
          const saved = sessionStorage.getItem('admin_users_filters')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.classroomFilter && typeof parsed.classroomFilter === 'string') {
              targetName = parsed.classroomFilter.trim()
            }
          }
        } catch {}
      }
    }

    if (!targetName) return null

    return (
      list.find(c => c.name && c.name.trim().toLowerCase() === targetName.toLowerCase()) ||
      list.find(c => c.name && (c.name.includes(targetName) || targetName.includes(c.name))) ||
      list.find(c => String(c.id) === targetName) ||
      null
    )
  }

  useEffect(() => {
    api.get('/admin/classrooms')
      .then((res: any) => {
        const data = res.data || res
        if (Array.isArray(data)) setClassrooms(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (form.role === 3 && !form.classroomId && classrooms.length > 0) {
      const matched = getFilteredClassroom(classrooms)
      if (matched) {
        setForm(prev => (prev.classroomId ? prev : { ...prev, classroomId: matched.id }))
      }
    }
  }, [form.role, form.classroomId, classrooms])

  const formatDateTime = (val: string | null) => {
    if (!val) return 'ไม่มีข้อมูล'
    try {
      const date = new Date(val)
      if (isNaN(date.getTime())) return val
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return val
    }
  }

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const showFieldErrors = (errors: Record<string, string>) => {
    const mapped = Object.fromEntries(Object.entries(errors).map(([key, message]) => {
      const field = key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key.toLowerCase()
      return [field, message]
    }))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['firstname', 'lastname', 'phone', 'role', 'status', 'classroomid'].includes(key)))
    if (!Object.keys(known).length) return false
    setFieldErrors(known)
    return true
  }

  const showSaveError = (err: unknown) => {
    const parsed = parseApiError(err)
    if (!showFieldErrors(parsed.fieldErrors)) toast.error(parsed.message)
  }

  useEffect(() => {
    api.get(`/admin/users/${userId}`)
      .then((res: any) => {
        const u = res.data || res
        const roleCode = typeof u.role === 'number' ? u.role : roleNameToCode[u.role]
        if (!isValidRoleCode(roleCode)) {
          toast.error('บทบาทผู้ใช้ไม่ถูกต้อง')
          router.push('/admin/users')
          return
        }
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          role: roleCode,
          status: (u.status || (u.isActive ? 'ACTIVE' : 'SUSPENDED')).toUpperCase(),
          classroomId: u.classroomId || null,
        })
        setLastLogin(u.lastLogin || null)
        setLastPasswordChange(u.lastPasswordChange || null)
      })
      .catch((err) => {
        toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้').message)
        router.push('/admin/users')
      })
      .finally(() => setLoading(false))
  }, [userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    let phoneVal = (form.phone || '').trim()
    const cleanDigits = phoneVal.replace(/\D/g, '')
    if (cleanDigits.length === 9 && ['6', '8', '9'].includes(cleanDigits.charAt(0))) {
      phoneVal = '0' + cleanDigits
      setForm(prev => ({ ...prev, phone: phoneVal }))
    } else if (cleanDigits.length === 10 && ['06', '08', '09'].some(p => cleanDigits.startsWith(p))) {
      phoneVal = cleanDigits
      setForm(prev => ({ ...prev, phone: phoneVal }))
    }
    if (!phoneVal) {
      setFieldErrors(prev => ({ ...prev, phone: 'กรุณากรอกเบอร์โทรศัพท์' }))
      return
    }
    if (/\s/.test(form.phone)) {
      setFieldErrors(prev => ({ ...prev, phone: 'เบอร์โทรศัพท์ต้องไม่มีช่องว่างระหว่างตัวเลข' }))
      return
    }
    if (!/^\d+$/.test(phoneVal)) {
      setFieldErrors(prev => ({ ...prev, phone: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข [0-9] เท่านั้น' }))
      return
    }
    if (!/^(06|08|09)/.test(phoneVal)) {
      setFieldErrors(prev => ({ ...prev, phone: 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 06 08 09 เท่านั้น' }))
      return
    }
    if (phoneVal.length !== 10) {
      setFieldErrors(prev => ({ ...prev, phone: 'เบอร์โทรศัพท์ต้องมีจำนวน 10 หลักเท่านั้น' }))
      return
    }

    if (form.role === 3 && !form.classroomId) {
      setFieldErrors(prev => ({ ...prev, classroomid: 'กรุณาเลือกห้องเรียนประจำชั้น' }))
      return
    }
    try {
      await api.put(`/admin/users/${userId}`, form)
      toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว')
      router.push('/admin/users')
    } catch (err) {
      showSaveError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`)
      setLastPasswordChange(new Date().toISOString())
      toast.success('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว (รหัสผ่านเริ่มต้น: 123456)')
    } catch (err) {
      toast.error(parseApiError(err).message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role={role} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/admin/dashboard" className="hover:text-red-600">หน้าหลัก</Link>
          <span className="mx-2">/</span>
          <Link href="/admin/users" className="hover:text-red-600">ครูและบุคลากร</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">แก้ไขข้อมูลผู้ใช้งาน</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลผู้ใช้งาน</h1>
            <p className="text-gray-500 mt-1">อัปเดตรายละเอียดข้อมูล แก้ไขสถานะ และรีเซ็ตรหัสผ่านความปลอดภัย</p>
          </div>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            ← กลับไปยังหน้ารายการ
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Personal Info */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6" noValidate>
              <h2 className="text-lg font-semibold text-gray-800 mb-5">ข้อมูลส่วนตัว</h2>

              <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (ภาษาไทย) <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={form.firstName}
                      onChange={e => { setForm({ ...form, firstName: e.target.value }); clearFieldError('firstname') }}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.firstname ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      aria-invalid={Boolean(fieldErrors.firstname)}
                      aria-describedby={fieldErrors.firstname ? 'firstname-error' : undefined}
                    />
                    {fieldErrors.firstname && <p id="firstname-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.firstname}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล (ภาษาไทย) <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={form.lastName}
                      onChange={e => { setForm({ ...form, lastName: e.target.value }); clearFieldError('lastname') }}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.lastname ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      aria-invalid={Boolean(fieldErrors.lastname)}
                      aria-describedby={fieldErrors.lastname ? 'lastname-error' : undefined}
                    />
                    {fieldErrors.lastname && <p id="lastname-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.lastname}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={form.phone}
                    maxLength={10}
                    onChange={e => { setForm({ ...form, phone: e.target.value }); clearFieldError('phone') }}
                    onBlur={e => {
                      const val = e.target.value.trim()
                      const clean = val.replace(/\D/g, '')
                      if (clean.length === 9 && ['6', '8', '9'].includes(clean.charAt(0))) {
                        setForm(prev => ({ ...prev, phone: '0' + clean }))
                        clearFieldError('phone')
                      }
                    }}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                    placeholder="เช่น 0812345678"
                  />
                  {fieldErrors.phone && <p id="phone-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.phone}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งผู้ใช้งาน <span className="text-red-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={e => {
                      const newRole = Number(e.target.value)
                      let newClassroomId = form.classroomId
                      if (newRole === 3 && !newClassroomId && classrooms.length > 0) {
                        const matched = getFilteredClassroom(classrooms)
                        if (matched) {
                          newClassroomId = matched.id
                        }
                      }
                      setForm({ ...form, role: newRole, classroomId: newClassroomId })
                      clearFieldError('role')
                    }}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    aria-invalid={Boolean(fieldErrors.role)}
                    aria-describedby={fieldErrors.role ? 'role-error' : undefined}
                  >
                    <option value={1}>ผู้ดูแลระบบ (Admin)</option>
                    <option value={2}>คุณครู (Teacher)</option>
                    <option value={3}>ครูประจำชั้น (Homeroom Teacher)</option>
                    <option value={4}>ผู้ปกครอง (Parent)</option>
                  </select>
                  {fieldErrors.role && <p id="role-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.role}</p>}
                </div>

                {/* Homeroom Classroom Selection if role is HOMEROOM_TEACHER (3) */}
                {form.role === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ห้องเรียนประจำชั้น (Homeroom Classroom) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.classroomId || ''}
                      onChange={e => {
                        setForm({ ...form, classroomId: e.target.value ? Number(e.target.value) : null })
                        clearFieldError('classroomid')
                      }}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white font-medium ${fieldErrors.classroomid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      aria-invalid={Boolean(fieldErrors.classroomid)}
                      aria-describedby={fieldErrors.classroomid ? 'classroomid-error' : undefined}
                    >
                      <option value="">-- เลือกห้องเรียนประจำชั้น --</option>
                      {availableClassrooms.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (ปีการศึกษา {c.academicYear})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.classroomid && <p id="classroomid-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.classroomid}</p>}
                    <p className="text-xs text-gray-500 mt-1">กำหนดห้องเรียนที่ครูท่านนี้เป็นครูประจำชั้น (แสดงเฉพาะห้องที่ยังไม่มีครูประจำชั้น)</p>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะบัญชี <span className="text-red-500">*</span></label>
                  <select
                    value={form.status}
                    onChange={e => { setForm({ ...form, status: e.target.value }); clearFieldError('status') }}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    aria-invalid={Boolean(fieldErrors.status)}
                    aria-describedby={fieldErrors.status ? 'status-error' : undefined}
                  >
                    {Object.entries({ ACTIVE: 'ใช้งานอยู่ (Active)', SUSPENDED: 'ระงับการใช้งาน (Suspended)', PENDING: 'รอการดำเนินการ (Pending)' }).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {fieldErrors.status && <p id="status-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.status}</p>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium text-sm transition disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : ' บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Security */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">ความปลอดภัย</h2>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">รีเซ็ตรหัสผ่าน</p>
                <p className="text-xs text-gray-400 mt-1">ระบบจะรีเซ็ตรหัสผ่านของผู้ใช้งานเป็นค่าเริ่มต้น (123456)</p>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full px-4 py-2.5 border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition"
              >
                รีเซ็ตรหัสผ่าน
              </button>

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🕒</span>
                  <span>เข้าสู่ระบบล่าสุด: <strong className="text-gray-700">{lastLogin ? formatDateTime(lastLogin) : 'ยังไม่เคยเข้าสู่ระบบ'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🔑</span>
                  <span>เปลี่ยนรหัสผ่านล่าสุด: <strong className="text-gray-700">{lastPasswordChange ? formatDateTime(lastPasswordChange) : 'ยังไม่เคยเปลี่ยนรหัสผ่าน'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
