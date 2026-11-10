'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from '@/lib/notifications'
import clsx from 'clsx'
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  Calendar,
  UserPlus,
  ClipboardList,
  CheckCircle2,
  LogOut,
  GraduationCap
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด', icon: <LayoutDashboard size={20} /> },
  { href: '/admin/import/teachers', label: 'นำเข้าครู', icon: <GraduationCap size={20} /> },
  { href: '/admin/import/students', label: 'นำเข้านักเรียน', icon: <UserPlus size={20} /> },
  { href: '/admin/users', label: 'ผู้ใช้งาน', icon: <Users size={20} /> },
  { href: '/admin/classrooms', label: 'ห้องเรียน', icon: <School size={20} /> },
  { href: '/admin/subjects', label: 'รายวิชา', icon: <BookOpen size={20} /> },
  { href: '/admin/schedules', label: 'ตารางสอน', icon: <Calendar size={20} /> },
]

const teacherNav: NavItem[] = [
  { href: '/teacher/schedule', label: 'ตารางสอน', icon: <LayoutDashboard size={20} /> },
]

const homeroomNav: NavItem[] = [
  { href: '/teacher/schedule', label: 'ตารางสอน', icon: <LayoutDashboard size={20} /> },
  { href: '/teacher/homeroom', label: 'ห้องเรียนโฮมรูม', icon: <School size={20} /> },
]

const parentNav: NavItem[] = [
  { href: '/parent/dashboard', label: 'แดชบอร์ด', icon: <LayoutDashboard size={20} /> },
  { href: '/parent/assignments', label: 'การบ้าน/งาน', icon: <ClipboardList size={20} /> },
  { href: '/parent/attendance', label: 'ประวัติการมาเรียน', icon: <CheckCircle2 size={20} /> },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [fullName, setFullName] = useState<string>('ผู้ใช้งาน')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setFullName(Cookies.get('fullName') || 'ผู้ใช้งาน')
    setMounted(true)
  }, [])

  const navItems = role === 'ADMIN' ? adminNav
    : role === 'HOMEROOM_TEACHER' ? homeroomNav
      : role === 'TEACHER' ? teacherNav
        : parentNav

  const roleLabel = role === 'ADMIN' ? 'ผู้ดูแลระบบ'
    : (role === 'TEACHER' || role === 'HOMEROOM_TEACHER') ? 'ครูผู้สอน'
      : 'ผู้ปกครอง'

  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('role')
    Cookies.remove('fullName')
    toast.success('ออกจากระบบเรียบร้อยแล้ว')
    router.push('/auth/login')
  }

  return (
    <aside className="w-[280px] bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 text-slate-300 z-30 select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1 shadow-md shadow-black/20 shrink-0 border border-slate-700/50">
            <img
              src="/images/school-logo.png"
              alt="ตราโรงเรียนบ้านแจ้งกู้เรือง"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight truncate">รร.บ้านแจ้งกู้เรือง</p>
            <p className="text-xs text-slate-400 font-medium truncate">ระบบบริหารการศึกษา</p>
          </div>
        </div>
      </div>

      {/* User profile with logout button next to it */}
      <div className="px-3.5 py-3 mx-4 mt-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 border border-slate-600">
            <Users size={18} />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold text-white truncate" title={mounted ? fullName : 'ผู้ใช้งาน'}>
              {mounted ? fullName : 'ผู้ใช้งาน'}
            </p>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 group flex items-center justify-center"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <span className={clsx(
                "transition-colors",
                isActive ? "text-white" : "text-slate-500 group-hover:text-primary-400"
              )}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
