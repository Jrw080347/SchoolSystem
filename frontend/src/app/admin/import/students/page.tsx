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

interface StudentRow {
  studentCode?: string
  firstName?: string
  lastName?: string
  gender?: string
  dateOfBirth?: string
  parentUsername?: string
  parentFirstName?: string
  parentLastName?: string
  parentPhone?: string
  relationship?: string
  parentPassword?: string
  classroom?: string | number
}

interface SkippedDetail {
  row?: number
  studentName?: string
  studentCode?: string
  classroom?: string
  reasons: string[]
}

interface ImportResultState {
  isOpen: boolean
  imported: number
  skipped: number
  skippedDetails: SkippedDetail[]
}

export function normalizeDateOfBirth(val?: any): string {
  if (val === undefined || val === null || val === '') return ''

  if (val instanceof Date && !isNaN(val.getTime())) {
    let y = val.getFullYear()
    if (y > 2400) y -= 543
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Excel serial number (e.g. 42170, "42170", 42170.0)
  const num = typeof val === 'number' ? val : (typeof val === 'string' && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? Number(val.trim()) : null)
  if (num !== null && num > 1000 && num < 100000) {
    try {
      if (XLSX.SSF && typeof XLSX.SSF.parse_date_code === 'function') {
        const parsed = XLSX.SSF.parse_date_code(num)
        if (parsed && parsed.y && parsed.m && parsed.d) {
          let y = parsed.y
          if (y > 2400) y -= 543
          const m = String(parsed.m).padStart(2, '0')
          const d = String(parsed.d).padStart(2, '0')
          return `${y}-${m}-${d}`
        }
      }
      const utcDays = num - 25569
      const date = new Date(utcDays * 86400 * 1000)
      if (!isNaN(date.getTime())) {
        let y = date.getUTCFullYear()
        if (y > 2400) y -= 543
        const m = String(date.getUTCMonth() + 1).padStart(2, '0')
        const d = String(date.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    } catch {}
  }

  let str = String(val).trim()
  if (!str) return ''

  // Convert Thai numerals (๑, ๒, ...)
  const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  thaiNumerals.forEach((ch, idx) => {
    str = str.replaceAll(ch, String(idx))
  })

  // Strip time if present
  str = str.replace(/[T\s]\d{1,2}:\d{1,2}(:\d{1,2})?.*$/, '').trim()

  // Thai month names
  const THAI_MONTHS: Record<string, number> = {
    'มกราคม': 1, 'ม.ค.': 1, 'ม.ค': 1,
    'กุมภาพันธ์': 2, 'ก.พ.': 2, 'ก.พ': 2,
    'มีนาคม': 3, 'มี.ค.': 3, 'มี.ค': 3,
    'เมษายน': 4, 'เม.ย.': 4, 'เม.ย': 4,
    'พฤษภาคม': 5, 'พ.ค.': 5, 'พ.ค': 5,
    'มิถุนายน': 6, 'มิ.ย.': 6, 'มิ.ย': 6,
    'กรกฎาคม': 7, 'ก.ค.': 7, 'ก.ค': 7,
    'สิงหาคม': 8, 'ส.ค.': 8, 'ส.ค': 8,
    'กันยายน': 9, 'ก.ย.': 9, 'ก.ย': 9,
    'ตุลาคม': 10, 'ต.ค.': 10, 'ต.ค': 10,
    'พฤศจิกายน': 11, 'พ.ย.': 11, 'พ.ย': 11,
    'ธันวาคม': 12, 'ธ.ค.': 12, 'ธ.ค': 12
  }

  for (const [mName, mNum] of Object.entries(THAI_MONTHS)) {
    if (str.includes(mName)) {
      const stripped = str.replace(mName, ' ').trim()
      const parts = stripped.split(/[\s\-/.+]+/).filter(Boolean)
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10)
        let year = parseInt(parts[1], 10)
        if (year >= 40 && year <= 99) year += 2500
        if (year > 2400) year -= 543
        if (year < 100) year += 2000
        if (!isNaN(day) && !isNaN(year) && day >= 1 && day <= 31) {
          const m = String(mNum).padStart(2, '0')
          const d = String(day).padStart(2, '0')
          return `${year}-${m}-${d}`
        }
      }
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (ymdMatch) {
    let y = parseInt(ymdMatch[1], 10)
    if (y > 2400) y -= 543
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0')
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0')
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0')
    let y = parseInt(dmyMatch[3], 10)
    if (y > 2400) y -= 543
    return `${y}-${m}-${d}`
  }

  // 2-digit year: DD/MM/YY (e.g. 15/06/58, 15-06-58, 15/6/58)
  const dmy2Match = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/)
  if (dmy2Match) {
    const d = String(parseInt(dmy2Match[1], 10)).padStart(2, '0')
    const m = String(parseInt(dmy2Match[2], 10)).padStart(2, '0')
    const rawY = parseInt(dmy2Match[3], 10)
    const y = rawY >= 40 ? rawY + 2500 - 543 : rawY + 2000
    return `${y}-${m}-${d}`
  }

  // Compact 8-digit YYYYMMDD
  const compactMatch = str.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compactMatch) {
    let y = parseInt(compactMatch[1], 10)
    if (y > 2400) y -= 543
    const m = compactMatch[2]
    const d = compactMatch[3]
    return `${y}-${m}-${d}`
  }

  try {
    const date = new Date(str)
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      let y = date.getFullYear()
      if (y > 2400) y -= 543
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  } catch {}

  return str
}

export function formatDateToDDMMYYYY(val?: any): string {
  const normalized = normalizeDateOfBirth(val)
  if (!normalized) return ''
  const parts = normalized.split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return normalized
}

function formatClassroom(code?: string | number): string {
  if (!code) return ''
  const num = typeof code === 'number' ? code : parseInt(String(code).trim(), 10)
  if (isNaN(num)) return String(code)
  const grade = Math.floor(num / 100)
  const room = num % 100
  if (grade < 1 || grade > 6 || room < 1) return String(code)
  return `ป.${grade} ห้อง ${room}`
}

// ไม่ต้องกรอก studentCode, อีเมล และ Username ผู้ปกครอง (ระบบจะใช้เบอร์โทรศัพท์ผู้ปกครองเป็น Username อัตโนมัติ เพื่อให้ผู้ปกครองที่มีลูกหลายคนใช้บัญชีเดียวกันได้)
const REQUIRED_FIELDS: (keyof StudentRow)[] = [
  'firstName', 'lastName', 'gender', 'dateOfBirth',
  'parentFirstName', 'parentLastName', 'relationship'
]

function isRowValid(row: StudentRow, existingCodesList: string[] = [], existingNamesList: string[] = []): boolean {
  const fieldsOk = REQUIRED_FIELDS.every(f => row[f] && String(row[f]).trim() !== '')
  if (!fieldsOk) return false
  if (row.gender) {
    const g = String(row.gender).trim().toUpperCase()
    if (!['MALE', 'FEMALE', 'ชาย', 'หญิง'].includes(g)) return false
  } else {
    return false
  }
  if (row.studentCode && existingCodesList.includes(String(row.studentCode).trim())) {
    return false
  }
  const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
  if (fullName && existingNamesList.includes(fullName)) {
    return false
  }
  return true
}

export default function ImportStudents() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<StudentRow[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const role = Cookies.get('role') || 'ADMIN'

  // ปี พ.ศ. 2 หลักสุดท้าย เช่น 2567 -> 67, 2569 -> 69
  const currentBeYear = new Date().getFullYear() + 543
  const yearPrefix = String(currentBeYear % 100).padStart(2, '0')

  const [startSeq, setStartSeq] = useState(1)
  const [existingCodes, setExistingCodes] = useState<string[]>([])
  const [existingNames, setExistingNames] = useState<string[]>([])
  const [activeYearPrefix, setActiveYearPrefix] = useState(yearPrefix)
  const [importResult, setImportResult] = useState<ImportResultState | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetchSequenceInfo = useCallback(async () => {
    // 1. ลองเรียก endpoint sequence โดยตรง
    try {
      const res: any = await api.get('/admin/import/students/next-sequence')
      const payload = res?.data?.nextSeq != null ? res.data : (res?.nextSeq != null ? res : null)
      if (payload) {
        if (payload.nextSeq != null) setStartSeq(parseInt(String(payload.nextSeq), 10) || 1)
        if (payload.yearPrefix) setActiveYearPrefix(String(payload.yearPrefix))
        if (Array.isArray(payload.existingCodes)) setExistingCodes(payload.existingCodes.map((c: any) => String(c)))
        if (Array.isArray(payload.existingNames)) setExistingNames(payload.existingNames.map((n: any) => String(n)))
        return
      }
    } catch {
      // หาก backend ยังไม่รีสตาร์ท endpoint นี้จะไป fallback ดึงจากรายการผู้ใช้
    }

    // 2. Fallback: ดึงข้อมูลจาก /admin/users เพื่อคำนวณรหัสนักเรียนล่าสุดในระบบ
    try {
      const usersRes: any = await api.get('/admin/users')
      const usersList: any[] = Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []
      const codes = usersList
        .filter(u => u.username && String(u.username).startsWith(yearPrefix))
        .map(u => String(u.username).trim())
      setExistingCodes(codes)
      const names = usersList
        .filter(u => u.firstName && u.lastName)
        .map(u => `${u.firstName} ${u.lastName}`.trim())
      setExistingNames(names)

      let maxSeq = 0
      codes.forEach(c => {
        if (c.length >= yearPrefix.length + 3) {
          const num = parseInt(c.substring(yearPrefix.length), 10)
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num
          }
        }
      })
      setStartSeq(maxSeq + 1)
    } catch {
      // fallback ค่าเริ่มต้น
    }
  }, [yearPrefix])

  useEffect(() => {
    fetchSequenceInfo()
  }, [fetchSequenceInfo])

  const validCount = previewData.filter(row => isRowValid(row, existingCodes, existingNames)).length
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
    fetchSequenceInfo()

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<StudentRow>(sheet)
        const normalizedJson = json.map(row => {
          let parentPhone = row.parentPhone !== undefined && row.parentPhone !== null ? String(row.parentPhone).trim() : ''
          const digits = parentPhone.replace(/\D/g, '')
          if (digits.length === 9 && ['6', '8', '9'].includes(digits.charAt(0))) {
            parentPhone = '0' + digits
          } else if (digits.length === 10 && ['06', '08', '09'].some(p => digits.startsWith(p))) {
            parentPhone = digits
          }
          const rawParentPassword = row.parentPassword !== undefined && row.parentPassword !== null ? String(row.parentPassword).trim() : ''
          const parentPassword = rawParentPassword || '123456'
          const normalizedDob = normalizeDateOfBirth(row.dateOfBirth)
          return {
            ...row,
            dateOfBirth: normalizedDob || (row.dateOfBirth ? String(row.dateOfBirth) : ''),
            parentPassword,
            parentPhone: parentPhone || row.parentPhone
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
  }, [fetchSequenceInfo])

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
      const exportRows = previewData.map(r => {
        let parentPhone = r.parentPhone !== undefined && r.parentPhone !== null ? String(r.parentPhone).trim() : ''
        const digits = parentPhone.replace(/\D/g, '')
        if (digits.length === 9 && ['6', '8', '9'].includes(digits.charAt(0))) {
          parentPhone = '0' + digits
        } else if (digits.length === 10 && ['06', '08', '09'].some(p => digits.startsWith(p))) {
          parentPhone = digits
        }
        return {
          studentCode: r.studentCode || '',
          firstName: r.firstName || '',
          lastName: r.lastName || '',
          gender: r.gender || '',
          dateOfBirth: normalizeDateOfBirth(r.dateOfBirth) || (r.dateOfBirth ? String(r.dateOfBirth) : ''),
          classroom: r.classroom || '',
          parentFirstName: r.parentFirstName || '',
          parentLastName: r.parentLastName || '',
          parentPhone: parentPhone || '',
          relationship: r.relationship || '',
          parentPassword: r.parentPassword || '123456',
          parentUsername: r.parentUsername || ''
        }
      })
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Students')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const normalizedBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      formData.append('file', normalizedBlob, selectedFile.name)
    } catch {
      formData.append('file', selectedFile)
    }
    try {
      const res: any = await api.post('/admin/import/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const data = res?.data || res
      const imported = data?.imported ?? data?.data?.imported ?? 0
      const skipped = data?.skipped ?? data?.data?.skipped ?? 0
      const rawSkippedDetails = data?.skippedDetails ?? data?.data?.skippedDetails ?? []

      const mappedDetails: SkippedDetail[] = (Array.isArray(rawSkippedDetails) ? rawSkippedDetails : []).map((item: any) => {
        const previewRow = typeof item.row === 'number' && item.row >= 2 ? previewData[item.row - 2] : null
        const studentName = item.studentName || item.name || (previewRow ? `${previewRow.firstName || ''} ${previewRow.lastName || ''}`.trim() : '') || 'ไม่ระบุชื่อ'
        const studentCode = item.studentCode || (previewRow?.studentCode) || ''
        const classroom = previewRow ? formatClassroom(previewRow.classroom) : ''
        const reasons = Array.isArray(item.reasons) ? item.reasons : (item.reasons ? [String(item.reasons)] : ['ข้อมูลไม่ถูกต้อง'])
        return {
          row: item.row,
          studentName,
          studentCode,
          classroom,
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
        toast.success(`นำเข้าข้อมูลนักเรียนสำเร็จ ${imported} รายการ${skipped > 0 ? ` (ข้ามข้อมูล ${skipped} รายการ)` : ''}`)
      } else {
        toast.error(`ไม่สามารถนำเข้าได้ เนื่องจากข้อมูลทั้งหมดถูกข้าม (${skipped} รายการ)`)
      }
      clearFile()
      fetchSequenceInfo()
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!selectedFile) return toast.error('กรุณาเลือกไฟล์ Excel')
    if (validCount === 0) return toast.error('ไม่มีข้อมูลที่พร้อมอัพโหลด กรุณาแก้ไขข้อมูลในไฟล์ก่อน')
    if (invalidCount > 0) {
      setShowConfirmModal(true)
      return
    }
    executeImport()
  }

  const downloadTemplate = () => {
    // เทมเพลต: ไม่ต้องกรอก studentCode, อีเมล และ Username ผู้ปกครอง (ระบบจะใช้เบอร์โทรศัพท์ผู้ปกครองเป็น Username ให้ผู้ปกครองอัตโนมัติ)
    const templateData = [
      { firstName: 'สมชาย', lastName: 'ใจดี', gender: 'MALE', dateOfBirth: '2015-06-15', classroom: 101, parentFirstName: 'สมศักดิ์', parentLastName: 'ใจดี', parentPhone: '0812345678', relationship: 'บิดา', parentPassword: 'P@ssw0rd' },
      { firstName: 'สมหญิง', lastName: 'รักเรียน', gender: 'FEMALE', dateOfBirth: '2015-03-22', classroom: 203, parentFirstName: 'สมศรี', parentLastName: 'รักเรียน', parentPhone: '0898765432', relationship: 'มารดา', parentPassword: 'P@ssw0rd' },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, 'template_import_students.xlsx')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูลนักเรียนและผู้ปกครอง</h1>

            </div>
            <Link href="/admin/import" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              ← กลับ
            </Link>
          </div>
        </div>

        {/* Upload & Summary Card (Side-by-Side: ย่อตรงไฟล์เล็กลง นำสรุปข้อมูลมาไว้ข้างๆ) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* 1. ย่อตรงไฟลเล็กลง: Compact File Upload Dropzone */}
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

        {/* Full-width Enlarged Preview Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-gray-800 text-sm">ตัวอย่างข้อมูล</h3>
            <span className="text-xs text-gray-500">
              {previewData.length > 0 ? `แสดงข้อมูลแล้ว ${previewData.length} รายการ (พร้อมนำเข้า ${validCount} รายการ, ไม่พร้อม ${invalidCount} รายการ)` : 'รอการนำเข้า'}
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
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">
                        รหัสนักเรียน
                      </th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ชื่อ</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">นามสกุล</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">เพศ</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">วันเกิด</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ห้องเรียน</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ผู้ปกครอง</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">Username ผู้ปกครอง</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">เบอร์โทรผู้ปกครอง</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">ความสัมพันธ์</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-600 whitespace-nowrap">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedPreviewData.map((row, i) => {
                      const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
                      const isDuplicateCode = Boolean(row.studentCode && existingCodes.includes(String(row.studentCode).trim()))
                      const isDuplicateName = Boolean(fullName && existingNames.includes(fullName))
                      const valid = isRowValid(row, existingCodes, existingNames)
                      const empty = <span className="text-red-400 italic text-xs">ว่าง</span>

                      const globalIndex = startIndex + i
                      const precedingBlankCount = previewData.slice(0, globalIndex).filter(r => !r.studentCode).length
                      const autoSeq = startSeq + precedingBlankCount
                      const autoCode = `${activeYearPrefix}${String(autoSeq).padStart(3, '0')}`

                      const rawPhone = row.parentPhone ? String(row.parentPhone).replace(/\D/g, '').trim() : ''
                      const formattedPhone = rawPhone.length === 9 && ['6', '8', '9'].includes(rawPhone.charAt(0)) ? `0${rawPhone}` : rawPhone
                      const parentUser = row.parentUsername || formattedPhone || row.studentCode || autoCode
                      const parentUserSource = row.parentUsername ? '' : formattedPhone ? '(เบอร์โทร)' : '(รหัสนักเรียน)'

                      return (
                        <tr key={i} className={`transition-colors ${!valid ? 'bg-amber-50/40' : 'hover:bg-gray-50/70'}`}>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {row.studentCode ? (
                              isDuplicateCode ? (
                                <span className="inline-flex items-center gap-1 font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs font-semibold">
                                  {row.studentCode} <span className="text-[10px] text-red-500 font-normal">(รหัสซ้ำ)</span>
                                </span>
                              ) : (
                                <span className="font-mono text-gray-800">{row.studentCode}</span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-xs font-semibold">
                                {autoCode}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{row.firstName || empty}</td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{row.lastName || empty}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {row.gender ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                                {row.gender === 'MALE' ? 'ชาย' : row.gender === 'FEMALE' ? 'หญิง' : row.gender}
                              </span>
                            ) : empty}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateToDDMMYYYY(row.dateOfBirth) || empty}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {row.classroom ? (
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium">
                                {formatClassroom(row.classroom)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {row.parentFirstName && row.parentLastName ? `${row.parentFirstName} ${row.parentLastName}` : empty}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-semibold">
                              {parentUser}
                            </span>
                            {parentUserSource && (
                              <span className="ml-1 text-[11px] text-gray-400 font-normal">{parentUserSource}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.parentPhone || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.relationship || empty}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              let statusLabel = '✓ พร้อม'
                              let statusCls = 'text-green-700 bg-green-100'
                              if (!valid) {
                                if (isDuplicateCode) {
                                  statusLabel = '⚠ รหัสนักเรียนซ้ำ'
                                  statusCls = 'text-red-700 bg-red-100'
                                } else if (isDuplicateName) {
                                  statusLabel = '⚠ ชื่อ-นามสกุลซ้ำ'
                                  statusCls = 'text-red-700 bg-red-100'
                                } else if (!row.gender || !['MALE', 'FEMALE', 'ชาย', 'หญิง'].includes(String(row.gender).trim().toUpperCase())) {
                                  statusLabel = '⚠ ยังไม่ระบุเพศ'
                                  statusCls = 'text-amber-700 bg-amber-100'
                                } else {
                                  statusLabel = '⚠ ข้อมูลไม่ครบ'
                                  statusCls = 'text-amber-700 bg-amber-100'
                                }
                              }
                              return (
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                                  {statusLabel}
                                </span>
                              )
                            })()}
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
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="min-w-20 text-center text-xs">หน้า {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
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
                    <p className="text-xs text-gray-500">ตรวจพบรายการข้อมูลที่ไม่พร้อมนำเข้า</p>
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
                    .filter(({ row }) => !isRowValid(row, existingCodes, existingNames))
                    .slice(0, 10)
                    .map(({ row, idx }) => {
                      const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim()
                      const isDuplicateCode = Boolean(row.studentCode && existingCodes.includes(String(row.studentCode).trim()))
                      const isDuplicateName = Boolean(fullName && existingNames.includes(fullName))
                      let issue = 'ข้อมูลไม่ครบ'
                      if (isDuplicateCode) issue = 'รหัสนักเรียนซ้ำ'
                      else if (isDuplicateName) issue = 'ชื่อ-นามสกุลซ้ำ'
                      else if (!row.gender) issue = 'ยังไม่ระบุเพศ'

                      return (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500">แถวที่ {idx + 2}</span>
                            <span className="font-medium text-gray-800">{fullName || 'ไม่ระบุชื่อ'}</span>
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
                    <h3 className="text-base font-bold text-gray-800">ผลการนำเข้าข้อมูลนักเรียนและผู้ปกครอง</h3>
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
                              <span className="font-semibold text-gray-900">{item.studentName || 'ไม่ระบุชื่อ'}</span>
                              {item.studentCode && (
                                <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {item.studentCode}
                                </span>
                              )}
                            </div>
                            {item.classroom && (
                              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                                {item.classroom}
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
                      ข้อมูลทั้งหมด {importResult.imported} รายการถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว ไม่พบข้อผิดพลาดหรือข้อมูลที่ถูกข้าม
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
