import Link        from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

const NAV_ALL = [
  { href: '/dashboard/home',    icon: '🏠', label: 'Overview'       },
  { href: '/dashboard/borrows', icon: '📚', label: 'Borrow Requests' },
  { href: '/dashboard/chat',    icon: '💬', label: 'Chat Console'    },
  { href: '/dashboard/notices', icon: '📄', label: 'Generate Notices' }, // NEW
]
const NAV_ADMIN = [
  { href: '/dashboard/users',   icon: '👥', label: 'User Management' },
]

export default function Sidebar() {
  const { pathname }      = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const links = isAdmin ? [...NAV_ALL, ...NAV_ADMIN] : NAV_ALL

  return (
    <aside className="w-56 bg-green-800 min-h-screen flex flex-col flex-shrink-0 shadow-xl">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-bold text-green-800 text-sm">
            MV
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">E-Library</p>
            <p className="text-green-300 text-[10px]">
              {isAdmin ? 'Admin Panel' : 'Clerk Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'text-green-100 hover:bg-green-700 hover:text-white'}`}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Session info */}
      <div className="px-4 py-4 border-t border-green-700">
        <p className="text-green-200 text-xs font-medium truncate">{session?.user?.name}</p>
        <p className="text-green-400 text-[10px] mt-0.5 capitalize">{session?.user?.role}</p>
      </div>
    </aside>
  )
}