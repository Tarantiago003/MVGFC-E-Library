

import { signOut, useSession } from 'next-auth/react'
import { useState }            from 'react'
import { useDashboardStats }   from '../../hooks/useDashboardStats'

export default function DashboardTopBar({ title }) {
  const { data: session } = useSession()
  const { pending, openChats } = useDashboardStats()
  const [menuOpen, setMenuOpen] = useState(false)
  
  const isClerk = session?.user?.role === 'clerk'
  const assignedLibrary = session?.user?.assignedLibrary
  const libraryName = assignedLibrary === 'HIGH_SCHOOL' ? '🏫 High School' : '🏛️ Main Library'

  return (
    <header className="bg-white border-b border-green-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
      <h1 className="flex-1 text-green-800 font-bold text-lg">
        {title}
        {isClerk && (
          <span className="ml-3 text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {libraryName}
          </span>
        )}
      </h1>

      {/* Live alert badges */}
      {pending > 0 && (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
          ⏳ {pending} pending
        </span>
      )}
      {openChats > 0 && (
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
          💬 {openChats} open chats
        </span>
      )}

      {/* User menu */}
      <div className="relative">
        <button onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 transition">
          <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
            {session?.user?.name?.charAt(0) || '?'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {session?.user?.name?.split(' ')[0]}
          </span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-48 bg-white border border-green-100 rounded-xl shadow-lg py-1 z-30">
            <div className="px-4 py-2 border-b border-green-50">
              <p className="text-xs font-semibold text-gray-700 truncate">{session?.user?.email}</p>
              <p className="text-[10px] text-green-600 capitalize">{session?.user?.role}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-medium">
              ↩ Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}