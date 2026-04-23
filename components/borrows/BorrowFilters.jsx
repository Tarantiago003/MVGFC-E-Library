

import { useSession } from 'next-auth/react'

const STATUSES   = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'RETURNED']
const LIBRARIES  = ['ALL', 'HIGH_SCHOOL', 'MAIN_LIBRARY']

export default function BorrowFilters({ status, library, search, onChange }) {
  const { data: session } = useSession()
  const isClerk = session?.user?.role === 'clerk'

  return (
    <div className="flex flex-wrap gap-3 items-center mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={search} onChange={e => onChange({ search: e.target.value })}
          placeholder="Search user or book ID…"
          className="w-full pl-9 pr-4 py-2 border border-green-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"/>
      </div>

      {/* Status filter */}
      <select value={status} onChange={e => onChange({ status: e.target.value })}
        className="border border-green-200 rounded-xl px-3 py-2 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700">
        {STATUSES.map(s => (
          <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
        ))}
      </select>

      {/* Library filter - HIDE FOR CLERKS */}
      {!isClerk && (
        <select value={library} onChange={e => onChange({ library: e.target.value })}
          className="border border-green-200 rounded-xl px-3 py-2 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700">
          {LIBRARIES.map(l => (
            <option key={l} value={l}>
              {l === 'ALL' ? 'All Libraries' : l === 'HIGH_SCHOOL' ? '🏫 High School' : '🏛️ Main Library'}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}