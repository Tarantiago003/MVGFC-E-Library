
import { useState } from 'react'

const ROLES = ['admin', 'clerk', 'user']

export default function RoleSelect({ userId, currentRole, onUpdate, disabled, selfId }) {
  const [loading, setLoading] = useState(false)
  const isSelf = userId === selfId

  async function handleChange(e) {
    const newRole = e.target.value
    if (newRole === currentRole || isSelf) return
    setLoading(true)
    try { await onUpdate(userId, newRole) }
    finally { setLoading(false) }
  }

  return (
    <select value={currentRole} onChange={handleChange}
      disabled={disabled || loading || isSelf}
      className={`text-xs border rounded-lg px-2 py-1.5 font-semibold focus:outline-none
        focus:ring-2 focus:ring-green-500 transition
        ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}
        ${currentRole === 'admin' ? 'bg-purple-50  border-purple-200 text-purple-700'
        : currentRole === 'clerk' ? 'bg-yellow-50  border-yellow-200 text-yellow-700'
        :                           'bg-green-50   border-green-200  text-green-700'}`}>
      {ROLES.map(r => (
        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
      ))}
    </select>
  )
}