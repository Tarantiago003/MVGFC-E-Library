
import { useState }            from 'react'
import DashboardLayout         from '../../components/layout/DashboardLayout'
import UsersTable              from '../../components/users/UsersTable'
import Spinner                 from '../../components/ui/Spinner'
import EmptyState              from '../../components/ui/EmptyState'
import Toast                   from '../../components/ui/Toast'
import { useDashboardUsers }   from '../../hooks/useDashboardUsers'
import { withDashboardAuth }   from '../../components/guards/withDashboardAuth'
import { ROLES }               from '../../components/guards/withDashboardAuth'

const ROLE_FILTERS   = ['ALL', 'admin', 'clerk', 'user']
const STATUS_FILTERS = ['ALL', 'active', 'inactive', 'suspended']

export default function UsersPage() {
  const { users, loading, updateRole, updateStatus } = useDashboardUsers()

  const [roleF,   setRoleF]   = useState('ALL')
  const [statusF, setStatusF] = useState('ALL')
  const [search,  setSearch]  = useState('')
  const [toast,   setToast]   = useState(null)

  function showToast(msg, type = 'success') { setToast({ message: msg, type }) }

  let filtered = [...users]
  if (roleF   !== 'ALL') filtered = filtered.filter(u => u.role   === roleF)
  if (statusF !== 'ALL') filtered = filtered.filter(u => u.status === statusF)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.dept?.toLowerCase().includes(q)
    )
  }

  async function handleRoleUpdate(userId, role) {
    try {
      await updateRole(userId, role)
      showToast(`Role updated to '${role}'`)
    } catch (e) { showToast(e.message, 'error') }
  }

  async function handleStatusUpdate(userId, status) {
    try {
      await updateStatus(userId, status)
      showToast(`Account status set to '${status}'`)
    } catch (e) { showToast(e.message, 'error') }
  }

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin').length,
    clerks:   users.filter(u => u.role === 'clerk').length,
    active:   users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length
  }

  return (
    <DashboardLayout title="User Management">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      {/* Stats row */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {[
          { label: 'Total Users',  value: stats.total,     color: 'text-green-700 bg-green-50  border-green-200' },
          { label: 'Active',       value: stats.active,    color: 'text-green-700 bg-green-50  border-green-200' },
          { label: 'Admins',       value: stats.admins,    color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { label: 'Clerks',       value: stats.clerks,    color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
          { label: 'Suspended',    value: stats.suspended, color: 'text-red-700    bg-red-50    border-red-200' }
        ].map(s => (
          <div key={s.label} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, dept…"
            className="w-full pl-9 pr-4 py-2 border border-green-200 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"/>
        </div>

        <select value={roleF} onChange={e => setRoleF(e.target.value)}
          className="border border-green-200 rounded-xl px-3 py-2 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700">
          {ROLE_FILTERS.map(r => (
            <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>

        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="border border-green-200 rounded-xl px-3 py-2 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700">
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading
        ? <Spinner/>
        : filtered.length === 0
          ? <EmptyState icon="👥" title="No users found" subtitle="Try adjusting your search or filters."/>
          : <UsersTable users={filtered} onRoleUpdate={handleRoleUpdate} onStatusUpdate={handleStatusUpdate}/>
      }
    </DashboardLayout>
  )
}

// Admin-only guard — clerks are redirected to 403
export const getServerSideProps = withDashboardAuth([ROLES.ADMIN])