
import { useSession }  from 'next-auth/react'
import RoleGuard       from '../guards/RoleGuard'
import RoleSelect      from './RoleSelect'
import StatusToggle    from './StatusToggle'
import StatusBadge     from '../ui/StatusBadge'
import Table           from '../ui/Table'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const COLS = ['Name', 'Email', 'Department', 'Role', 'Status', 'Joined', 'Last Login', 'Actions']

export default function UsersTable({ users, onRoleUpdate, onStatusUpdate }) {
  const { data: session } = useSession()
  const selfId = session?.user?.id
  const isAdmin = session?.user?.role === 'admin'

  return (
    <Table columns={COLS} caption={`${users.length} user(s) found`}>
      {users.map(u => (
        <tr key={u.id} className="hover:bg-green-50/40 transition">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold
                flex items-center justify-center flex-shrink-0">
                {u.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{u.name}</p>
                {u.id === selfId && (
                  <span className="text-[10px] text-green-600 font-semibold">● You</span>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
          <td className="px-4 py-3 text-xs text-gray-600">{u.dept || '—'}</td>
          <td className="px-4 py-3">
            <RoleGuard allow={['admin']} fallback={
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                ${u.role === 'admin' ? 'bg-purple-100 text-purple-700'
                : u.role === 'clerk' ? 'bg-yellow-100 text-yellow-700'
                :                      'bg-green-100  text-green-700'}`}>
                {u.role}
              </span>
            }>
              <RoleSelect userId={u.id} currentRole={u.role}
                onUpdate={onRoleUpdate} selfId={selfId}/>
            </RoleGuard>
          </td>
          <td className="px-4 py-3">
            <RoleGuard allow={['admin']} fallback={<StatusBadge status={u.status}/>}>
              <StatusToggle userId={u.id} currentStatus={u.status} onUpdate={onStatusUpdate}/>
            </RoleGuard>
          </td>
          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(u.lastLogin)}</td>
          <td className="px-4 py-3">
            <span className="text-xs text-gray-300 italic">
              {isAdmin ? 'Use dropdowns' : 'Read-only'}
            </span>
          </td>
        </tr>
      ))}
    </Table>
  )
}