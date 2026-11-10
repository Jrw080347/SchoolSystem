'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import { UserPlus, GraduationCap, School } from 'lucide-react'

interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  role: string
  phone?: string | null
  classroom: string | null
  gradeLevel?: number | null
  roomNumber?: string | null
  status: string
  isActive: boolean
  graduationYear?: number | null
  classroomId?: number | null
}

interface ClassroomOption {
  id: number
  name: string
  gradeLevel: number
  roomNumber: string
}

const roleBadge: Record<string, { label: string; cls: string }> = {
  STUDENT: { label: 'นักเรียน', cls: 'bg-red-100 text-red-700' },
  TEACHER: { label: 'ครูผู้สอน', cls: 'bg-purple-100 text-purple-700' },
  HOMEROOM_TEACHER: { label: 'ครูประจำชั้น', cls: 'bg-indigo-100 text-indigo-700' },
  PARENT: { label: 'ผู้ปกครอง', cls: 'bg-orange-100 text-orange-700' },
  ADMIN: { label: 'ผู้ดูแลระบบ', cls: 'bg-gray-800 text-white' },
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'ใช้งานอยู่', cls: 'bg-green-100 text-green-700' },
  GRADUATED: { label: 'จบการศึกษา', cls: 'bg-blue-100 text-blue-700' },
  SUSPENDED: { label: 'ระงับการใช้งาน', cls: 'bg-gray-100 text-gray-500' },
  PENDING: { label: 'รอการดำเนินการ', cls: 'bg-yellow-100 text-yellow-700' },
}

