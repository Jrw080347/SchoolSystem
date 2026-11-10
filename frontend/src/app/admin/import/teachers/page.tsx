'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { CheckCircle2, AlertTriangle, X, AlertCircle, ArrowRight } from 'lucide-react'

interface TeacherRow {
  username?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
}

interface SkippedTeacherDetail {
  row?: number
  name?: string
  username?: string
  phone?: string
  reasons: string[]
}

interface ImportResultState {
  isOpen: boolean
  imported: number
  skipped: number
  skippedDetails: SkippedTeacherDetail[]
}

const REQUIRED_FIELDS: (keyof TeacherRow)[] = ['username', 'firstName', 'lastName', 'phone']

export function normalizePhone(phone?: string | number): string {
  if (phone === undefined || phone === null) return ''
  const str = String(phone).trim()
  const clean = str.replace(/\D/g, '')
  if (clean.length === 9 && ['6', '8', '9'].includes(clean.charAt(0))) {
    return '0' + clean
  }
  if (clean.length === 10 && ['06', '08', '09'].some(p => clean.startsWith(p))) {
    return clean
  }
  return str
}

export function validatePhone(phone?: string | number): { isValid: boolean; message?: string } {
  if (phone === undefined || phone === null || String(phone).trim() === '') {
    return { isValid: false, message: 'กรุณากรอกเบอร์โทรศัพท์' }
  }
  const str = normalizePhone(phone)
  if (/\s/.test(str)) {
    return { isValid: false, message: 'ต้องไม่มีช่องว่างระหว่างตัวเลข' }
  }
  if (!/^\d+$/.test(str)) {
    return { isValid: false, message: 'ต้องเป็นตัวเลข [0-9] เท่านั้น' }
  }
  if (!/^(06|08|09)/.test(str)) {
    return { isValid: false, message: 'ต้องขึ้นต้นด้วย 06, 08 หรือ 09 เท่านั้น' }
  }
  if (str.length !== 10) {
    return { isValid: false, message: 'ต้องมีจำนวน 10 หลักเท่านั้น' }
  }
  return { isValid: true }
}

function isRowValid(row: TeacherRow, existingUsernames: string[] = [], existingTeacherNames: string[] = []): boolean {
  const hasRequiredFields = REQUIRED_FIELDS.every(f => row[f] && String(row[f]).trim() !== '')
  if (!hasRequiredFields || !validatePhone(row.phone).isValid) return false
  if (row.username && existingUsernames.includes(String(row.username).trim())) return false
  const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
  if (fullName && existingTeacherNames.includes(fullName)) return false
  return true
}

