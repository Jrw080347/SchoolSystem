'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/components/ui/NotificationProvider'
import { parseApiError } from '@/lib/notificationErrors'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import { User, Lock, EyeOff, Eye, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { success, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [hasFormError, setHasFormError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setFormError('')
    setHasFormError(false)

    const errors: Record<string, string> = {}

    // Validation ชื่อผู้ใช้งาน (Username)
    // 1. ต้องไม่เป็นค่าว่าง
    // 2. ห้ามมีช่องว่างระหว่างตัวอักษร
    // 3. ต้องเป็นตัวอักษรภาษาอังกฤษ, ตัวเลข ที่ถูกต้อง
    if (!form.username || !form.username.trim()) {
      errors.username = 'ชื่อผู้ใช้งานต้องไม่เป็นค่าว่าง'
    } else if (/\s/.test(form.username)) {
      errors.username = 'ชื่อผู้ใช้งานต้องไม่มีช่องว่าง'
    } else if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
      errors.username = 'ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขที่ถูกต้อง'
    }

    // Validation รหัสผ่าน (Password)
    // 1. ต้องไม่เป็นค่าว่าง
    // 2. ห้ามมีช่องว่าง
    // 3. ต้องมีความยาวไม่ต่ำกว่า 6 ตัวอักษร
    // 4. ต้องประกอบด้วยตัวอักษรหรือตัวเลข
    if (!form.password || !form.password.trim()) {
      errors.password = 'รหัสผ่านต้องไม่เป็นค่าว่าง'
    } else if (/\s/.test(form.password)) {
      errors.password = 'รหัสผ่านต้องไม่มีช่องว่าง'
    } else if (form.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีความยาวไม่ต่ำกว่า 6 ตัวอักษร'
    } else if (!/[a-zA-Z0-9]/.test(form.password)) {
      errors.password = 'รหัสผ่านต้องประกอบด้วยตัวอักษรหรือตัวเลข'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const res: any = await api.post('/auth/login', form)
      const { token, role, fullName } = res

      Cookies.set('token', token, { expires: 1 })
      Cookies.set('role', role, { expires: 1 })
      Cookies.set('fullName', fullName, { expires: 1 })

      success(`ยินดีต้อนรับ ${fullName}`)

      if (role === 'ADMIN') router.push('/admin/dashboard')
      else if (role === 'TEACHER' || role === 'HOMEROOM_TEACHER') router.push('/teacher/schedule')
      else if (role === 'PARENT') router.push('/parent/students')
    } catch (err: any) {
      const parsed = parseApiError(err, 'ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง')
      let message = parsed.message
      if (!message || message.toLowerCase().includes('bad credentials')) {
        message = 'ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง'
      }
      const mappedErrors = Object.fromEntries(Object.entries(parsed.fieldErrors).map(([key, value]) => [
        key.toLowerCase().includes('user') || key.toLowerCase().includes('login') ? 'username'
          : key.toLowerCase().includes('pass') ? 'password' : key,
        value,
      ]))
      if (Object.keys(mappedErrors).some(key => key === 'username' || key === 'password')) {
        setFieldErrors(mappedErrors)
      } else {
        setFormError(message)
        setHasFormError(true)
        notifyError(message, 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ===== Left Side — Image ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMlB2oaiAo_fmMWnoWg3hkDv6SozVj4hbxIP24Wf_8W69zIKdTTBtN3w&s=10"
          alt="School Campus"
          className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-slate-900/10" />

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-20 text-white w-full h-full">
          <div>
            <div className="w-14 h-14 bg-white rounded-2xl backdrop-blur-md border border-white/30 flex items-center justify-center p-2 mb-8 shadow-xl">
              <img
                src="/images/school-logo.png"
                alt="ตราโรงเรียนบ้านแจ่งกู้เรือง"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 tracking-tight text-white">
              ระบบสารสนเทศเพื่อการจัดการ<br />
              <span className="text-primary-300">โรงเรียนบ้านแจ่งกู่เรื่อง</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed font-light">
              ขับเคลื่อนการศึกษาด้วยเทคโนโลยี เชื่อมต่อข้อมูลระหว่างโรงเรียน ครู และผู้ปกครองอย่างไร้รอยต่อ เพื่อพัฒนาศักยภาพนักเรียนอย่างเต็มรูปแบบ
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
              <span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Right Side — Form ===== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm mx-auto">

          {/* School Brand / Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-slate-200 shrink-0">
              <img
                src="/images/school-logo.png"
                alt="ตราโรงเรียนบ้านแจ่งกู้เรือง"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">โรงเรียนบ้านแจ่งกู้เรือง</h3>
              <p className="text-xs text-slate-500">ระบบบริหารจัดการสถานศึกษา</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">เข้าสู่ระบบ</h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบ
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => {
                    setForm({ ...form, username: e.target.value })
                    setFieldErrors(prev => ({ ...prev, username: '' }))
                    setFormError('')
                    setHasFormError(false)
                  }}
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all bg-white ${fieldErrors.username ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200'}`}
                  placeholder="ชื่อผู้ใช้งาน"
                />
              </div>
              {fieldErrors.username && <p id="username-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.username}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  รหัสผ่าน
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => {
                    setForm({ ...form, password: e.target.value })
                    setFieldErrors(prev => ({ ...prev, password: '' }))
                    setFormError('')
                    setHasFormError(false)
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all bg-white ${fieldErrors.password ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p id="password-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 active:scale-[0.99] disabled:bg-slate-400 disabled:pointer-events-none transition-all mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
