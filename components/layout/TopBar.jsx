

import { useRouter }          from 'next/router'
import { useNotifications }   from '../../hooks/useNotifications'

export default function TopBar({ title, back }) {
  const router = useRouter()
  const { unread } = useNotifications()

  return (
    <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-30 safe-top">
      {back && (
        <button onClick={() => router.back()}
          className="p-1 rounded-full hover:bg-green-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}
            viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
      )}
      {!back && (
        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">
          MV
        </div>
      )}
      <h1 className="flex-1 font-semibold text-base tracking-wide truncate">{title}</h1>
      <button onClick={() => router.push('/chat')}
        className="relative p-1 rounded-full hover:bg-green-700 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </header>
  )
}
