import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/notifications'
import { LogOut, User, LayoutDashboard, ClipboardList, CalendarCheck } from 'lucide-react'

export default function ParentNavbar() {
  const [fullName, setFullName] = useState('ผู้ใช้งาน')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setFullName(Cookies.get('fullName') || 'ผู้ปกครอง')
  }, [])

  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('role')
    Cookies.remove('fullName')
    toast.success('ออกจากระบบเรียบร้อยแล้ว')
    router.push('/auth/login')
  }

  const navLinks = [
    { href: '/parent/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/parent/assignments', label: 'การบ้าน/งาน', icon: ClipboardList },
    { href: '/parent/attendance', label: 'ประวัติการมาเรียน', icon: CalendarCheck },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/parent/students" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-slate-200 shrink-0">
              <img
                src="/images/school-logo.png"
                alt="ตราโรงเรียนบ้านแจ้งกู้เรือง"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-tight">ผู้ปกครอง</span>
              <p className="text-xs text-slate-500 font-medium">โรงเรียนบ้านแจ้งกู้เรือง</p>
            </div>
          </Link>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            {navLinks.map((item) => {
              const Icon = item.icon
              const currentActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition ${currentActive
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${currentActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-5 relative group cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{fullName}</p>
              <p className="text-xs font-semibold text-primary-600">ผู้ปกครอง</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm transition-transform group-hover:scale-105">
              <User className="w-5 h-5" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50">
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <nav className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50">
        {navLinks.map((item) => {
          const Icon = item.icon
          const currentActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${currentActive
                  ? 'bg-white text-primary-700 shadow-sm font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${currentActive ? 'text-primary-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
