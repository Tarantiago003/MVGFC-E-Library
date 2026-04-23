

import Link      from 'next/link'
import { useRouter } from 'next/router'

const NAV = [
  { href: '/dashboard', label: 'Home',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/borrow',    label: 'Borrow',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/borrow/status', label: 'Status', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/chat',      label: 'Chat',    icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/profile',   label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
]

export default function BottomNav() {
  const { pathname } = useRouter()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-200 shadow-nav z-30 safe-bottom">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard')
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors
                ${active ? 'text-green-700' : 'text-gray-400 hover:text-green-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
              </svg>
              <span className={`text-[10px] font-medium ${active ? 'text-green-800' : ''}`}>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-green-600 mt-0.5"/>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