// ข้อมูลตัวอย่าง (fallback)
const mockUsers: User[] = [
  { id: 1, username: '67001', firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', role: 'STUDENT', classroom: 'ป.1/1', gradeLevel: 1, roomNumber: '1', status: 'ACTIVE', isActive: true },
  { id: 2, username: '67002', firstName: 'สมหญิง', lastName: 'รักเรียน', phone: '0812345679', role: 'STUDENT', classroom: 'ป.1/2', gradeLevel: 1, roomNumber: '2', status: 'ACTIVE', isActive: true },
  { id: 3, username: '66001', firstName: 'อนันต์', lastName: 'สุขใจ', phone: '0812345680', role: 'STUDENT', classroom: 'ป.2/1', gradeLevel: 2, roomNumber: '1', status: 'ACTIVE', isActive: true },
  { id: 4, username: 'TCH-001', firstName: 'รัตนา', lastName: 'ศรีสุข', phone: '0812345681', role: 'HOMEROOM_TEACHER', classroom: 'ป.1/1', gradeLevel: 1, roomNumber: '1', status: 'ACTIVE', isActive: true },
  { id: 5, username: 'TCH-002', firstName: 'วิภา', lastName: 'ทองดี', phone: '0812345682', role: 'TEACHER', classroom: null, status: 'ACTIVE', isActive: true },
  { id: 6, username: 'PAR-101', firstName: 'ประเสริฐ', lastName: 'ใจดี', phone: '0812345683', role: 'PARENT', classroom: 'ป.1/1', status: 'ACTIVE', isActive: true },
]

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('') // '', '1'..'6'
  const [classroomFilter, setClassroomFilter] = useState('') // '', or classroom name
  const [graduationYearFilter, setGraduationYearFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isRestored, setIsRestored] = useState(false)
  const pageSize = 20
  const role = Cookies.get('role') || 'ADMIN'

  // Restore saved filter from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('admin_users_filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.roleFilter === 'string') setRoleFilter(parsed.roleFilter)
        if (typeof parsed.statusFilter === 'string') setStatusFilter(parsed.statusFilter)
        if (typeof parsed.gradeFilter === 'string') setGradeFilter(parsed.gradeFilter)
        if (typeof parsed.classroomFilter === 'string') setClassroomFilter(parsed.classroomFilter)
        if (typeof parsed.graduationYearFilter === 'string') setGraduationYearFilter(parsed.graduationYearFilter)
        if (typeof parsed.search === 'string') setSearch(parsed.search)
        if (typeof parsed.currentPage === 'number' && parsed.currentPage > 0) setCurrentPage(parsed.currentPage)
      }
    } catch {
      // ignore
    } finally {
      setIsRestored(true)
    }
  }, [])

  // Save filter state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isRestored) return
    try {
      const filterData = {
        roleFilter,
        statusFilter,
        gradeFilter,
        classroomFilter,
        graduationYearFilter,
        search,
        currentPage,
      }
      sessionStorage.setItem('admin_users_filters', JSON.stringify(filterData))
    } catch {
      // ignore
    }
  }, [isRestored, roleFilter, statusFilter, gradeFilter, classroomFilter, graduationYearFilter, search, currentPage])

  // Load classrooms list for filters
  useEffect(() => {
    api.get('/admin/classrooms')
      .then((res: any) => {
        const data = res.data || res
        if (Array.isArray(data)) {
          setClassrooms(data)
        }
      })
      .catch(() => { })
  }, [])

  // Fetch users with current query parameters
  useEffect(() => {
    if (!isRestored) return

    setLoading(true)
    api.get('/admin/users', {
      params: {
        role: roleFilter || undefined,
        gradeLevel: gradeFilter ? parseInt(gradeFilter, 10) : undefined,
        classroom: classroomFilter || undefined,
        search: search || undefined,
        status: statusFilter || undefined,
        graduationYear: graduationYearFilter ? parseInt(graduationYearFilter, 10) : undefined
      }
    })
      .then((res: any) => {
        const data = res.data || res
        let list: User[] = []

        if (Array.isArray(data)) {
          list = data
        } else if (data && data.content && Array.isArray(data.content)) {
          list = data.content
        } else {
          list = mockUsers
        }

        // Map isActive to status if missing
        list = list.map((u: any) => ({
          ...u,
          status: u.status || (u.isActive !== undefined ? (u.isActive ? 'ACTIVE' : 'SUSPENDED') : 'ACTIVE'),
        }))

        setAllUsers(list)
      })
      .catch((err) => {
        toast.error(parseApiError(err, 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้').message)
        setAllUsers(mockUsers)
      })
      .finally(() => setLoading(false))
  }, [isRestored, roleFilter, statusFilter, gradeFilter, classroomFilter, search, graduationYearFilter])

  // Filter classrooms available for selected grade
  const availableClassrooms = useMemo(() => {
    if (!gradeFilter) return classrooms
    const g = parseInt(gradeFilter, 10)
    return classrooms.filter(c => c.gradeLevel === g)
  }, [classrooms, gradeFilter])

  const availableGraduationYears = useMemo(() => {
    const years = new Set<number>()
    allUsers.forEach(u => {
      if (u.graduationYear) years.add(u.graduationYear)
    })
    const list = Array.from(years).sort((a, b) => b - a)
    if (list.length === 0) {
      return [2569, 2568, 2567, 2566, 2565]
    }
    return list
  }, [allUsers])

  // Apply full filtering in client-side for immediate responsiveness
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      // Role filter
      if (roleFilter) {
        if (roleFilter === 'TEACHER') {
          if (u.role !== 'TEACHER' && u.role !== 'HOMEROOM_TEACHER') return false
        } else {
          if (u.role !== roleFilter) return false
        }
      }

      // Status filter
      if (statusFilter && u.status !== statusFilter) return false

      // Graduation Year filter
      if (graduationYearFilter) {
        const targetYear = parseInt(graduationYearFilter, 10)
        if (u.graduationYear !== targetYear) return false
      }

      const isTeacher = u.role === 'TEACHER'
      const isHomeroom = u.role === 'HOMEROOM_TEACHER'

      // Grade level filter (แยกตามชั้น)
      if (gradeFilter) {
        const targetGrade = parseInt(gradeFilter, 10)
        let gradeMatch = false
        if (u.gradeLevel !== undefined && u.gradeLevel !== null && u.gradeLevel === targetGrade) {
          gradeMatch = true
        } else if (u.classroom && u.classroom.includes(`ป.${targetGrade}`)) {
          gradeMatch = true
        } else if (isTeacher) {
          gradeMatch = true
        } else if (isHomeroom && roleFilter === 'TEACHER') {
          gradeMatch = true
        }
        if (!gradeMatch) return false
      }

      // Classroom filter (แยกตามห้องเรียน)
      if (classroomFilter) {
        let classroomMatch = false
        if (u.classroom && u.classroom.toLowerCase().includes(classroomFilter.toLowerCase())) {
          classroomMatch = true
        } else if (isTeacher) {
          classroomMatch = true
        } else if (isHomeroom && roleFilter === 'TEACHER') {
          classroomMatch = true
        }
        if (!classroomMatch) return false
      }

      // Search keyword filter
      if (search) {
        const s = search.toLowerCase()
        const matchName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(s)
        const matchUsername = (u.username || '').toLowerCase().includes(s)
        const matchPhone = (u.phone || '').toLowerCase().includes(s)
        const matchCr = (u.classroom || '').toLowerCase().includes(s)
        if (!matchName && !matchUsername && !matchPhone && !matchCr) return false
      }

      return true
    })
  }, [allUsers, roleFilter, statusFilter, gradeFilter, classroomFilter, search, graduationYearFilter])

  // Pagination calculation
  const totalItems = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  useEffect(() => {
    if (!loading && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [loading, currentPage, totalPages])

  // Count by grade level for quick tabs
  const gradeCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    allUsers.forEach(u => {
      if (u.gradeLevel && counts[u.gradeLevel] !== undefined) {
        counts[u.gradeLevel]++
      } else if (u.classroom) {
        for (let g = 1; g <= 6; g++) {
          if (u.classroom.includes(`ป.${g}`)) {
            counts[g]++
            break
          }
        }
      }
    })
    return counts
  }, [allUsers])

  const graduatedCount = useMemo(() => {
    return allUsers.filter(u => u.status === 'GRADUATED').length
  }, [allUsers])

  const clearAllFilters = () => {
    setRoleFilter('')
    setStatusFilter('')
    setGradeFilter('')
    setClassroomFilter('')
    setSearch('')
    setGraduationYearFilter('')
    setCurrentPage(1)
    try {
      sessionStorage.removeItem('admin_users_filters')
    } catch {
      // ignore
    }
  }

  const hasActiveFilters = Boolean(roleFilter || statusFilter || gradeFilter || classroomFilter || search || graduationYearFilter)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push('...')
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push('...')
      pages.push(totalPages - 1, totalPages)
    }
    return Array.from(new Set(pages))
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 p-8 overflow-auto">


        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รายการผู้ใช้งาน</h1>
            <p className="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข และแยกดูข้อมูลผู้ใช้งานตามระดับชั้นและห้องเรียน</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/import/students"
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2"
            >
              <UserPlus size={16} /> นำเข้านักเรียน
            </Link>
            <Link
              href="/admin/import/teachers"
              className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2"
            >
              <GraduationCap size={16} /> นำเข้าครู
            </Link>
          </div>
        </div>

        {/* Grade Quick Filter Tabs (แยกตามระดับชั้น ป.1 - ป.6) */}
        <div className="bg-white border border-gray-200 rounded-xl p-2 mb-4 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => { setGradeFilter(''); setClassroomFilter(''); setCurrentPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${gradeFilter === ''
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <School size={16} /> ทุกระดับชั้น
              <span className={`text-xs px-2 py-0.5 rounded-full ${gradeFilter === '' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {allUsers.length}
              </span>
            </button>

            {[1, 2, 3, 4, 5, 6].map(g => (
              <button
                key={g}
                onClick={() => { setGradeFilter(String(g)); setClassroomFilter(''); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${gradeFilter === String(g)
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                ชั้น ป.{g}
                <span className={`text-xs px-2 py-0.5 rounded-full ${gradeFilter === String(g) ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {gradeCounts[g] || 0}
                </span>
              </button>
            ))}

            <button
              onClick={() => { setStatusFilter(statusFilter === 'GRADUATED' ? '' : 'GRADUATED'); setCurrentPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${statusFilter === 'GRADUATED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800'
                }`}
            >
              <GraduationCap size={16} /> จบการศึกษา
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusFilter === 'GRADUATED' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-800'}`}>
                {graduatedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Advanced Filter Bar (แยกตามชั้น, ห้องเรียน, บทบาท, สถานะ, ค้นหา) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${statusFilter === 'GRADUATED' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3 items-center`}>
            {/* Filter by Grade */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ระดับชั้น</label>
              <select
                value={gradeFilter}
                onChange={e => {
                  setGradeFilter(e.target.value)
                  setClassroomFilter('')
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="">ทุกระดับชั้น</option>
                <option value="1">ประถมศึกษาปีที่ 1 (ป.1)</option>
                <option value="2">ประถมศึกษาปีที่ 2 (ป.2)</option>
                <option value="3">ประถมศึกษาปีที่ 3 (ป.3)</option>
                <option value="4">ประถมศึกษาปีที่ 4 (ป.4)</option>
                <option value="5">ประถมศึกษาปีที่ 5 (ป.5)</option>
                <option value="6">ประถมศึกษาปีที่ 6 (ป.6)</option>
              </select>
            </div>

            {/* Filter by Classroom */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ห้องเรียน</label>
              <select
                value={classroomFilter}
                onChange={e => { setClassroomFilter(e.target.value); setCurrentPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="">ทุกห้องเรียน</option>
                {availableClassrooms.length > 0 ? (
                  availableClassrooms.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} (ห้อง {c.roomNumber})
                    </option>
                  ))
                ) : (
                  // Fallback classrooms if none registered in DB yet
                  [1, 2, 3, 4, 5, 6].map(g => (
                    [1, 2, 3].map(r => (
                      <option key={`fallback-${g}-${r}`} value={`ป.${g}/${r}`}>
                        ป.{g}/{r}
                      </option>
                    ))
                  ))
                )}
              </select>
            </div>

            {/* Filter by Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">บทบาท</label>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="">ทุกบทบาท</option>
                <option value="STUDENT">นักเรียน</option>
                <option value="TEACHER">ครูผู้สอน</option>
                <option value="PARENT">ผู้ปกครอง</option>
                <option value="ADMIN">ผู้ดูแลระบบ</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">สถานะ</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="">ทุกสถานะ</option>
                <option value="ACTIVE">ใช้งานอยู่</option>
                <option value="GRADUATED">จบการศึกษา</option>
                <option value="SUSPENDED">ระงับการใช้งาน</option>
              </select>
            </div>

            {/* Filter by Graduation Year (when status is GRADUATED) */}
            {statusFilter === 'GRADUATED' && (
              <div>
                <label className="block text-xs font-semibold text-blue-600 mb-1">ปีที่จบการศึกษา</label>
                <select
                  value={graduationYearFilter}
                  onChange={e => { setGraduationYearFilter(e.target.value); setCurrentPage(1) }}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-blue-900"
                >
                  <option value="">ทุกปีที่จบการศึกษา</option>
                  {availableGraduationYears.map(y => (
                    <option key={y} value={String(y)}>ปี {y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-gray-500">
                <span className="font-semibold">กำลังกรอง:</span>
                {gradeFilter && (
                  <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                    ชั้น ป.{gradeFilter}
                  </span>
                )}
                {classroomFilter && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    ห้อง {classroomFilter}
                  </span>
                )}
                {roleFilter && (
                  <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                    บทบาท: {roleBadge[roleFilter]?.label || roleFilter}
                  </span>
                )}
                {statusFilter && (
                  <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full border border-green-200">
                    สถานะ: {statusBadge[statusFilter]?.label || statusFilter}
                  </span>
                )}
                {graduationYearFilter && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    ปีที่จบ: {graduationYearFilter}
                  </span>
                )}
                {search && (
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200">
                    คำค้น: &quot;{search}&quot;
                  </span>
                )}
              </div>
              <button
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 font-semibold hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* User Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">ชื่อผู้ใช้/รหัสนักเรียน</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">ชื่อ-นามสกุล</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">บทบาท</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">ชั้น / ห้องเรียน</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">สถานะ</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      กำลังโหลดข้อมูลผู้ใช้งาน...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="font-semibold text-gray-700 text-base">ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข</p>
                      <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนระดับชั้น ห้องเรียน หรือคำค้นหา</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-3 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => {
                    const displayRole = (roleFilter === 'TEACHER' && user.role === 'HOMEROOM_TEACHER') ? 'TEACHER' : user.role
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {user.username}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                            {user.phone ? (
                              <p className="text-xs text-gray-400">โทร: {user.phone}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge[displayRole]?.cls || 'bg-gray-100 text-gray-700'}`}>
                            {roleBadge[displayRole]?.label || displayRole}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {user.classroom ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                              <School size={13} /> {user.classroom}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[user.status]?.cls || 'bg-gray-100 text-gray-700'}`}>
                            {statusBadge[user.status]?.label || user.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/users/${user.id}/edit${classroomFilter ? `?classroom=${encodeURIComponent(classroomFilter)}` : ''}`}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              แก้ไข
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 gap-3">
            <p className="text-sm text-gray-500">
              แสดง {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} ถึง {Math.min(currentPage * pageSize, totalItems)} จากทั้งหมด {totalItems} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                ← ก่อนหน้า
              </button>
              {getPageNumbers().map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`dot-${i}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition ${currentPage === p
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100 text-gray-700 bg-white'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
