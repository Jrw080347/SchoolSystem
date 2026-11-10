'use client'

import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import {
  Calendar,
  Clock,
  School,
  Search,
  ChevronDown,
  Check,
  X,
  User,
  Trash2,
  Edit3,
  Plus,
  Layers,
  AlertCircle,
  BookOpen
} from 'lucide-react'

interface Teacher {
  id: number
  firstName: string
  lastName: string
  role: string
}

interface SubjectItem {
  id: number
  code: string
  name: string
  gradeLevel: number | null
  active: boolean
}

interface ClassroomItem {
  id: number
  name: string
  gradeLevel: number
  academicYear: string
}

interface ScheduleItem {
  id: number
  teacherSubjectId: number
  teacherName: string
  subjectName: string
  subjectCode: string
  classroomName: string
  dayOfWeek: string
  dayOfWeekTh: string
  startTime: string
  endTime: string
  academicYear: string
  semester: number
}

interface PendingSchedule {
  tempId: number
  teacherId: number
  teacherName: string
  subjectId: number
  subjectName: string
  subjectCode: string
  classroomId: number
  classroomName: string
  academicYear: string
  semester: number
  dayOfWeek: string
  dayOfWeekTh: string
  startTime: string
  endTime: string
}

const DAYS = [
  { value: 'MONDAY', label: 'วันจันทร์' },
  { value: 'TUESDAY', label: 'วันอังคาร' },
  { value: 'WEDNESDAY', label: 'วันพุธ' },
  { value: 'THURSDAY', label: 'วันพฤหัสบดี' },
  { value: 'FRIDAY', label: 'วันศุกร์' },
]

const dayLabel = (val: string) => DAYS.find(d => d.value === val)?.label || val

const DAY_THEMES: Record<string, { label: string; headerBg: string; headerText: string; cardBg: string; border: string; tagBg: string }> = {
  MONDAY: {
    label: 'วันจันทร์',
    headerBg: 'bg-amber-400',
    headerText: 'text-amber-950 font-bold',
    cardBg: 'bg-amber-50/80',
    border: 'border-amber-200',
    tagBg: 'bg-amber-100 text-amber-800',
  },
  TUESDAY: {
    label: 'วันอังคาร',
    headerBg: 'bg-pink-400',
    headerText: 'text-pink-950 font-bold',
    cardBg: 'bg-pink-50/80',
    border: 'border-pink-200',
    tagBg: 'bg-pink-100 text-pink-800',
  },
  WEDNESDAY: {
    label: 'วันพุธ',
    headerBg: 'bg-emerald-500',
    headerText: 'text-white font-bold',
    cardBg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    tagBg: 'bg-emerald-100 text-emerald-800',
  },
  THURSDAY: {
    label: 'วันพฤหัสบดี',
    headerBg: 'bg-orange-400',
    headerText: 'text-orange-950 font-bold',
    cardBg: 'bg-orange-50/80',
    border: 'border-orange-200',
    tagBg: 'bg-orange-100 text-orange-800',
  },
  FRIDAY: {
    label: 'วันศุกร์',
    headerBg: 'bg-sky-400',
    headerText: 'text-sky-950 font-bold',
    cardBg: 'bg-sky-50/80',
    border: 'border-sky-200',
    tagBg: 'bg-sky-100 text-sky-800',
  },
}

// ตรวจสอบว่าช่วงเวลา A (startA - endA) ทับซ้อนกับช่วงเวลา B (startB - endB) หรือไม่
// ใช้เครื่องหมาย < และ > แบบเคร่งครัด (Strict Inequality)
// เพื่อให้วิชาที่เรียนต่อกันพอดี เช่น 09:00 - 10:00 กับ 10:00 - 11:00 ไม่ถือว่าทับซ้อนกัน
function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  if (!startA || !endA || !startB || !endB) return false
  return startA < endB && endA > startB
}

function buildTimeSlotsFromItems(items: { startTime: string; endTime: string }[]): string[] {
  const timesSet = new Set<string>()
  items.forEach(item => {
    const start = item.startTime?.substring(0, 5) || ''
    const end = item.endTime?.substring(0, 5) || ''
    if (start && end) {
      timesSet.add(`${start}-${end}`)
    }
  })
  return Array.from(timesSet).sort((a, b) => a.localeCompare(b))
}

type ScheduleForm = {
  teacherId: string
  subjectId: string
  classroomId: string
  academicYear: string
  semester: number
  dayOfWeek: string
  startTime: string
  endTime: string
}

type BatchScheduleForm = {
  teacherId: string
  subjectId: string
  classroomId: string
  academicYear: string
  semester: number
  dayOfWeeks: string[]
  startTime: string
  endTime: string
}

