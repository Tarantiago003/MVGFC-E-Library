
import { signOut, useSession } from 'next-auth/react'
import { useState }            from 'react'
import AppLayout               from '../components/layout/AppLayout'
import Avatar                  from '../components/ui/Avatar'
import StatusBadge             from '../components/ui/StatusBadge'
import Spinner                 from '../components/ui/Spinner'
import { useNotifications }    from '../hooks/useNotifications'
import { useBorrows }          from '../hooks/useBorrows'
import { fmtDate, fmtTime }   from '../lib/utils'

export default function ProfilePage() {
  const { data: session }                   = useSession()
  const [showAllNotifs, setShowAllNotifs]   = useState(false)
  const [signingOut, setSigningOut]         = useState(false)
  const { notifications, markRead, loading: nLoading } = useNotifications()
  const { borrows }                         = useBorrows()

  if (!session) return null
  const user = session.user

  const stats = {
    total:    borrows.length,
    active:   borrows.filter(b => b.status === 'APPROVED').length,
    returned: borrows.filter(b => b.status === 'RETURNED').length,
    pending:  borrows.filter(b => b.status === 'PENDING').length
  }

  const visibleNotifs = showAllNotifs ? notifications : notifications.slice(0, 5)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const STAT_ITEMS = [
    { label: 'Total',    value: stats.total,    color: 'text-green-700' },
    { label: 'Active',   value: stats.active,   color: 'text-blue-600' },
    { label: 'Returned', value: stats.returned, color: 'text-gray-600' },
    { label: 'Pending',  value: stats.pending,  color: 'text-yellow-600' }
  ]

  return (
    <AppLayout title="My Profile">
      {/* Profile card */}
      <div className="bg-green-700 rounded-3xl p-5 mb-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} size={16}/>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">{user.name}</p>
            <p className="text-green-200 text-xs truncate">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="bg-green-600 text-green-100 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                {user.role}
              </span>
              {user.dept && (
                <span className="bg-green-600 text-green-100 text-xs px-2 py-0.5 rounded-full font-medium">
                  {user.dept}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {STAT_ITEMS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-green-100 shadow-card p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-card mb-5 overflow-hidden">
        <div className="px-4 py-3 border-b border-green-50">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Account Information</p>
        </div>
        {[
          { label: 'Full Name',   value: user.name },
          { label: 'Email',       value: user.email },
          { label: 'Role',        value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) },
          { label: 'Department',  value: user.dept || '—' },
          { label: 'Status',      value: <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Active</span> }
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3 border-b border-green-50 last:border-0">
            <span className="text-xs text-gray-500 font-medium">{row.label}</span>
            <span className="text-xs text-gray-800 font-semibold text-right max-w-[55%] truncate">{row.value}</span>
          </div>
        ))}
      </div>
              // In the account info section, add these rows:

        {user.userType === 'student' && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-50">
              <span className="text-xs text-gray-500 font-medium">Student ID</span>
              <span className="text-xs text-gray-800 font-semibold">{user.studentId}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-50">
              <span className="text-xs text-gray-500 font-medium">Year & Section</span>
              <span className="text-xs text-gray-800 font-semibold">{user.year} - {user.section}</span>
            </div>
          </>
        )}

        {user.userType === 'employee' && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-50">
              <span className="text-xs text-gray-500 font-medium">Employee No.</span>
              <span className="text-xs text-gray-800 font-semibold">{user.employeeNum}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-50">
              <span className="text-xs text-gray-500 font-medium">Position</span>
              <span className="text-xs text-gray-800 font-semibold">{user.position}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-50">
              <span className="text-xs text-gray-500 font-medium">Office</span>
              <span className="text-xs text-gray-800 font-semibold">{user.office}</span>
            </div>
          </>
        )}

      {/* Notifications */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-green-800">Notifications</p>
          <span className="text-xs text-gray-400">{notifications.filter(n => !n.isRead).length} unread</span>
        </div>
        {nLoading
          ? <Spinner className="w-6 h-6"/>
          : notifications.length === 0
            ? <div className="bg-white rounded-xl border border-green-100 p-5 text-center">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-xs text-gray-400">No notifications yet.</p>
              </div>
            : <>
                <div className="space-y-2">
                  {visibleNotifs.map(n => (
                    <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                      className={`bg-white rounded-xl border shadow-card p-3 transition cursor-pointer
                        ${n.isRead ? 'border-green-50 opacity-70' : 'border-green-200 hover:bg-green-50'}`}>
                      <div className="flex gap-2">
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{fmtTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length > 5 && (
                  <button onClick={() => setShowAllNotifs(!showAllNotifs)}
                    className="mt-2 w-full text-center text-xs text-green-600 font-semibold py-2">
                    {showAllNotifs ? '▲ Show less' : `▼ Show all ${notifications.length} notifications`}
                  </button>
                )}
              </>
        }
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut} disabled={signingOut}
        className="w-full border-2 border-red-200 text-red-500 font-semibold py-3.5 rounded-2xl
          hover:bg-red-50 transition disabled:opacity-50 mb-8">
        {signingOut ? 'Signing out…' : '↩ Sign Out'}
      </button>
    </AppLayout>
  )
}

export async function getServerSideProps(ctx) {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions }      = await import('./api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/signin', permanent: false } }
  return { props: {} }
}