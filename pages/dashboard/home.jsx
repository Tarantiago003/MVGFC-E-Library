
import Link                  from 'next/link'
import DashboardLayout       from '../../components/layout/DashboardLayout'
import StatCard              from '../../components/ui/StatCard'
import Spinner               from '../../components/ui/Spinner'
import StatusBadge           from '../../components/ui/StatusBadge'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useDashboardBorrows } from '../../hooks/useDashboardBorrows'
import { withDashboardAuth } from '../../components/guards/withDashboardAuth'
import { useSession }        from 'next-auth/react'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardHome() {
  const { data: session }      = useSession()
  const stats                  = useDashboardStats()
  const { borrows, loading }   = useDashboardBorrows()
  const isAdmin = session?.user?.role === 'admin'
  const isClerk = session?.user?.role === 'clerk'

  const recentPending = borrows
    .filter(b => b.status === 'PENDING')
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
    .slice(0, 5)

  return (
    <DashboardLayout title="Overview">
      {/* Greeting with library name for clerks */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-green-800">
          Good {greeting()}, {session?.user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {isClerk 
            ? `Managing ${stats.libraryName}` 
            : "Here's what's happening at MVGFC E-Library today."
          }
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Requests"  value={stats.pending}   icon="⏳" color="yellow" trend="Needs attention"/>
        <StatCard label="Active Borrows"    value={stats.approved}  icon="📗" color="green"  trend="Currently borrowed"/>
        <StatCard label="Open Chats"        value={stats.openChats} icon="💬" color="blue"   trend={`${stats.unresolvedComplaints} complaints`}/>
        <StatCard label="Total Users"       value={stats.totalUsers} icon="👥" color="gray"  trend={`${stats.activeUsers} active`}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending borrow requests */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-green-800">⏳ Pending Borrow Requests</h3>
            <Link href="/dashboard/borrows"
              className="text-xs text-green-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            {loading
              ? <Spinner/>
              : recentPending.length === 0
                ? <div className="py-10 text-center">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm text-gray-400">No pending requests. All clear!</p>
                  </div>
                : <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-50 border-b border-green-100">
                        {['Book', 'User ID', 'Location', 'Requested', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-green-700 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {recentPending.map(b => (
                        <tr key={b.id} className="hover:bg-green-50/40 transition">
                          <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[120px] truncate">{b.bookId}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{b.userId?.slice(0, 8)}…</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              {b.location === 'HIGH_SCHOOL' ? '🏫 HS' : '🏛️ Main'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(b.requestDate)}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        </div>

        {/* Quick nav panel */}
        <div>
          <h3 className="font-bold text-green-800 mb-3">⚡ Quick Navigate</h3>
          <div className="space-y-3">
            {[
              { href: '/dashboard/borrows', icon: '📚', label: 'Manage Borrows',    sub: `${stats.pending} pending`,        color: 'border-yellow-200 hover:bg-yellow-50' },
              { href: '/dashboard/chat',    icon: '💬', label: 'Chat Console',      sub: `${stats.openChats} open threads`, color: 'border-blue-200   hover:bg-blue-50'   },
              ...(isAdmin ? [{ href: '/dashboard/users', icon: '👥', label: 'Manage Users', sub: `${stats.totalUsers} registered`, color: 'border-purple-200 hover:bg-purple-50' }] : [])
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 p-4 bg-white border-2 rounded-2xl
                  shadow-sm transition ${n.color}`}>
                <span className="text-2xl">{n.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.sub}</p>
                </div>
                <span className="ml-auto text-gray-300">→</span>
              </Link>
            ))}
          </div>

          {/* Borrow summary donut-style legend */}
          <div className="mt-4 bg-white rounded-2xl border border-green-100 shadow-sm p-4">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">Borrow Summary</p>
            {[
              { label: 'Total',    val: stats.totalBorrows, color: 'bg-green-500' },
              { label: 'Pending',  val: stats.pending,      color: 'bg-yellow-400' },
              { label: 'Approved', val: stats.approved,     color: 'bg-blue-500' },
              { label: 'Returned', val: stats.returned,     color: 'bg-gray-400' }
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`}/>
                <span className="text-xs text-gray-500 flex-1">{s.label}</span>
                <span className="text-xs font-bold text-gray-700">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export const getServerSideProps = withDashboardAuth()