function TeacherSearchSelect({
  teachers,
  value,
  onChange,
  error,
  placeholder = '-- ค้นหาหรือเลือกครู --',
}: {
  teachers: Teacher[]
  value: string
  onChange: (id: string) => void
  error?: string
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTeacher = teachers.find(t => String(t.id) === value)

  useEffect(() => {
    if (selectedTeacher) {
      setSearch(`${selectedTeacher.firstName} ${selectedTeacher.lastName}`)
    } else if (!value) {
      setSearch('')
    }
  }, [value, selectedTeacher])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (selectedTeacher) {
          setSearch(`${selectedTeacher.firstName} ${selectedTeacher.lastName}`)
        } else {
          setSearch('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedTeacher])

  const filteredTeachers = teachers.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase()
    const roleText = t.role === 'HOMEROOM_TEACHER' ? 'ครูประจำชั้น' : 'ครูผู้สอน'
    return fullName.includes(q) || roleText.includes(q)
  })

  const handleSelect = (t: Teacher) => {
    onChange(String(t.id))
    setSearch(`${t.firstName} ${t.lastName}`)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
    setIsOpen(false)
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center w-full px-3 py-2 border rounded-lg bg-white cursor-pointer transition ${error
          ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
          : isOpen
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-gray-300 hover:border-gray-400'
          }`}
        onClick={() => {
          setIsOpen(true)
          if (inputRef.current) inputRef.current.focus()
        }}
      >
        <Search size={15} className="text-gray-400 mr-2 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
          }}
          placeholder={placeholder}
          className="w-full text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 mr-1 transition"
            title="ล้างค่า"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
          {filteredTeachers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              ไม่พบข้อมูลครูที่ค้นหา &quot;{search}&quot;
            </div>
          ) : (
            filteredTeachers.map(t => {
              const isSelected = String(t.id) === value
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={`w-full px-3.5 py-2 text-left text-sm flex items-center justify-between transition ${isSelected
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'hover:bg-gray-50 text-gray-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {t.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm">{t.firstName} {t.lastName}</div>
                      <span className="text-[10px] text-gray-400">
                        {t.role === 'HOMEROOM_TEACHER' ? 'ครูประจำชั้น' : 'ครูผู้สอน'}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-red-600" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function TimePicker24({
  value,
  onChange,
  error,
  placeholder = '09:00',
}: {
  value: string
  onChange: (time: string) => void
  error?: string
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const PRESET_TIMES = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, '')
    if (val.length === 4 && !val.includes(':')) {
      val = `${val.slice(0, 2)}:${val.slice(2)}`
    }
    if (val.length <= 5) {
      onChange(val)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center w-full px-2.5 py-2 border rounded-lg bg-white transition cursor-text ${error
          ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
          : isOpen
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-gray-300 hover:border-gray-400'
          }`}
        onClick={() => {
          setIsOpen(true)
          if (inputRef.current) inputRef.current.focus()
        }}
      >
        <Clock size={13} className="text-gray-400 mr-1.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          maxLength={5}
          className="w-full text-xs font-semibold bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto p-2">
          <div className="text-[10px] font-bold text-gray-400 px-1 pb-1 mb-1 border-b border-gray-100 uppercase tracking-wider flex justify-between items-center">
            <span>เลือกเวลา </span>
            <span className="text-gray-300">คลิกหรือพิมพ์</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {PRESET_TIMES.map(t => {
              const isSelected = t === value
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onChange(t)
                    setIsOpen(false)
                  }}
                  className={`px-2 py-1.5 text-xs rounded-md text-center font-medium transition ${isSelected
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSchedules() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [pendingList, setPendingList] = useState<PendingSchedule[]>([])
  const [batchForm, setBatchForm] = useState<BatchScheduleForm>({
    teacherId: '',
    subjectId: '',
    classroomId: '',
    academicYear: '2568',
    semester: 1,
    dayOfWeeks: ['MONDAY'],
    startTime: '09:00',
    endTime: '10:00'
  })
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Edit State
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ScheduleForm>({
    teacherId: '',
    subjectId: '',
    classroomId: '',
    academicYear: '2568',
    semester: 1,
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00'
  })

  // Delete Confirm State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ScheduleItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View Mode: 'classroom' (ตารางตามห้อง) | 'teacher' (ตารางตามครู) | 'list' (รายการทั้งหมด)
  const [viewMode, setViewMode] = useState<'classroom' | 'teacher' | 'list'>('classroom')
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  function getTeacherName(id: string) {
    const t = teachers.find(t => String(t.id) === id)
    return t ? `${t.firstName} ${t.lastName}` : ''
  }
  function getSubject(id: string) {
    return subjects.find(s => String(s.id) === id)
  }
  function getClassroom(id: string) {
    return classrooms.find(c => String(c.id) === id)
  }

  // Add Modal Preview Data (Teacher schedules + pending items)
  const addTeacherName = getTeacherName(batchForm.teacherId)
  const existingTeacherSchedules = addTeacherName
    ? schedules.filter(s => s.teacherName === addTeacherName)
    : []

  const previewExistingItems = existingTeacherSchedules.map(s => ({
    id: `existing-${s.id}`,
    type: 'existing' as const,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    subjectCode: s.subjectCode,
    subjectName: s.subjectName,
    classroomName: s.classroomName,
    teacherName: s.teacherName,
  }))

  const previewPendingItems = pendingList.map(p => ({
    id: `pending-${p.tempId}`,
    type: 'pending' as const,
    tempId: p.tempId,
    dayOfWeek: p.dayOfWeek,
    startTime: p.startTime,
    endTime: p.endTime,
    subjectCode: p.subjectCode,
    subjectName: p.subjectName,
    classroomName: p.classroomName,
    teacherName: p.teacherName,
  }))

  const allAddPreviewItems = [...previewExistingItems, ...previewPendingItems]
  const addTimeSlots = buildTimeSlotsFromItems(allAddPreviewItems)

  // Edit Modal Preview Data (Teacher schedules (excluding current) + editing item)
  const editTeacherName = getTeacherName(editForm.teacherId)
  const existingEditTeacherSchedules = editTeacherName
    ? schedules.filter(s => s.teacherName === editTeacherName && s.id !== editingId)
    : []

  const editingSubjectObj = getSubject(editForm.subjectId)
  const editingClassroomObj = getClassroom(editForm.classroomId)
  const editingPreviewItem = {
    id: `editing-${editingId}`,
    type: 'editing' as const,
    scheduleId: editingId,
    dayOfWeek: editForm.dayOfWeek,
    startTime: editForm.startTime,
    endTime: editForm.endTime,
    subjectCode: editingSubjectObj?.code || '',
    subjectName: editingSubjectObj?.name || '',
    classroomName: editingClassroomObj?.name || '',
    teacherName: editTeacherName,
  }

  const previewExistingEditItems = existingEditTeacherSchedules.map(s => ({
    id: `existing-${s.id}`,
    type: 'existing' as const,
    scheduleId: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    subjectCode: s.subjectCode,
    subjectName: s.subjectName,
    classroomName: s.classroomName,
    teacherName: s.teacherName,
  }))

  const allEditPreviewItems = [...previewExistingEditItems, editingPreviewItem]
  const editTimeSlots = buildTimeSlotsFromItems(allEditPreviewItems)

  // Filters for List View
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterClassroom, setFilterClassroom] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const role = Cookies.get('role') || 'ADMIN'

  const showFieldErrors = (errors: Record<string, string>) => {
    const mapped = Object.fromEntries(Object.entries(errors).map(([key, message]) => [key.toLowerCase().split('.').pop()?.replace(/[_-]/g, '') || key, message]))
    const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['teacherid', 'subjectid', 'classroomid', 'starttime', 'endtime', 'academicyear', 'days'].includes(key)))
    if (!Object.keys(known).length) return false
    setFieldErrors(known)
    return true
  }

  const showApiError = (err: unknown) => {
    const parsed = parseApiError(err)
    if (!showFieldErrors(parsed.fieldErrors)) toast.error(parsed.message)
  }

  const clearFieldError = (field: string) => setFieldErrors(prev => ({ ...prev, [field]: '' }))
  const fieldError = (field: string) => fieldErrors[field] && <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-600">{fieldErrors[field]}</p>
  const fieldClass = (field: string) => fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
  const fieldAttrs = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${field}-error` : undefined })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [teacherRes, homeroomRes, subjectRes, classroomRes, schedRes] = await Promise.all([
        api.get('/admin/users?role=TEACHER'),
        api.get('/admin/users?role=HOMEROOM_TEACHER'),
        api.get('/admin/subjects'),
        api.get('/admin/classrooms'),
        api.get('/admin/schedules'),
      ]) as any[]

      const allTeachers: Teacher[] = [...(teacherRes.data || []), ...(homeroomRes.data || [])]
      const allClassrooms: ClassroomItem[] = classroomRes.data || []

      setTeachers(allTeachers)
      setSubjects((subjectRes.data || []).filter((s: SubjectItem) => s.active))
      setClassrooms(allClassrooms)
      setSchedules(schedRes.data || [])

      if (allClassrooms.length > 0) {
        setSelectedClassroomId(prev => prev || String(allClassrooms[0].id))
      }
      if (allTeachers.length > 0) {
        setSelectedTeacherId(prev => prev || String(allTeachers[0].id))
      }
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลตารางสอนได้').message)
    }
  }

  const resetBatchForm = () => {
    setBatchForm({
      teacherId: '',
      subjectId: '',
      classroomId: selectedClassroomId || '',
      academicYear: '2568',
      semester: 1,
      dayOfWeeks: ['MONDAY'],
      startTime: '09:00',
      endTime: '10:00'
    })
    setFieldErrors({})
  }


  const getClassroomGradeLevel = (classroomId: string): number | null => {
    if (!classroomId) return null
    const room = classrooms.find(c => String(c.id) === classroomId)
    if (!room) return null
    if (room.gradeLevel) return room.gradeLevel
    const match = room.name.match(/[ป\.]\s*(\d+)/) || room.name.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  const getFilteredSubjects = (classroomId: string) => {
    if (!classroomId) return []
    const gradeLevel = getClassroomGradeLevel(classroomId)
    if (!gradeLevel) return subjects
    return subjects.filter(s => {
      if (s.gradeLevel != null) return s.gradeLevel === gradeLevel
      return s.name.includes(`ป.${gradeLevel}`)
    })
  }

  const validateScheduleForm = (form: any) => {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
    const errors: Record<string, string> = {
      ...(!form.teacherId ? { teacherid: 'กรุณาเลือกครูผู้สอน' } : {}),
      ...(!form.classroomId ? { classroomid: 'กรุณาเลือกห้องเรียน' } : {}),
      ...(!form.subjectId ? { subjectid: 'กรุณาเลือกรายวิชา' } : {}),
      ...(form.dayOfWeeks && form.dayOfWeeks.length === 0 ? { days: 'กรุณาเลือกอย่างน้อย 1 วัน' } : {}),
      ...(!form.startTime ? { starttime: 'กรุณาระบุเวลาเริ่ม' } : !timeRegex.test(form.startTime) ? { starttime: 'ระบุเวลา 24 ชม. เช่น 09:00' } : {}),
      ...(!form.endTime ? { endtime: 'กรุณาระบุเวลาสิ้นสุด' } : !timeRegex.test(form.endTime) ? { endtime: 'ระบุเวลา 24 ชม. เช่น 10:00' } : {}),
      ...(form.startTime && form.endTime && timeRegex.test(form.startTime) && timeRegex.test(form.endTime) && form.endTime <= form.startTime ? { endtime: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม' } : {}),
      ...(!form.academicYear.trim() ? { academicyear: 'กรุณาระบุปีการศึกษา' } : {}),
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addToPending = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateScheduleForm(batchForm)) return

    const newClassroomId = Number(batchForm.classroomId)
    const newTeacherId = Number(batchForm.teacherId)
    const newStart = batchForm.startTime
    const newEnd = batchForm.endTime
    const sub = getSubject(batchForm.subjectId)
    const cls = getClassroom(batchForm.classroomId)
    const teacherName = getTeacherName(batchForm.teacherId)

    const itemsToAdd: PendingSchedule[] = []

    for (const newDay of batchForm.dayOfWeeks) {
      // 1. ตรวจสอบการทับซ้อนในรายการที่รอเพิ่ม (pendingList)
      const roomConflictInPending = [...pendingList, ...itemsToAdd].find(p =>
        p.classroomId === newClassroomId &&
        p.dayOfWeek === newDay &&
        isTimeOverlapping(newStart, newEnd, p.startTime, p.endTime)
      )
      if (roomConflictInPending) {
        toast.error(`วัน${dayLabel(newDay)}: ห้องเรียน ${roomConflictInPending.classroomName} มีตารางเรียนวิชา ${roomConflictInPending.subjectName} เวลา ${roomConflictInPending.startTime} - ${roomConflictInPending.endTime} อยู่ในรายการแล้ว (เวลาทับซ้อนกัน)`)
        return
      }

      const teacherConflictInPending = [...pendingList, ...itemsToAdd].find(p =>
        p.teacherId === newTeacherId &&
        p.dayOfWeek === newDay &&
        isTimeOverlapping(newStart, newEnd, p.startTime, p.endTime)
      )
      if (teacherConflictInPending) {
        toast.error(`วัน${dayLabel(newDay)}: ครู${teacherConflictInPending.teacherName} มีตารางสอนห้อง ${teacherConflictInPending.classroomName} เวลา ${teacherConflictInPending.startTime} - ${teacherConflictInPending.endTime} อยู่ในรายการแล้ว (เวลาทับซ้อนกัน)`)
        return
      }

      // 2. ตรวจสอบการทับซ้อนกับตารางสอนที่มีอยู่แล้วในระบบ (schedules)
      const roomConflictInExisting = schedules.find(s =>
        s.classroomName === cls?.name &&
        s.dayOfWeek === newDay &&
        s.academicYear === batchForm.academicYear &&
        s.semester === batchForm.semester &&
        isTimeOverlapping(newStart, newEnd, s.startTime, s.endTime)
      )
      if (roomConflictInExisting) {
        toast.error(`วัน${dayLabel(newDay)}: ห้องเรียน ${roomConflictInExisting.classroomName} มีตารางสอนวิชา ${roomConflictInExisting.subjectName} (${roomConflictInExisting.startTime} - ${roomConflictInExisting.endTime}) อยู่แล้วในระบบ`)
        return
      }

      const teacherConflictInExisting = schedules.find(s =>
        s.teacherName === teacherName &&
        s.dayOfWeek === newDay &&
        s.academicYear === batchForm.academicYear &&
        s.semester === batchForm.semester &&
        isTimeOverlapping(newStart, newEnd, s.startTime, s.endTime)
      )
      if (teacherConflictInExisting) {
        toast.error(`วัน${dayLabel(newDay)}: ครู${teacherConflictInExisting.teacherName} มีตารางสอนวิชา ${teacherConflictInExisting.subjectName} ในห้อง ${teacherConflictInExisting.classroomName} (${teacherConflictInExisting.startTime} - ${teacherConflictInExisting.endTime}) อยู่แล้วในระบบ`)
        return
      }

      itemsToAdd.push({
        tempId: Date.now() + Math.random(),
        teacherId: newTeacherId,
        teacherName: teacherName,
        subjectId: Number(batchForm.subjectId),
        subjectName: sub?.name || '',
        subjectCode: sub?.code || '',
        classroomId: newClassroomId,
        classroomName: cls?.name || '',
        academicYear: batchForm.academicYear,
        semester: batchForm.semester,
        dayOfWeek: newDay,
        dayOfWeekTh: dayLabel(newDay),
        startTime: newStart,
        endTime: newEnd,
      })
    }

    setPendingList(prev => [...prev, ...itemsToAdd])
    setFieldErrors({})
    toast.success(`เพิ่มลงตารางสอนสำเร็จ (${itemsToAdd.length} วัน)`)
  }

  const removePending = (tempId: number) => setPendingList(prev => prev.filter(p => p.tempId !== tempId))

  const submitBulk = async () => {
    if (pendingList.length === 0) {
      toast.error('ยังไม่มีรายการตารางสอน')
      return
    }
    setSubmitting(true)
    try {
      const payload = pendingList.map(p => ({
        teacherId: p.teacherId,
        subjectId: p.subjectId,
        classroomId: p.classroomId,
        academicYear: p.academicYear,
        semester: p.semester,
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime
      }))
      const res: any = await api.post('/admin/schedules/bulk', payload)
      setSchedules(prev => [...prev, ...(res.data || [])])
      setPendingList([])
      setShowBatchForm(false)
      toast.success(`เพิ่ม ${payload.length} ตารางสอนเรียบร้อยแล้ว`)
    } catch (err) {
      showApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (s: ScheduleItem) => {
    setEditingId(s.id)
    const teacher = teachers.find(t => `${t.firstName} ${t.lastName}` === s.teacherName)
    const subject = subjects.find(sub => sub.code === s.subjectCode)
    const classroom = classrooms.find(c => c.name === s.classroomName)
    setEditForm({
      teacherId: teacher ? String(teacher.id) : '',
      subjectId: subject ? String(subject.id) : '',
      classroomId: classroom ? String(classroom.id) : '',
      academicYear: s.academicYear,
      semester: s.semester,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    })
    setFieldErrors({})
    setShowEditForm(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !validateScheduleForm(editForm)) return

    const cls = getClassroom(editForm.classroomId)
    const teacherName = getTeacherName(editForm.teacherId)
    const editStart = editForm.startTime
    const editEnd = editForm.endTime
    const editDay = editForm.dayOfWeek

    // ตรวจสอบการทับซ้อนกับตารางอื่นในระบบ
    const roomConflict = schedules.find(s =>
      s.id !== editingId &&
      s.classroomName === cls?.name &&
      s.dayOfWeek === editDay &&
      s.academicYear === editForm.academicYear &&
      s.semester === editForm.semester &&
      isTimeOverlapping(editStart, editEnd, s.startTime, s.endTime)
    )
    if (roomConflict) {
      toast.error(`ห้องเรียน ${roomConflict.classroomName} มีตารางสอนวิชา ${roomConflict.subjectName} (${roomConflict.startTime} - ${roomConflict.endTime}) อยู่แล้ว (เวลาทับซ้อนกัน)`)
      return
    }

    const teacherConflict = schedules.find(s =>
      s.id !== editingId &&
      s.teacherName === teacherName &&
      s.dayOfWeek === editDay &&
      s.academicYear === editForm.academicYear &&
      s.semester === editForm.semester &&
      isTimeOverlapping(editStart, editEnd, s.startTime, s.endTime)
    )
    if (teacherConflict) {
      toast.error(`ครู${teacherConflict.teacherName} มีตารางสอนวิชา ${teacherConflict.subjectName} ในห้อง ${teacherConflict.classroomName} (${teacherConflict.startTime} - ${teacherConflict.endTime}) อยู่แล้ว (เวลาทับซ้อนกัน)`)
      return
    }

    try {
      const payload = {
        teacherId: Number(editForm.teacherId),
        subjectId: Number(editForm.subjectId),
        classroomId: Number(editForm.classroomId),
        academicYear: editForm.academicYear,
        semester: editForm.semester,
        dayOfWeek: editForm.dayOfWeek,
        startTime: editForm.startTime,
        endTime: editForm.endTime
      }
      const res: any = await api.put(`/admin/schedules/${editingId}`, payload)
      setSchedules(prev => prev.map(s => s.id === editingId ? res.data : s))
      setShowEditForm(false)
      setEditingId(null)
      toast.success('แก้ไขตารางสอนเรียบร้อยแล้ว')
    } catch (err) {
      showApiError(err)
    }
  }

  // Delete Schedule
  const handleDelete = (s: ScheduleItem) => {
    setDeleteConfirmItem(s)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmItem) return
    setDeleting(true)
    try {
      await api.delete(`/admin/schedules/${deleteConfirmItem.id}`)
      setSchedules(prev => prev.filter(s => s.id !== deleteConfirmItem.id))
      toast.success('ลบตารางสอนเรียบร้อยแล้ว')
      if (editingId === deleteConfirmItem.id) {
        setShowEditForm(false)
        setEditingId(null)
      }
      setDeleteConfirmItem(null)
    } catch (err) {
      showApiError(err)
    } finally {
      setDeleting(false)
    }
  }

  const openAddForClassroom = (classroomId: string) => {
    resetBatchForm()
    setPendingList([])
    setBatchForm(prev => ({
      ...prev,
      classroomId: classroomId,
      subjectId: '',
    }))
    setShowBatchForm(true)
  }

  const openAddForTeacher = (teacherId: string) => {
    resetBatchForm()
    setPendingList([])
    setBatchForm(prev => ({
      ...prev,
      teacherId: teacherId,
    }))
    setShowBatchForm(true)
  }

  // Filtered List for Table View
  const filtered = schedules.filter(s => {
    const matchSearch = !filterTeacher ||
      s.teacherName.toLowerCase().includes(filterTeacher.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(filterTeacher.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(filterTeacher.toLowerCase())
    const matchDay = !filterDay || s.dayOfWeek === filterDay
    const matchRoom = !filterClassroom || s.classroomName === filterClassroom
    return matchSearch && matchDay && matchRoom
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginated = filtered.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [filterTeacher, filterDay, filterClassroom])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // Data for Timetable Views
  const currentClassroomObj = classrooms.find(c => String(c.id) === selectedClassroomId)
  const classroomSchedules = schedules.filter(s => s.classroomName === currentClassroomObj?.name)

  const currentTeacherObj = teachers.find(t => String(t.id) === selectedTeacherId)
  const currentTeacherName = currentTeacherObj ? `${currentTeacherObj.firstName} ${currentTeacherObj.lastName}` : ''
  const teacherSchedules = schedules.filter(s => s.teacherName === currentTeacherName)

  // Edit Preview Timetable Data
  const editClassroomObj = classrooms.find(c => String(c.id) === editForm.classroomId)
  const editRoomOtherSchedules = schedules.filter(s => s.classroomName === editClassroomObj?.name && s.id !== editingId)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-red-600" size={26} />
              จัดการตารางสอน
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              เพิ่ม ลบ แก้ไข และดูตารางสอนรายสัปดาห์ตามห้องเรียน ครูผู้สอน หรือรายการทั้งหมด
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                resetBatchForm()
                setPendingList([])
                if (viewMode === 'classroom' && selectedClassroomId) {
                  setBatchForm(prev => ({ ...prev, classroomId: selectedClassroomId, subjectId: '' }))
                } else if (viewMode === 'teacher' && selectedTeacherId) {
                  setBatchForm(prev => ({ ...prev, teacherId: selectedTeacherId }))
                }
                setShowBatchForm(true)
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm hover:shadow flex items-center gap-2"
            >
              <Plus size={18} />
              <span> เพิ่มตารางสอน</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('classroom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'classroom'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <School size={16} />
              <span>ตารางตามห้องเรียน</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('teacher')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'teacher'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <User size={16} />
              <span>ตารางตามครูผู้สอน</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'list'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Layers size={16} />
              <span>รายการทั้งหมด ({schedules.length})</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium px-2">
            {viewMode === 'classroom' && currentClassroomObj && (
              <span>ห้อง: <b className="text-gray-800">{currentClassroomObj.name}</b> • รวม <b className="text-red-600">{classroomSchedules.length}</b> คาบ</span>
            )}
            {viewMode === 'teacher' && currentTeacherObj && (
              <span>ครู: <b className="text-gray-800">{currentTeacherName}</b> • รวม <b className="text-red-600">{teacherSchedules.length}</b> คาบ</span>
            )}
            {viewMode === 'list' && (
              <span>แสดงทั้งหมด <b className="text-gray-800">{filtered.length}</b> รายการ</span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: ตารางสอนตามห้องเรียน (Classroom Timetable View) */}
        {/* ======================================================== */}
        {viewMode === 'classroom' && (
          <div className="space-y-4">
            {/* Classroom Selection Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <School size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">เลือกห้องเรียน:</span>
                </div>
                <select
                  value={selectedClassroomId}
                  onChange={e => setSelectedClassroomId(e.target.value)}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gradeLevel ? `(ชั้น ป.${c.gradeLevel})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs bg-red-50 text-red-700 font-bold px-3 py-2 rounded-lg border border-red-100">
                  รวม {classroomSchedules.length} คาบ / สัปดาห์
                </span>
                <button
                  type="button"
                  onClick={() => openAddForClassroom(selectedClassroomId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={15} />
                  <span>เพิ่มคาบในห้องนี้</span>
                </button>
              </div>
            </div>

            {/* Matrix Timetable Grid */}
            {(() => {
              const classroomTimeSlots = buildTimeSlotsFromItems(classroomSchedules)
              return classroomSchedules.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-gray-500">ยังไม่มีตารางสอนสำหรับห้องนี้</p>
                  <p className="text-sm">กดปุ่ม &quot;เพิ่มคาบในห้องนี้&quot; เพื่อเริ่มต้นสร้างตารางสอน</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-r border-gray-200 w-28">
                            วัน / คาบ
                          </th>
                          {classroomTimeSlots.map((slot, i) => (
                            <th key={slot} className="px-3 py-3 text-center text-xs font-bold text-gray-600 border-b border-r border-gray-200 last:border-r-0 min-w-[150px]">
                              <div className="text-gray-400 text-[10px] mb-0.5">คาบที่ {i + 1}</div>
                              <div>{slot}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(dayObj => {
                          const day = dayObj.value
                          return (
                            <tr key={day} className="hover:bg-gray-50/50">
                              <td className="px-4 py-4 text-sm font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                                {dayObj.label}
                              </td>
                              {classroomTimeSlots.map(slot => {
                                const matchingItems = classroomSchedules.filter(s => {
                                  if (s.dayOfWeek !== day) return false
                                  const start = s.startTime?.substring(0, 5) || ''
                                  const end = s.endTime?.substring(0, 5) || ''
                                  return `${start}-${end}` === slot
                                })

                                if (matchingItems.length === 0) {
                                  return (
                                    <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                      <div className="h-16"></div>
                                    </td>
                                  )
                                }

                                return (
                                  <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0 align-top">
                                    <div className="space-y-2">
                                      {matchingItems.map(s => (
                                        <div
                                          key={s.id}
                                          className="p-3 rounded-xl border border-gray-200 bg-white shadow-xs hover:shadow-md transition-all relative group"
                                        >
                                          <div className="mb-2">
                                            <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 py-0.5 rounded mr-1">
                                              {s.subjectCode}
                                            </span>
                                            <span className="font-bold text-xs text-gray-900">
                                              {s.subjectName}
                                            </span>
                                          </div>
                                          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 text-[11px] text-gray-600">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <User size={11} className="shrink-0 text-gray-400" />
                                              <span className="truncate">{s.teacherName}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => openEdit(s)}
                                                title="แก้ไขคาบนี้"
                                                className="w-6 h-6 rounded bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-600 flex items-center justify-center transition"
                                              >
                                                <Edit3 size={12} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDelete(s)}
                                                title="ลบคาบนี้"
                                                className="w-6 h-6 rounded bg-gray-100 hover:bg-red-500 hover:text-white text-gray-400 flex items-center justify-center transition"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: ตารางสอนตามครูผู้สอน (Teacher Timetable View) */}
        {/* ======================================================== */}
        {viewMode === 'teacher' && (
          <div className="space-y-4">
            {/* Teacher Selection Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">เลือกครูผู้สอน:</span>
                </div>
                <div className="w-72">
                  <TeacherSearchSelect
                    teachers={teachers}
                    value={selectedTeacherId}
                    onChange={id => setSelectedTeacherId(id)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs bg-red-50 text-red-700 font-bold px-3 py-2 rounded-lg border border-red-100">
                  รวม {teacherSchedules.length} คาบ / สัปดาห์
                </span>
                <button
                  type="button"
                  onClick={() => openAddForTeacher(selectedTeacherId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={15} />
                  <span>เพิ่มคาบสอนครูท่านนี้</span>
                </button>
              </div>
            </div>

            {/* Matrix Timetable Grid */}
            {(() => {
              const teacherTimeSlots = buildTimeSlotsFromItems(teacherSchedules)
              return teacherSchedules.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-gray-500">ยังไม่มีตารางสอนสำหรับครูท่านนี้</p>
                  <p className="text-sm">กดปุ่ม &quot;เพิ่มคาบสอนครูท่านนี้&quot; เพื่อเริ่มต้นสร้างตารางสอน</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-r border-gray-200 w-28">
                            วัน / คาบ
                          </th>
                          {teacherTimeSlots.map((slot, i) => (
                            <th key={slot} className="px-3 py-3 text-center text-xs font-bold text-gray-600 border-b border-r border-gray-200 last:border-r-0 min-w-[150px]">
                              <div className="text-gray-400 text-[10px] mb-0.5">คาบที่ {i + 1}</div>
                              <div>{slot}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(dayObj => {
                          const day = dayObj.value
                          return (
                            <tr key={day} className="hover:bg-gray-50/50">
                              <td className="px-4 py-4 text-sm font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                                {dayObj.label}
                              </td>
                              {teacherTimeSlots.map(slot => {
                                const matchingItems = teacherSchedules.filter(s => {
                                  if (s.dayOfWeek !== day) return false
                                  const start = s.startTime?.substring(0, 5) || ''
                                  const end = s.endTime?.substring(0, 5) || ''
                                  return `${start}-${end}` === slot
                                })

                                if (matchingItems.length === 0) {
                                  return (
                                    <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                      <div className="h-16"></div>
                                    </td>
                                  )
                                }

                                return (
                                  <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0 align-top">
                                    <div className="space-y-2">
                                      {matchingItems.map(s => (
                                        <div
                                          key={s.id}
                                          className="p-3 rounded-xl border border-gray-200 bg-white shadow-xs hover:shadow-md transition-all relative group"
                                        >
                                          <div className="mb-2">
                                            <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 py-0.5 rounded mr-1">
                                              {s.subjectCode}
                                            </span>
                                            <span className="font-bold text-xs text-gray-900">
                                              {s.subjectName}
                                            </span>
                                          </div>
                                          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 text-[11px]">
                                            <div className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded min-w-0">
                                              <School size={11} className="shrink-0" />
                                              <span className="truncate">{s.classroomName}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => openEdit(s)}
                                                title="แก้ไขคาบนี้"
                                                className="w-6 h-6 rounded bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-600 flex items-center justify-center transition"
                                              >
                                                <Edit3 size={12} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDelete(s)}
                                                title="ลบคาบนี้"
                                                className="w-6 h-6 rounded bg-gray-100 hover:bg-red-500 hover:text-white text-gray-400 flex items-center justify-center transition"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: รายการทั้งหมด (All List / Table View) */}
        {/* ======================================================== */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาครู / วิชา / รหัสวิชา..."
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
                />
              </div>

              <select
                value={filterDay}
                onChange={e => setFilterDay(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="">ทุกวัน</option>
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>

              <select
                value={filterClassroom}
                onChange={e => setFilterClassroom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="">ทุกห้องเรียน</option>
                {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              {(filterTeacher || filterDay || filterClassroom) && (
                <button
                  type="button"
                  onClick={() => { setFilterTeacher(''); setFilterDay(''); setFilterClassroom('') }}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
                >
                  ล้างตัวกรอง
                </button>
              )}

              <div className="ml-auto text-sm text-gray-500 self-center">
                ทั้งหมด {filtered.length} รายการ
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">วัน</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">เวลา</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">วิชา</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ครูผู้สอน</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ห้องเรียน</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">ปี/ภาค</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-800">{s.dayOfWeekTh}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {s.startTime} - {s.endTime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 border border-red-200">
                          {s.subjectCode}
                        </span>
                        <span className="text-gray-800 font-medium">{s.subjectName}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{s.teacherName}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {s.classroomName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {s.academicYear}/{s.semester}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition flex items-center gap-1 border border-amber-200"
                          >
                            <Edit3 size={12} />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition flex items-center gap-1 border border-red-200"
                          >
                            <Trash2 size={12} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-gray-600">
                    {filterTeacher || filterDay || filterClassroom ? 'ไม่พบตารางสอนที่ค้นหา' : 'ยังไม่มีตารางสอนในระบบ'}
                  </p>
                  {!filterTeacher && !filterDay && !filterClassroom && (
                    <p className="text-xs mt-1">กดปุ่ม &quot; เพิ่มตารางสอน&quot; เพื่อเริ่มต้นสร้างตารางสอน</p>
                  )}
                </div>
              )}

              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    แสดง {startIndex + 1} ถึง {Math.min(startIndex + pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← ก่อนหน้า
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ถัดไป →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 1: เพิ่มตารางสอน (Add Schedule Modal) */}
        {/* ======================================================== */}
        {showBatchForm && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">เพิ่มตารางสอน</h2>
                    <p className="text-xs text-gray-400">กรอกข้อมูลและเลือกวันเพื่อเพิ่มลงตารางสอนรายสัปดาห์</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowBatchForm(false); setPendingList([]); setFieldErrors({}) }}
                  className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Section (Compact 2-row layout) */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 mb-4 shrink-0">
                <form onSubmit={addToPending} noValidate>
                  {/* Row 1: Teacher, Classroom, Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mb-3">
                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        ครูผู้สอน <span className="text-red-500">*</span>
                      </label>
                      <TeacherSearchSelect
                        teachers={teachers}
                        value={batchForm.teacherId}
                        onChange={id => {
                          setBatchForm(prev => ({ ...prev, teacherId: id }))
                          clearFieldError('teacherid')
                        }}
                        error={fieldErrors['teacherid']}
                      />
                      {fieldError('teacherid')}
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        ห้องเรียน <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={batchForm.classroomId}
                        onChange={e => {
                          const newClassroomId = e.target.value
                          const newGrade = getClassroomGradeLevel(newClassroomId)
                          const currentSub = subjects.find(s => String(s.id) === batchForm.subjectId)
                          const isSubStillValid = currentSub && newGrade && (
                            (currentSub.gradeLevel != null && currentSub.gradeLevel === newGrade) ||
                            currentSub.name.includes(`ป.${newGrade}`)
                          )
                          setBatchForm(prev => ({
                            ...prev,
                            classroomId: newClassroomId,
                            subjectId: isSubStillValid ? prev.subjectId : ''
                          }))
                          clearFieldError('classroomid')
                          if (!isSubStillValid) clearFieldError('subjectid')
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white ${fieldClass('classroomid')}`}
                        {...fieldAttrs('classroomid')}
                      >
                        <option value="">-- เลือกห้อง --</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {fieldError('classroomid')}
                    </div>

                    <div className="md:col-span-5">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        รายวิชา <span className="text-red-500">*</span>
                        {batchForm.classroomId && getClassroomGradeLevel(batchForm.classroomId) && (
                          <span className="text-[11px] font-normal text-red-600 ml-1.5">
                            (เฉพาะ ป.{getClassroomGradeLevel(batchForm.classroomId)})
                          </span>
                        )}
                      </label>
                      <select
                        required
                        value={batchForm.subjectId}
                        disabled={!batchForm.classroomId}
                        onChange={e => {
                          setBatchForm(prev => ({ ...prev, subjectId: e.target.value }))
                          clearFieldError('subjectid')
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${!batchForm.classroomId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                          } ${fieldClass('subjectid')}`}
                        {...fieldAttrs('subjectid')}
                      >
                        {!batchForm.classroomId ? (
                          <option value="">-- กรุณาเลือกห้องเรียนก่อน --</option>
                        ) : (
                          <>
                            <option value="">-- เลือกวิชา (ป.{getClassroomGradeLevel(batchForm.classroomId)}) --</option>
                            {getFilteredSubjects(batchForm.classroomId).map(s => (
                              <option key={s.id} value={s.id}>
                                {s.code} — {s.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {fieldError('subjectid')}
                    </div>
                  </div>

                  {/* Row 2: Day buttons, Time, Academic Year/Semester, and Add button */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    {/* Day buttons (Multi-select) */}
                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        วัน (เลือกได้หลายวัน) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {DAYS.map(d => {
                          const isSelected = batchForm.dayOfWeeks.includes(d.value)
                          const inPending = pendingList.some(p =>
                            p.dayOfWeek === d.value &&
                            String(p.subjectId) === batchForm.subjectId &&
                            String(p.classroomId) === batchForm.classroomId
                          )
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => {
                                setBatchForm(prev => {
                                  const exists = prev.dayOfWeeks.includes(d.value)
                                  const updated = exists
                                    ? prev.dayOfWeeks.filter(day => day !== d.value)
                                    : [...prev.dayOfWeeks, d.value]
                                  return { ...prev, dayOfWeeks: updated }
                                })
                                clearFieldError('days')
                              }}
                              className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center flex flex-col items-center justify-center ${isSelected
                                ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-500/20'
                                : inPending
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              <span>{d.label.replace('วัน', '')}</span>
                              {inPending && (
                                <span className={`text-[9px] font-normal leading-tight ${isSelected ? 'text-red-100' : 'text-emerald-700 font-semibold'}`}>
                                  ✓ มีแล้ว
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {fieldError('days')}
                    </div>

                    {/* Time Start & End (24h) */}
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        เวลาเรียน (24 ชม.) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <TimePicker24
                            value={batchForm.startTime}
                            onChange={val => {
                              setBatchForm(prev => ({ ...prev, startTime: val }))
                              clearFieldError('starttime')
                            }}
                            error={fieldErrors['starttime']}
                            placeholder="09:00"
                          />
                          {fieldError('starttime')}
                        </div>
                        <div>
                          <TimePicker24
                            value={batchForm.endTime}
                            onChange={val => {
                              setBatchForm(prev => ({ ...prev, endTime: val }))
                              clearFieldError('endtime')
                            }}
                            error={fieldErrors['endtime']}
                            placeholder="10:00"
                          />
                          {fieldError('endtime')}
                        </div>
                      </div>
                    </div>

                    {/* Year & Semester */}
                    <div className="md:col-span-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            ปีการศึกษา <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            value={batchForm.academicYear}
                            onChange={e => {
                              setBatchForm(prev => ({ ...prev, academicYear: e.target.value }))
                              clearFieldError('academicyear')
                            }}
                            className={`w-full px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs bg-white ${fieldClass('academicyear')}`}
                            {...fieldAttrs('academicyear')}
                          />
                          {fieldError('academicyear')}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            ภาคเรียน
                          </label>
                          <select
                            value={batchForm.semester}
                            onChange={e => setBatchForm(prev => ({ ...prev, semester: Number(e.target.value) }))}
                            className="w-full px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs bg-white"
                          >
                            <option value={1}>เทอม 1</option>
                            <option value={2}>เทอม 2</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* + เพิ่มลงรายการ Button */}
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 px-3 text-sm font-semibold transition shadow-sm hover:shadow flex items-center justify-center gap-1 h-[38px]"
                      >
                        + เพิ่มลงรายการ
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Expanded Preview Section (Teacher Schedule Matrix Format) */}
              <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-red-600" />
                      <h3 className="text-sm font-bold text-gray-800">
                        ตารางสอนของคุณครู {getTeacherName(batchForm.teacherId) || '(ยังไม่ได้เลือกครู)'}
                      </h3>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full">
                      รวม {existingTeacherSchedules.length + pendingList.length} คาบ
                    </span>
                  </div>
                  {pendingList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingList([])}
                      className="text-xs text-gray-400 hover:text-red-600 font-medium transition flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50"
                    >
                      ล้างรายการรอเพิ่ม
                    </button>
                  )}
                </div>

                {allAddPreviewItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <Calendar size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-bold text-gray-600">
                      {batchForm.teacherId ? 'คุณครูท่านนี้ยังไม่มีตารางสอน' : 'กรุณาเลือกครูผู้สอน'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {batchForm.teacherId ? 'เพิ่มรายการด้านบนเพื่อดูตัวอย่างตารางสอน' : 'เลือกชื่อครูและกรอกข้อมูลเพื่อดูตารางสอนของครูท่านนั้น'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-r border-gray-200 w-28">
                            วัน / คาบ
                          </th>
                          {addTimeSlots.map((slot, i) => (
                            <th key={slot} className="px-3 py-3 text-center text-xs font-bold text-gray-600 border-b border-r border-gray-200 last:border-r-0 min-w-[150px]">
                              <div className="text-gray-400 text-[10px] mb-0.5">คาบที่ {i + 1}</div>
                              <div>{slot}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(dayObj => {
                          const day = dayObj.value
                          return (
                            <tr key={day} className="hover:bg-gray-50/50">
                              <td className="px-4 py-4 text-sm font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                                {dayObj.label}
                              </td>
                              {addTimeSlots.map(slot => {
                                const matchingItems = allAddPreviewItems.filter(item => {
                                  if (item.dayOfWeek !== day) return false
                                  const start = item.startTime?.substring(0, 5) || ''
                                  const end = item.endTime?.substring(0, 5) || ''
                                  return `${start}-${end}` === slot
                                })

                                if (matchingItems.length === 0) {
                                  return (
                                    <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                      <div className="h-16"></div>
                                    </td>
                                  )
                                }

                                return (
                                  <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0 align-top">
                                    <div className="space-y-1.5">
                                      {matchingItems.map(item => {
                                        const isPending = item.type === 'pending'
                                        return (
                                          <div
                                            key={item.id}
                                            className={`p-2.5 rounded-lg border text-left relative overflow-hidden transition-all ${isPending
                                                ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                                                : 'bg-gray-50 border-gray-200'
                                              }`}
                                          >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPending ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            <div className="pl-1.5">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPending ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
                                                  }`}>
                                                  {isPending ? 'รอเพิ่ม' : 'มีอยู่แล้ว'}
                                                </span>
                                                {isPending && (
                                                  <button
                                                    type="button"
                                                    onClick={() => removePending((item as any).tempId)}
                                                    className="w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center text-[10px] transition"
                                                    title="ลบออกจากรายการรอเพิ่ม"
                                                  >
                                                    ✕
                                                  </button>
                                                )}
                                              </div>
                                              <p className="text-xs font-bold text-gray-900 truncate">{item.subjectName}</p>
                                              <p className="text-[10px] text-gray-500 truncate">{item.subjectCode} • {item.classroomName}</p>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => { setShowBatchForm(false); setPendingList([]); setFieldErrors({}) }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={submitBulk}
                  disabled={submitting || pendingList.length === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-bold transition shadow-sm hover:shadow"
                >
                  {submitting ? 'กำลังเพิ่ม...' : `บันทึกทั้งหมด (${pendingList.length} คาบ)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: แก้ไขตารางสอน (Edit Schedule Modal) - Redesigned like Add */}
        {/* ======================================================== */}
        {showEditForm && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-800">แก้ไขตารางสอน</h2>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        ID: #{editingId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      ปรับปรุงข้อมูลรายวิชา วัน เวลา หรือครูผู้สอน พร้อมดูตัวอย่างตารางสอนของห้องเรียนแบบเรียลไทม์
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEditForm(false); setEditingId(null); setFieldErrors({}) }}
                  className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Section (Compact 2-row layout matching Add Schedule) */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 mb-4 shrink-0">
                <form onSubmit={handleEditSubmit} noValidate>
                  {/* Row 1: Teacher, Classroom, Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mb-3">
                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        ครูผู้สอน <span className="text-red-500">*</span>
                      </label>
                      <TeacherSearchSelect
                        teachers={teachers}
                        value={editForm.teacherId}
                        onChange={id => {
                          setEditForm(prev => ({ ...prev, teacherId: id }))
                          clearFieldError('teacherid')
                        }}
                        error={fieldErrors['teacherid']}
                      />
                      {fieldError('teacherid')}
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        ห้องเรียน <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={editForm.classroomId}
                        onChange={e => {
                          const newClassroomId = e.target.value
                          const newGrade = getClassroomGradeLevel(newClassroomId)
                          const currentSub = subjects.find(s => String(s.id) === editForm.subjectId)
                          const isSubStillValid = currentSub && newGrade && (
                            (currentSub.gradeLevel != null && currentSub.gradeLevel === newGrade) ||
                            currentSub.name.includes(`ป.${newGrade}`)
                          )
                          setEditForm(prev => ({
                            ...prev,
                            classroomId: newClassroomId,
                            subjectId: isSubStillValid ? prev.subjectId : ''
                          }))
                          clearFieldError('classroomid')
                          if (!isSubStillValid) clearFieldError('subjectid')
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white ${fieldClass('classroomid')}`}
                        {...fieldAttrs('classroomid')}
                      >
                        <option value="">-- เลือกห้อง --</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {fieldError('classroomid')}
                    </div>

                    <div className="md:col-span-5">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        รายวิชา <span className="text-red-500">*</span>
                        {editForm.classroomId && getClassroomGradeLevel(editForm.classroomId) && (
                          <span className="text-[11px] font-normal text-red-600 ml-1.5">
                            (เฉพาะ ป.{getClassroomGradeLevel(editForm.classroomId)})
                          </span>
                        )}
                      </label>
                      <select
                        required
                        value={editForm.subjectId}
                        disabled={!editForm.classroomId}
                        onChange={e => {
                          setEditForm(prev => ({ ...prev, subjectId: e.target.value }))
                          clearFieldError('subjectid')
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${!editForm.classroomId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                          } ${fieldClass('subjectid')}`}
                        {...fieldAttrs('subjectid')}
                      >
                        {!editForm.classroomId ? (
                          <option value="">-- กรุณาเลือกห้องเรียนก่อน --</option>
                        ) : (
                          <>
                            <option value="">-- เลือกวิชา (ป.{getClassroomGradeLevel(editForm.classroomId)}) --</option>
                            {getFilteredSubjects(editForm.classroomId).map(s => (
                              <option key={s.id} value={s.id}>
                                {s.code} — {s.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {fieldError('subjectid')}
                    </div>
                  </div>

                  {/* Row 2: Day buttons (single select), Time, Year/Semester */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    {/* Day buttons */}
                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        วัน <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {DAYS.map(d => {
                          const isSelected = editForm.dayOfWeek === d.value
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, dayOfWeek: d.value }))}
                              className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center flex flex-col items-center justify-center ${isSelected
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              <span>{d.label.replace('วัน', '')}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time Start & End (24h) */}
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        เวลาเรียน (24 ชม.) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <TimePicker24
                            value={editForm.startTime}
                            onChange={val => {
                              setEditForm(prev => ({ ...prev, startTime: val }))
                              clearFieldError('starttime')
                            }}
                            error={fieldErrors['starttime']}
                            placeholder="09:00"
                          />
                          {fieldError('starttime')}
                        </div>
                        <div>
                          <TimePicker24
                            value={editForm.endTime}
                            onChange={val => {
                              setEditForm(prev => ({ ...prev, endTime: val }))
                              clearFieldError('endtime')
                            }}
                            error={fieldErrors['endtime']}
                            placeholder="10:00"
                          />
                          {fieldError('endtime')}
                        </div>
                      </div>
                    </div>

                    {/* Year & Semester */}
                    <div className="md:col-span-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            ปีการศึกษา <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            value={editForm.academicYear}
                            onChange={e => {
                              setEditForm(prev => ({ ...prev, academicYear: e.target.value }))
                              clearFieldError('academicyear')
                            }}
                            className={`w-full px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs bg-white ${fieldClass('academicyear')}`}
                            {...fieldAttrs('academicyear')}
                          />
                          {fieldError('academicyear')}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            ภาคเรียน
                          </label>
                          <select
                            value={editForm.semester}
                            onChange={e => setEditForm(prev => ({ ...prev, semester: Number(e.target.value) }))}
                            className="w-full px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs bg-white"
                          >
                            <option value={1}>เทอม 1</option>
                            <option value={2}>เทอม 2</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Save Button in Form */}
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 px-3 text-sm font-bold transition shadow-sm hover:shadow flex items-center justify-center gap-1.5 h-[38px]"
                      >
                        <Check size={16} />
                        บันทึกการแก้ไข
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Weekly Timetable Preview for this Teacher (Matrix Format) */}
              <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-amber-600" />
                    <h3 className="text-sm font-bold text-gray-800">
                      ตารางสอนของคุณครู {getTeacherName(editForm.teacherId) || 'ครูผู้สอน'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      คาบที่กำลังแก้ไข
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                      คาบอื่นของครูท่านนี้
                    </span>
                  </div>
                </div>

                {allEditPreviewItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <Calendar size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-bold text-gray-600">ยังไม่มีตารางสอน</p>
                    <p className="text-xs text-gray-400 mt-1">คุณครูท่านนี้ยังไม่มีคาบสอนอื่น</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-r border-gray-200 w-28">
                            วัน / คาบ
                          </th>
                          {editTimeSlots.map((slot, i) => (
                            <th key={slot} className="px-3 py-3 text-center text-xs font-bold text-gray-600 border-b border-r border-gray-200 last:border-r-0 min-w-[150px]">
                              <div className="text-gray-400 text-[10px] mb-0.5">คาบที่ {i + 1}</div>
                              <div>{slot}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(dayObj => {
                          const day = dayObj.value
                          return (
                            <tr key={day} className="hover:bg-gray-50/50">
                              <td className="px-4 py-4 text-sm font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                                {dayObj.label}
                              </td>
                              {editTimeSlots.map(slot => {
                                const matchingItems = allEditPreviewItems.filter(item => {
                                  if (item.dayOfWeek !== day) return false
                                  const start = item.startTime?.substring(0, 5) || ''
                                  const end = item.endTime?.substring(0, 5) || ''
                                  return `${start}-${end}` === slot
                                })

                                if (matchingItems.length === 0) {
                                  return (
                                    <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0">
                                      <div className="h-16"></div>
                                    </td>
                                  )
                                }

                                return (
                                  <td key={slot} className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0 align-top">
                                    <div className="space-y-1.5">
                                      {matchingItems.map(item => {
                                        const isEditing = item.type === 'editing'
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => {
                                              if (!isEditing && (item as any).scheduleId) {
                                                const sched = schedules.find(s => s.id === (item as any).scheduleId)
                                                if (sched) openEdit(sched)
                                              }
                                            }}
                                            className={`p-2.5 rounded-lg border text-left relative overflow-hidden transition-all ${isEditing
                                                ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-400/30'
                                                : 'bg-white border-gray-200 hover:border-amber-400 cursor-pointer'
                                              }`}
                                            title={!isEditing ? 'คลิกเพื่อสลับมาแก้ไขคาบนี้' : undefined}
                                          >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isEditing ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
                                            <div className="pl-1.5">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isEditing ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-700'
                                                  }`}>
                                                  {isEditing ? 'กำลังแก้ไข' : 'คาบอื่น'}
                                                </span>
                                              </div>
                                              <p className="text-xs font-bold text-gray-900 truncate">{item.subjectName}</p>
                                              <p className="text-[10px] text-gray-500 truncate">{item.subjectCode} • {item.classroomName}</p>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 shrink-0">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        const cur = schedules.find(s => s.id === editingId)
                        if (cur) {
                          handleDelete(cur)
                        }
                      }}
                      className="px-4 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-bold transition flex items-center gap-1.5"
                    >
                      <Trash2 size={16} />
                      ลบคาบนี้
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEditForm(false); setEditingId(null); setFieldErrors({}) }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSubmit}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition shadow-sm hover:shadow text-sm"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: ยืนยันการลบตารางสอน (Delete Confirmation Modal) */}
        {/* ======================================================== */}
        {deleteConfirmItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบตารางสอน</h3>
                  <p className="text-xs text-gray-500">ข้อมูลตารางสอนนี้จะถูกลบออกจากระบบ</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500 text-xs">รายวิชา:</span>
                  <span className="font-bold text-gray-900">
                    <span className="font-mono text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded mr-1 border border-red-200">
                      {deleteConfirmItem.subjectCode}
                    </span>
                    {deleteConfirmItem.subjectName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">วัน / เวลา:</span>
                  <span className="font-semibold text-gray-800">
                    {deleteConfirmItem.dayOfWeekTh} ({deleteConfirmItem.startTime} - {deleteConfirmItem.endTime} น.)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">ห้องเรียน:</span>
                  <span className="font-semibold text-blue-700">
                    {deleteConfirmItem.classroomName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">ครูผู้สอน:</span>
                  <span className="font-semibold text-gray-800">
                    {deleteConfirmItem.teacherName}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs text-gray-400">
                  <span>ปีการศึกษา / เทอม:</span>
                  <span>{deleteConfirmItem.academicYear} ภาคเรียนที่ {deleteConfirmItem.semester}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition text-sm disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-bold transition text-sm shadow-sm hover:shadow disabled:opacity-50"
                >
                  {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
