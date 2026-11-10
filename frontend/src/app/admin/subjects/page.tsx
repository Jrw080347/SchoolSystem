'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'

interface Subject {
  id: number
  code: string
  name: string
  description: string | null
  credits: number
  gradeLevel: number | null
  active: boolean
  createdAt: string
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [form, setForm] = useState({ code: '', name: '', description: '', credits: 1, gradeLevel: '' as string })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const role = Cookies.get('role') || 'ADMIN'

  const clearFieldError = (field: string) => setFieldErrors(prev => ({ ...prev, [field]: '' }))
  const fieldClass = (field: string) => fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
  const fieldAttrs = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined })
  const fieldError = (field: string) => fieldErrors[field] && <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-600">{fieldErrors[field]}</p>

  const showFieldErrors = (errors: Record<string, string>) => {
    const mapped = Object.fromEntries(Object.entries(errors).map(([key, message]) => [key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key, message]))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['code', 'name', 'credits', 'gradelevel'].includes(key)))
    if (!Object.keys(known).length) return false
    setFieldErrors(known)
    return true
  }

  const showSubmitError = (err: unknown) => {
    const parsed = parseApiError(err)
    if (!showFieldErrors(parsed.fieldErrors)) toast.error(parsed.message)
  }

  useEffect(() => {
    api.get('/admin/subjects').then((res: any) => setSubjects(res.data || [])).catch(err => {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลรายวิชาได้').message)
    })
  }, [])

  const resetForm = () => {
    setForm({ code: '', name: '', description: '', credits: 1, gradeLevel: '' })
    setEditingId(null)
    setFieldErrors({})
    setShowForm(false)
  }

  const openEdit = (s: Subject) => {
    setEditingId(s.id)
    setFieldErrors({})
    setForm({ code: s.code, name: s.name, description: s.description || '', credits: s.credits, gradeLevel: s.gradeLevel ? String(s.gradeLevel) : '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = {
      ...(!form.code.trim() ? { code: 'กรุณากรอกรหัสวิชา' } : {}),
      ...(!form.name.trim() ? { name: 'กรุณากรอกชื่อวิชา' } : {}),
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        credits: form.credits,
        gradeLevel: form.gradeLevel ? Number(form.gradeLevel) : null
      }
      if (editingId) {
        const res: any = await api.put(`/admin/subjects/${editingId}`, payload)
        setSubjects(prev => prev.map(s => s.id === editingId ? res.data : s))
        toast.success('แก้ไขรายวิชาเรียบร้อยแล้ว')
      } else {
        const res: any = await api.post('/admin/subjects', payload)
        setSubjects(prev => [...prev, res.data])
        toast.success('เพิ่มรายวิชาเรียบร้อยแล้ว')
      }
      resetForm()
    } catch (err) {
      showSubmitError(err)
    }
  }

  const handleToggle = async (s: Subject) => {
    try {
      await api.patch(`/admin/subjects/${s.id}/toggle`)
      setSubjects(prev => prev.map(sub => sub.id === s.id ? { ...sub, active: !sub.active } : sub))
      toast.success(`${s.active ? 'ปิด' : 'เปิด'}ใช้งานรายวิชา ${s.name} แล้ว`)
    } catch (err) {
      toast.error(parseApiError(err).message)
    }
  }

  const filtered = subjects.filter(s => {
    const matchSearch = !search || s.code.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
    const matchGrade = !filterGrade || String(s.gradeLevel) === filterGrade
    return matchSearch && matchGrade
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginated = filtered.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterGrade])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const gradeLevelText = (g: number | null) => g ? `ป.${g}` : 'ทุกระดับชั้น'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รายการการรายวิชา</h1>
            <p className="text-gray-500 mt-1">เพิ่ม แก้ไข และจัดการรายวิชาทั้งหมด</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition">+ เพิ่มรายวิชา</button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input type="text" placeholder="ค้นหารหัสวิชา / ชื่อวิชา..." value={search} onChange={e => setSearch(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-72" />
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">ทุกระดับชั้น</option>{[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ป.{g}</option>)}
          </select>
          <div className="ml-auto text-sm text-gray-500 self-center">ทั้งหมด {filtered.length} วิชา</div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">{editingId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">รหัสวิชา <span className="text-red-500">*</span></label>
                    <input required value={form.code} onChange={e => { setForm({ ...form, code: e.target.value }); clearFieldError('code') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('code')}`} {...fieldAttrs('code')} placeholder="เช่น TH101" />
                    {fieldError('code')}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">หน่วยกิต</label>
                    <input type="number" min="1" max="10" value={form.credits} onChange={e => { setForm({ ...form, credits: Number(e.target.value) }); clearFieldError('credits') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('credits')}`} {...fieldAttrs('credits')} />
                    {fieldError('credits')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ชื่อวิชา <span className="text-red-500">*</span></label>
                  <input required value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); clearFieldError('name') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('name')}`} {...fieldAttrs('name')} placeholder="เช่น ภาษาไทย" />
                  {fieldError('name')}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ระดับชั้น</label>
                  <select value={form.gradeLevel} onChange={e => { setForm({ ...form, gradeLevel: e.target.value }); clearFieldError('gradelevel') }} className={`w-full mt-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${fieldClass('gradelevel')}`} {...fieldAttrs('gradelevel')}>
                    <option value="">ทุกระดับชั้น</option>{[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ป.{g}</option>)}
                  </select>
                  {fieldError('gradelevel')}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">คำอธิบายรายวิชา</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">ยกเลิก</button>
                  <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium transition">{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มรายวิชา'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">รหัสวิชา</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ชื่อวิชา</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">หน่วยกิต</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">ระดับชั้น</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">สถานะ</th><th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">จัดการ</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(s => <tr key={s.id} className={`hover:bg-gray-50 transition ${!s.active ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4"><span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-1 rounded text-sm">{s.code}</span></td>
                <td className="px-6 py-4"><div><p className="font-medium text-gray-800">{s.name}</p>{s.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{s.description}</p>}</div></td>
                <td className="px-6 py-4 text-center"><span className="text-sm font-medium text-gray-700">{s.credits}</span></td>
                <td className="px-6 py-4 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${s.gradeLevel ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{gradeLevelText(s.gradeLevel)}</span></td>
                <td className="px-6 py-4 text-center"><button onClick={() => handleToggle(s)} className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer transition ${s.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>{s.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</button></td>
                <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(s)} className="text-sm text-red-600 hover:text-red-800 font-medium">แก้ไข</button></div></td>
              </tr>)}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400"><p>{search || filterGrade ? 'ไม่พบรายวิชาที่ค้นหา' : 'ยังไม่มีรายวิชา'}</p>{!search && !filterGrade && <p className="text-xs mt-1">กดปุ่ม "+ เพิ่มรายวิชา" เพื่อเริ่มต้น</p>}</div>}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">แสดง {totalItems === 0 ? 0 : startIndex + 1} ถึง {Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">← ก่อนหน้า</button>
                <span className="text-sm font-medium text-gray-600">หน้า {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">ถัดไป →</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