export default function ImportTeachers() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<TeacherRow[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const role = Cookies.get('role') || 'ADMIN'

  const [existingUsernames, setExistingUsernames] = useState<string[]>([])
  const [existingTeacherNames, setExistingTeacherNames] = useState<string[]>([])
  const [importResult, setImportResult] = useState<ImportResultState | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetchExistingTeachers = useCallback(async () => {
    try {
      const res: any = await api.get('/admin/users')
      const usersList: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      const usernames = usersList.filter(u => u.username).map(u => String(u.username).trim())
      const names = usersList.filter(u => u.firstName && u.lastName).map(u => `${u.firstName} ${u.lastName}`.trim())
      setExistingUsernames(usernames)
      setExistingTeacherNames(names)
    } catch {
      // fallback
    }
  }, [])

  useEffect(() => {
    fetchExistingTeachers()
  }, [fetchExistingTeachers])

  const validCount = previewData.filter(row => isRowValid(row, existingUsernames, existingTeacherNames)).length
  const invalidCount = previewData.length - validCount
  const totalItems = previewData.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedPreviewData = previewData.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('กรุณาเลือกไฟล์ Excel นามสกุล .xlsx')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
    setFileName(file.name)
    setCurrentPage(1)
    fetchExistingTeachers()

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<TeacherRow>(sheet)
        const normalizedJson = json.map(row => {
          const normalizedPhone = normalizePhone(row.phone)
          const rawPassword = row.password !== undefined && row.password !== null ? String(row.password).trim() : ''
          const password = rawPassword || '123456'
          return {
            ...row,
            password,
            phone: normalizedPhone || (row.phone !== undefined && row.phone !== null ? String(row.phone) : '')
          }
        })
        setPreviewData(normalizedJson)
        if (!normalizedJson.length) toast.error('ไม่พบข้อมูลในไฟล์ Excel')
      } catch {
        toast.error('อ่านไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบไฟล์แล้วลองใหม่')
        clearFile()
      }
    }
    reader.readAsArrayBuffer(file)
  }, [fetchExistingTeachers])

  const clearFile = () => {
    setSelectedFile(null)
    setFileName(null)
    setPreviewData([])
    setCurrentPage(1)
    if (fileRef.current) fileRef.current.value = ''
  }

  const executeImport = async () => {
    if (!selectedFile) return toast.error('กรุณาเลือกไฟล์ Excel')
    setShowConfirmModal(false)
    setLoading(true)
    const formData = new FormData()
    try {
      // สร้างไฟล์ Excel ที่ normalized แล้ว (เติม 0 นำหน้าเบอร์โทรศัพท์ และรหัสผ่าน 123456) ส่งไปให้ Backend
      const exportRows = previewData.map(r => ({
        username: r.username || '',
        password: r.password || '123456',
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        phone: normalizePhone(r.phone) || (r.phone ? String(r.phone) : '')
      }))
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const normalizedBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      formData.append('file', normalizedBlob, selectedFile.name)
    } catch {
      formData.append('file', selectedFile)
    }
    try {
      const res: any = await api.post('/admin/import/teachers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const data = res?.data || res
      const imported = data?.imported ?? data?.data?.imported ?? 0
      const skipped = data?.skipped ?? data?.data?.skipped ?? 0
      const rawSkippedDetails = data?.skippedDetails ?? data?.data?.skippedDetails ?? []

      const mappedDetails: SkippedTeacherDetail[] = (Array.isArray(rawSkippedDetails) ? rawSkippedDetails : []).map((item: any) => {
        const previewRow = typeof item.row === 'number' && item.row >= 2 ? previewData[item.row - 2] : null
        const name = item.name || item.fullName || (previewRow ? `${previewRow.firstName || ''} ${previewRow.lastName || ''}`.trim() : '') || item.username || 'ไม่ระบุชื่อ'
        const username = item.username || (previewRow ? previewRow.username : '') || ''
        const phone = (previewRow ? previewRow.phone : '') || ''
        const reasons = Array.isArray(item.reasons) ? item.reasons : (item.reasons ? [String(item.reasons)] : ['ข้อมูลไม่ถูกต้อง'])
        return {
          row: item.row,
          name,
          username,
          phone,
          reasons,
        }
      })

      setImportResult({
        isOpen: true,
        imported,
        skipped,
        skippedDetails: mappedDetails,
      })

      if (imported > 0) {
        toast.success(`นำเข้าข้อมูลครูสำเร็จ ${imported} รายการ${skipped > 0 ? ` (ข้ามข้อมูล ${skipped} รายการ)` : ''}`)
      } else {
        toast.error(`ไม่สามารถนำเข้าได้ เนื่องจากข้อมูลทั้งหมดถูกข้าม (${skipped} รายการ)`)
      }
      clearFile()
      fetchExistingTeachers()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!selectedFile) return toast.error('กรุณาเลือกไฟล์ Excel')
    if (validCount === 0) return toast.error('ไม่มีข้อมูลที่พร้อมนำเข้า กรุณาแก้ไขข้อมูลในไฟล์ก่อน')
    if (invalidCount > 0) {
      setShowConfirmModal(true)
      return
    }
    executeImport()
  }

  const downloadTemplate = () => {
    const templateData = [
      { username: 'teacher01', password: 'P@ssw0rd', firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678' },
      { username: 'teacher02', password: 'P@ssw0rd', firstName: 'สมหญิง', lastName: 'รักเรียน', phone: '0898765432' },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, 'template_import_teachers.xlsx')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูลคุณครู</h1>
              <p className="text-gray-500 text-sm mt-1">นำเข้าไฟล์ Excel เพื่อเพิ่มข้อมูลคุณครูในระบบ</p>
            </div>
            <Link href="/admin/import" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              ← กลับ
            </Link>
          </div>
        </div>

        {/* Upload & Summary Card  */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* 1.  Compact File Upload Dropzone */}
            <div className="md:col-span-5 lg:col-span-4">
              {!fileName ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-red-400 hover:bg-red-50/40 transition-colors group cursor-pointer relative flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1.5 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                    <img
                      src="/images/school-logo.png"
                      alt="โลโก้โรงเรียน"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">เลือกหรือลากไฟล์ Excel (.xlsx)</p>
                    <p className="text-[11px] text-gray-400">คลิกเพื่อนำเข้าไฟล์</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-xs shrink-0 border border-red-100">
                      <img src="/images/school-logo.png" alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">{fileName}</p>
                      <p className="text-[10px] text-green-700 font-medium">โหลดไฟล์เรียบร้อย</p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-red-500 hover:text-red-700 text-[11px] font-semibold px-2 py-1 rounded border border-red-200 bg-white hover:bg-red-50 transition-colors shrink-0"
                  >
                    ✕ เปลี่ยน
                  </button>
                </div>
              )}
            </div>

            {/* 2. นำสรุปข้อมูลมาไว้ข้างๆ: Summary Stats Side-by-Side */}
            <div className="md:col-span-4 lg:col-span-5 grid grid-cols-3 gap-2">
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl py-2 px-3 text-center">
                <span className="text-[11px] font-medium text-gray-500 block">ทั้งหมด</span>
                <span className="text-base font-bold text-gray-800">{previewData.length}</span>
                <span className="text-[10px] text-gray-400 block">รายการ</span>
              </div>
              <div className="bg-green-50/70 border border-green-200 rounded-xl py-2 px-3 text-center">
                <span className="text-[11px] font-medium text-green-700 block">พร้อมนำเข้า</span>
                <span className="text-base font-bold text-green-700">{validCount}</span>
                <span className="text-[10px] text-green-600 block">รายการ</span>
              </div>
              <div className={`border rounded-xl py-2 px-3 text-center ${invalidCount > 0 ? 'bg-amber-50/70 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200/80 text-gray-400'
                }`}>
                <span className={`text-[11px] font-medium block ${invalidCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>ไม่ครบ</span>
                <span className={`text-base font-bold ${invalidCount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{invalidCount}</span>
                <span className={`text-[10px] block ${invalidCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>รายการ</span>
              </div>
            </div>

            {/* 3. ปุ่มดำเนินการ (Action Buttons) */}
            <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col gap-2">
              <button
                onClick={downloadTemplate}
                className="w-full px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>📥</span> เทมเพลต Excel
              </button>
              <button
                onClick={handleImport}
                disabled={loading || previewData.length === 0 || validCount === 0}
                className="w-full px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <span>🚀</span> นำเข้าข้อมูล {validCount > 0 ? `(${validCount})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Preview Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-gray-800 text-sm">ตัวอย่างข้อมูล</h3>
            <span className="text-xs text-gray-500">
              {previewData.length > 0 ? `แสดงข้อมูลแล้ว ${previewData.length} รายการ (พร้อมนำเข้า ${validCount} รายการ, ไม่พร้อม ${invalidCount} รายการ)` : 'รอการนำเข้าไฟล์'}
            </span>
          </div>

          {previewData.length === 0 ? (
            <div className="py-20 px-8 flex flex-col items-center justify-center text-center text-gray-400">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl p-2.5 flex items-center justify-center mb-4 shadow-sm">
                <img
                  src="/images/school-logo.png"
                  alt="โลโก้โรงเรียน"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="font-semibold text-gray-700 text-base mb-1">ยังไม่มีข้อมูลให้แสดง</p>
              <p className="text-sm text-gray-400 max-w-md">
                กรุณาเลือกหรือลากไฟล์ Excel (.xlsx) เพื่อดูตัวอย่างข้อมูลและตรวจสอบความถูกต้องก่อนนำเข้าระบบ
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 text-xs font-semibold text-red-600 hover:text-red-700 underline"
              >
                คลิกเพื่อนำเข้าไฟล์
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full" style={{ maxHeight: 560 }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/90 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ชื่อผู้ใช้ (username)</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ชื่อ</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">นามสกุล</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">เบอร์โทรศัพท์</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">บทบาท</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedPreviewData.map((row, i) => {
                      const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
                      const isDuplicateUser = Boolean(row.username && existingUsernames.includes(String(row.username).trim()))
                      const isDuplicateName = Boolean(fullName && existingTeacherNames.includes(fullName))
                      const valid = isRowValid(row, existingUsernames, existingTeacherNames)
                      const phoneStatus = validatePhone(row.phone)
                      const empty = <span className="text-red-400 italic text-xs">ว่าง</span>

                      let statusLabel = '✓ พร้อม'
                      let statusCls = 'text-green-700 bg-green-100'
                      if (!valid) {
                        if (isDuplicateUser) {
                          statusLabel = '⚠ ชื่อผู้ใช้ซ้ำ'
                          statusCls = 'text-red-700 bg-red-100'
                        } else if (isDuplicateName) {
                          statusLabel = '⚠ ชื่อ-นามสกุลซ้ำ'
                          statusCls = 'text-red-700 bg-red-100'
                        } else {
                          statusLabel = '⚠ ข้อมูลไม่ครบ'
                          statusCls = 'text-amber-700 bg-amber-100'
                        }
                      }

                      return (
                        <tr key={i} className={`transition-colors ${!valid ? 'bg-amber-50/40' : 'hover:bg-gray-50/70'}`}>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {row.username ? (
                              isDuplicateUser ? (
                                <span className="inline-flex items-center gap-1 font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs font-semibold">
                                  {row.username} <span className="text-[10px] text-red-500 font-normal">(ชื่อผู้ใช้ซ้ำ)</span>
                                </span>
                              ) : (
                                <span className="font-mono text-gray-800">{row.username}</span>
                              )
                            ) : empty}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{row.firstName || empty}</td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{row.lastName || empty}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.phone ? (
                              <div>
                                <span className={`font-mono text-xs ${!phoneStatus.isValid ? 'text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200' : 'text-gray-700'}`}>
                                  {normalizePhone(row.phone) || row.phone}
                                </span>
                                {!phoneStatus.isValid && (
                                  <p className="text-[10px] text-red-500 font-medium mt-0.5">{phoneStatus.message}</p>
                                )}
                              </div>
                            ) : (
                              <div>
                                {empty}
                                <p className="text-[10px] text-red-500 font-medium mt-0.5">กรุณากรอกเบอร์โทรศัพท์</p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              ครูผู้สอน
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 bg-white">
                <span>แสดง {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="text-xs text-gray-600 font-medium">
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Confirmation Modal (Before Upload) */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">ยืนยันการนำเข้าข้อมูล</h3>
                    <p className="text-xs text-gray-500">ตรวจพบรายการข้อมูลครูที่ไม่พร้อมนำเข้า</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs text-amber-900 leading-relaxed">
                  ตรวจพบข้อมูล <strong>ไม่พร้อมนำเข้า {invalidCount} รายการ</strong> จากทั้งหมด {previewData.length} รายการ (ระบบจะนำเข้าเฉพาะ <strong>{validCount} รายการที่พร้อม</strong> และข้ามรายการที่ไม่พร้อม)
                </div>

                <h4 className="text-xs font-bold text-gray-700 mb-2">ตัวอย่างรายการที่ไม่พร้อมนำเข้า:</h4>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {previewData
                    .map((row, idx) => ({ row, idx }))
                    .filter(({ row }) => !isRowValid(row, existingUsernames, existingTeacherNames))
                    .slice(0, 10)
                    .map(({ row, idx }) => {
                      const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
                      const isDuplicateUser = Boolean(row.username && existingUsernames.includes(String(row.username).trim()))
                      const isDuplicateName = Boolean(fullName && existingTeacherNames.includes(fullName))
                      const phoneValid = validatePhone(row.phone).isValid
                      let issue = 'ข้อมูลไม่ครบ'
                      if (isDuplicateUser) issue = 'ชื่อผู้ใช้ซ้ำ'
                      else if (isDuplicateName) issue = 'ชื่อ-นามสกุลซ้ำ'
                      else if (!phoneValid) issue = 'เบอร์โทรไม่ถูกต้อง'

                      return (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500">แถวที่ {idx + 2}</span>
                            <span className="font-medium text-gray-800">{fullName || row.username || 'ไม่ระบุชื่อ'}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                            {issue}
                          </span>
                        </div>
                      )
                    })}
                  {invalidCount > 10 && (
                    <p className="text-[11px] text-gray-400 text-center pt-1">และอีก {invalidCount - 10} รายการ...</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  ยกเลิก เพื่อแก้ไขไฟล์
                </button>
                <button
                  onClick={executeImport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  ดำเนินการนำเข้าเฉพาะ ({validCount} รายการ)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Result Modal (Post Upload - แสดงผลและโชว์ข้อมูลที่ไม่ได้อัพโหลด) */}
        {importResult && importResult.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    importResult.skipped > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {importResult.skipped > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">ผลการนำเข้าข้อมูลคุณครู</h3>
                    <p className="text-xs text-gray-500">รายงานสรุปรายการที่นำเข้าสำเร็จและรายการที่ไม่ได้อัพโหลด</p>
                  </div>
                </div>
                <button
                  onClick={() => setImportResult(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="ปิด"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="p-5 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-emerald-800 block">นำเข้าสำเร็จ</span>
                      <span className="text-2xl font-bold text-emerald-700">{importResult.imported}</span>
                      <span className="text-[11px] text-emerald-600 ml-1">รายการ</span>
                    </div>
                  </div>
                  <div className={`border rounded-xl p-3.5 flex items-center gap-3 ${
                    importResult.skipped > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      importResult.skipped > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${importResult.skipped > 0 ? 'text-amber-800' : 'text-gray-500'}`}>
                        ไม่ได้อัพโหลด
                      </span>
                      <span className={`text-2xl font-bold ${importResult.skipped > 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                        {importResult.skipped}
                      </span>
                      <span className={`text-[11px] ml-1 ${importResult.skipped > 0 ? 'text-amber-600' : 'text-gray-400'}`}>รายการ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body / Skipped Records List */}
              <div className="px-5 py-2 overflow-y-auto flex-1">
                {importResult.skipped > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <span>รายการข้อมูลที่ไม่ได้อัพโหลด</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {importResult.skippedDetails.length || importResult.skipped} รายการ
                        </span>
                      </h4>
                      <span className="text-[11px] text-gray-400">กรุณาตรวจสอบและแก้ไขไฟล์ก่อนนำเข้าใหม่</span>
                    </div>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {importResult.skippedDetails.map((item, idx) => (
                        <div key={idx} className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3 text-sm">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              {item.row && (
                                <span className="font-mono text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-2xs">
                                  แถวที่ {item.row}
                                </span>
                              )}
                              <span className="font-semibold text-gray-900">{item.name || item.username || 'ไม่ระบุชื่อ'}</span>
                              {item.username && item.username !== item.name && (
                                <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  @{item.username}
                                </span>
                              )}
                            </div>
                            {item.phone && (
                              <span className="font-mono text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                                {item.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.reasons.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md"
                              >
                                <span className="text-red-500">✕</span> {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="font-bold text-gray-800 text-base mb-1">นำเข้าข้อมูลสำเร็จครบถ้วน 100%</h4>
                    <p className="text-xs text-gray-500 max-w-sm">
                      ข้อมูลคุณครูทั้งหมด {importResult.imported} รายการถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว ไม่พบข้อผิดพลาดหรือข้อมูลที่ถูกข้าม
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setImportResult(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  ปิดหน้าต่าง
                </button>
                <Link
                  href="/admin/users"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>ไปยังหน้ารายการผู้ใช้งาน</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
