import ComplaintTag from './ComplaintTag'
import { useState, useEffect } from 'react'

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function ThreadList({ threads, activeThread, onSelect, loading }) {
  const [users, setUsers] = useState({})

  // Fetch user data for all thread participants
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users')
        const data = await response.json()
        if (data.success) {
          // Create a map of userId -> user object
          const userMap = {}
          data.data.forEach(user => {
            userMap[user.id] = user
          })
          setUsers(userMap)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    if (threads.length > 0) {
      fetchUsers()
    }
  }, [threads])

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-green-50 rounded-xl animate-pulse"/>
        ))}
      </div>
    )
  }

  if (!threads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <span className="text-4xl mb-3">💬</span>
        <p className="text-sm font-semibold text-green-800">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">User messages will appear here in real-time.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map(t => {
        const isActive   = t.threadId === activeThread
        const isResolved = t.threadStatus === 'RESOLVED'
        const libraryIcon = t.library === 'HIGH_SCHOOL' ? '🎓' : '📚'
        
        // Get user info from the map
        const user = users[t.threadId] || null
        const userName = user?.name || `User ${t.threadId.slice(0, 8)}`
        
        return (
          <button key={t.threadId} onClick={() => onSelect(t.threadId)}
            className={`w-full text-left px-4 py-3.5 border-b border-green-50 hover:bg-green-50
              transition flex gap-3 items-start
              ${isActive ? 'bg-green-100 border-l-4 border-l-green-600' : ''}`}>

            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
              text-xs font-bold text-white ${isActive ? 'bg-green-700' : 'bg-green-500'}`}>
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-green-800' : 'text-gray-800'}`}>
                  {libraryIcon} {userName}
                </p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{fmtTime(t.lastTimestamp)}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <ComplaintTag type={t.messageType}/>
                {isResolved && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                    ✓ Resolved
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1 truncate">{t.lastMessage}</p>
            </div>

            {t.unreadCount > 0 && (
              <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px]
                font-bold rounded-full flex items-center justify-center">
                {t.unreadCount > 9 ? '9+' : t.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}