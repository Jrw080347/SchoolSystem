'use client'

import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { toast } from '@/lib/notifications'
import { parseApiError } from '@/lib/notificationErrors'
import Cookies from 'js-cookie'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react'

interface RecentActivity {
  id: number
  studentName: string
  avatar: string
  subject: string
  task: string
  status: string
  statusLabel: string
  date: string
  action: string
  actionType: string
}

interface SubjectAchievement {
  id?: number
  subject: string
  subjectCode?: string
  gradeLevel?: number
  gradeName?: string
  classroomName?: string
  totalAssignments?: number
  submittedCount?: number
  totalSubmissions?: number
  percent: number
  color: string
}

interface SystemReport {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  totalClassrooms: number
  totalSubjects: number
  totalAssignments: number
  totalSubmitted: number
  pendingGrading: number
  avgSubmissionRate: number
  avgAttendanceRate: number
  recentActivities: RecentActivity[]
  subjectAchievements: SubjectAchievement[]
  availableYears?: string[]
}

export default function AdminDashboard() {
  const [report, setReport] = useState<SystemReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [subjectSearch, setSubjectSearch] = useState('')
  const role = Cookies.get('role') || 'ADMIN'

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res: any = await api.get('/admin/report/system')
      setReport(res.data)
    } catch (err) {
      toast.error(parseApiError(err, 'ไม่สามารถโหลดรายงานระบบได้').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const recentActivities = report?.recentActivities || []
  const subjectAchievements = report?.subjectAchievements || []

  // Extract unique available grade names from subjects
  const availableGrades = useMemo(() => {
    const gradeSet = new Set<string>()
    subjectAchievements.forEach(s => {
      if (s.gradeName) gradeSet.add(s.gradeName)
    })
    const list = Array.from(gradeSet)
    if (list.length === 0) {
      return ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6']
    }
    return list.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '99')
      const numB = parseInt(b.replace(/\D/g, '') || '99')
      if (a.startsWith('ป.') && b.startsWith('ม.')) return -1
      if (a.startsWith('ม.') && b.startsWith('ป.')) return 1
      return numA - numB
    })
  }, [subjectAchievements])

  // Filtered subjects based on selectedGrade and subjectSearch
  const filteredSubjects = useMemo(() => {
    return subjectAchievements.filter(item => {
      if (selectedGrade !== 'all') {
        const itemGrade = item.gradeName || (item.gradeLevel ? `ป.${item.gradeLevel}` : '')
        if (itemGrade !== selectedGrade) return false
      }
      if (subjectSearch.trim()) {
        const q = subjectSearch.toLowerCase().trim()
        const matchName = item.subject?.toLowerCase().includes(q)
        const matchCode = item.subjectCode?.toLowerCase().includes(q)
        const matchRoom = item.classroomName?.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchRoom) return false
      }
      return true
    })
  }, [subjectAchievements, selectedGrade, subjectSearch])

  // Group filtered subjects by grade for the "all" view
  const subjectsByGrade = useMemo(() => {
    const map = new Map<string, SubjectAchievement[]>()
    filteredSubjects.forEach(s => {
      const g = s.gradeName || (s.gradeLevel ? `ป.${s.gradeLevel}` : 'ทั่วไป')
      if (!map.has(g)) {
        map.set(g, [])
      }
      map.get(g)!.push(s)
    })
    return map
  }, [filteredSubjects])

  // Pagination and Filtering for Recent Activities
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 20

  const filteredActivities = useMemo(() => {
    return recentActivities.filter(a => {
      const matchSearch =
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.task.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false

      if (statusFilter !== 'all') {
        return a.status === statusFilter
      }
      return true
    })
  }, [recentActivities, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">{label}</Badge>
      case 'submitted': return <Badge variant="success">{label}</Badge>
      case 'pending': return <Badge variant="warning">{label}</Badge>
      default: return <Badge variant="secondary">{label}</Badge>
    }
  }


  // Helper to render subject card
  const renderSubjectCard = (item: SubjectAchievement, idx: number) => {
    const percentColor =
      item.percent >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
      item.percent >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200' :
      item.percent > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' :
      'text-slate-500 bg-slate-50 border-slate-200'

    const barColor =
      item.percent >= 80 ? 'bg-emerald-500' :
      item.percent >= 50 ? 'bg-blue-500' :
      item.percent > 0 ? 'bg-amber-500' :
      'bg-slate-300'

    return (
      <div
        key={idx}
        className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
              {item.subject}
            </h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${percentColor}`}>
              {item.percent}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {item.subjectCode && (
              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                {item.subjectCode}
              </span>
            )}
            <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
              {item.gradeName || (item.gradeLevel ? `ชั้น ป.${item.gradeLevel}` : 'ทั่วไป')}
            </span>
            {item.classroomName && item.classroomName !== item.gradeName && (
              <span className="text-slate-400 text-[11px]">
                ห้อง {item.classroomName}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(item.percent, 3)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {item.totalAssignments !== undefined && item.totalAssignments > 0
                ? `${item.totalAssignments} ภาระงาน`
                : 'ยังไม่มีงาน'}
            </span>
            <span>
              {item.submittedCount !== undefined && item.totalSubmissions !== undefined && item.totalSubmissions > 0
                ? `ส่งแล้ว ${item.submittedCount}/${item.totalSubmissions} ครั้ง`
                : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar role={role} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Area */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">รายงานภาพรวมระบบ</h1>
            <p className="text-sm text-slate-500 mt-1">ติดตามอัตราการส่งงานของนักเรียนและสถิติการใช้งานของผู้ใช้</p>
          </div>

          {/* Top Filters */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchReport}
              disabled={loading}
              title="รีเฟรชข้อมูล"
              className="bg-white hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Summary Cards: 3 Main Cards (Teachers, Students, Parents) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* 1. ครูผู้สอน */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600">ครูผู้สอน</CardTitle>
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {report ? report.totalTeachers.toLocaleString() : '...'}
                    <span className="text-sm font-normal text-slate-400 ml-1.5">คน</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">ครูและครูประจำชั้นในระบบ</p>
                </CardContent>
              </Card>

              {/* 2. นักเรียน */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600">นักเรียน</CardTitle>
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <Users className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {report ? report.totalStudents.toLocaleString() : '...'}
                    <span className="text-sm font-normal text-slate-400 ml-1.5">คน</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">นักเรียนที่ลงทะเบียนทั้งหมด</p>
                </CardContent>
              </Card>

              {/* 3. ผู้ปกครอง */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600">ผู้ปกครอง</CardTitle>
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {report ? report.totalParents.toLocaleString() : '...'}
                    <span className="text-sm font-normal text-slate-400 ml-1.5">คน</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">ผู้ปกครองที่เชื่อมต่อระบบ</p>
                </CardContent>
              </Card>
            </div>

            {/* สรุปวิชารายชั้น (Subject Summary Separated by Grade Level / Class) */}
            <Card className="w-full">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      <CardTitle className="text-lg font-bold text-slate-900">สรุปวิชารายชั้น</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      สรุปผลสัมฤทธิ์และอัตราการส่งงานของแต่ละรายวิชา แยกตามระดับชั้นเรียน
                    </CardDescription>
                  </div>

                  {/* Search inside subjects */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหารายวิชา, รหัสวิชา..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-56 sm:w-64 transition-all"
                    />
                  </div>
                </div>

                {/* Grade Level Selector Tabs */}
                <div className="flex items-center gap-2 pt-3 overflow-x-auto custom-scrollbar">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
                    <Layers className="w-3.5 h-3.5" /> ระดับชั้น:
                  </span>

                  <button
                    onClick={() => setSelectedGrade('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      selectedGrade === 'all'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทุกระดับชั้น ({subjectAchievements.length})
                  </button>

                  {availableGrades.map((grade) => {
                    const countInGrade = subjectAchievements.filter(s =>
                      (s.gradeName || (s.gradeLevel ? `ป.${s.gradeLevel}` : '')) === grade
                    ).length

                    return (
                      <button
                        key={grade}
                        onClick={() => setSelectedGrade(grade)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          selectedGrade === grade
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ชั้น {grade} {countInGrade > 0 ? `(${countInGrade})` : ''}
                      </button>
                    )
                  })}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="max-h-[480px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {filteredSubjects.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    ไม่พบข้อมูลรายวิชาในเงื่อนไขที่เลือก
                  </div>
                ) : selectedGrade === 'all' ? (
                  // All Grades view: Grouped neatly by grade level
                  <div className="space-y-8">
                    {Array.from(subjectsByGrade.entries()).map(([gradeName, items]) => {
                      const avgRate = Math.round(items.reduce((acc, cur) => acc + cur.percent, 0) / items.length)

                      return (
                        <div key={gradeName} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
                              <h3 className="font-bold text-slate-800 text-base">
                                ระดับชั้น {gradeName}
                              </h3>
                              <span className="text-xs text-slate-500 font-normal">
                                ({items.length} รายวิชา)
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <span>อัตราส่งงานเฉลี่ย:</span>
                              <span className={`font-bold ${avgRate >= 80 ? 'text-emerald-600' : avgRate >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                                {avgRate}%
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {items.map((item, idx) => renderSubjectCard(item, idx))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Single Grade view: focused display
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary-600" />
                        <span className="font-semibold text-slate-800">สรุปข้อมูลชั้น {selectedGrade}</span>
                        <span>• ทั้งหมด {filteredSubjects.length} รายวิชา</span>
                      </div>
                      <div>
                        <span>อัตราการส่งงานเฉลี่ยของระดับชั้น: </span>
                        <span className="font-bold text-primary-700 text-sm">
                          {filteredSubjects.length > 0
                            ? Math.round(filteredSubjects.reduce((acc, c) => acc + c.percent, 0) / filteredSubjects.length)
                            : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredSubjects.map((item, idx) => renderSubjectCard(item, idx))}
                    </div>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

            {/* การแจ้งเตือนการส่งงานล่าสุด (Recent Activities Full Width Table) */}
            <Card className="w-full flex flex-col">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <CardTitle>การแจ้งเตือนการส่งงานล่าสุด</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหานักเรียน, วิชา, งาน..."
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-48 sm:w-56 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                      aria-label="กรองสถานะการส่งงาน"
                    >
                      <option value="all">สถานะทั้งหมด</option>
                      <option value="submitted">ส่งแล้ว</option>
                      <option value="pending">ยังไม่ได้ส่ง</option>
                      <option value="overdue">เกินกำหนด</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-5 py-4 font-semibold">ชื่อนักเรียน</th>
                      <th className="px-5 py-4 font-semibold">วิชา</th>
                      <th className="px-5 py-4 font-semibold">ชื่องาน</th>
                      <th className="px-5 py-4 font-semibold">สถานะ</th>
                      <th className="px-5 py-4 font-semibold">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedActivities.length > 0 ? displayedActivities.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={item.avatar} alt={item.studentName} className="w-8 h-8 rounded-full border border-slate-200" />
                            <span className="font-semibold text-slate-900">{item.studentName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{item.subject}</td>
                        <td className="px-5 py-3 text-slate-900 font-medium">{item.task}</td>
                        <td className="px-5 py-3">
                          {getStatusBadge(item.status, item.statusLabel)}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{item.date}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          ไม่พบข้อมูลการแจ้งเตือน
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                <div>แสดง {filteredActivities.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredActivities.length)} จากทั้งหมด {filteredActivities.length} รายการ</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}
