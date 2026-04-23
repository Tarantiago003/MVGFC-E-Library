
import { useSession }       from 'next-auth/react'
import Link                 from 'next/link'
import AppLayout            from '../components/layout/AppLayout'
import StatusBadge          from '../components/ui/StatusBadge'
import Avatar               from '../components/ui/Avatar'
import Spinner              from '../components/ui/Spinner'
import { useBorrows }       from '../hooks/useBorrows'
import { useNotifications } from '../hooks/useNotifications'
import { fmtDate }          from '../lib/utils'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { borrows, loading } = useBorrows()
  const { notifications, unread, markRead } = useNotifications()

  // Wait for session to load
  if (status === 'loading') return null

  // Redirect if not logged in
  if (!session) {
    if (typeof window !== 'undefined') window.location.href = '/auth/signin'
    return null
  }

  const user    = session.user
  const recent  = borrows.slice(0, 3)
  const unreadN = notifications.filter(n => !n.isRead).slice(0, 3)

  const QUICK = [
    { href: '/borrow',        icon: '📖', label: 'Borrow a Book',  color: 'bg-green-700' },
    { href: '/borrow/status', icon: '📋', label: 'My Requests',    color: 'bg-green-600' },
    { href: '/chat',          icon: '💬', label: 'Chat Support',   color: 'bg-green-800' },
    { href: '/profile',       icon: '👤', label: 'My Profile',     color: 'bg-green-500' }
  ]

  return (
    <AppLayout title="MVGFC E-Library">
      {/* Greeting card */}
      <div className="bg-green-700 rounded-2xl p-5 mb-5 flex items-center gap-4 shadow-card">
        <Avatar name={user.name} image={user.image} size={14}/>
        <div className="flex-1 min-w-0">
          <p className="text-green-200 text-xs">Good {greeting()},</p>
          <p className="text-white font-bold text-base truncate">{user.name}</p>
          <p className="text-green-300 text-xs mt-0.5 capitalize">{user.role} · {user.dept || 'MVGFC'}</p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-green-800 font-semibold text-sm mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {QUICK.map(q => (
          <Link key={q.href} href={q.href}
            className={`${q.color} rounded-2xl p-4 flex flex-col gap-2 shadow-card hover:opacity-90 transition`}>
            <span className="text-2xl">{q.icon}</span>
            <span className="text-white font-semibold text-sm">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Unread notifications */}
      {unreadN.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-green-800 font-semibold text-sm">Notifications</h2>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread} new</span>
          </div>
          <div className="space-y-2">
            {unreadN.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                className="bg-white rounded-xl border border-green-100 shadow-card p-3 cursor-pointer hover:bg-green-50 transition">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent borrows */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-green-800 font-semibold text-sm">Recent Requests</h2>
        <Link href="/borrow/status" className="text-green-600 text-xs font-medium">View all →</Link>
      </div>

      {loading
        ? <Spinner/>
        : recent.length === 0
          ? <div className="bg-white rounded-2xl border border-green-100 p-6 text-center shadow-card">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-sm text-gray-500">No borrow requests yet.</p>
              <Link href="/borrow" className="mt-3 inline-block text-green-700 font-semibold text-sm">
                Borrow your first book →
              </Link>
            </div>
          : <div className="space-y-3">
              {recent.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-green-100 shadow-card p-3 flex items-center gap-3">
                  <div className="w-9 h-12 bg-green-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📘</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.bookId}</p>
                    <p className="text-xs text-gray-400">{fmtDate(b.requestDate)}</p>
                  </div>
                  <StatusBadge status={b.status}/>
                </div>
              ))}
            </div>
      }
    </AppLayout>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export async function getServerSideProps(ctx) {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions }      = await import('./api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/signin', permanent: false } }
  return { props: {} }
}