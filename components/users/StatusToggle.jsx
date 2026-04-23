
import { useState } from 'react'

const OPTIONS = ['active', 'inactive', 'suspended']

export default function StatusToggle({ userId, currentStatus, onUpdate, disabled }) {
  const [loading, setLoading] = useState(false)

  async function handleChange(e) {
    const s = e.target.value
    if (s === currentStatus) return
    setLoading(true)
    try { await onUpdate(userId, s) }
    finally { setLoading(false) }
  }

  const color = {
    active:    'bg-green-100 border-green-300 text-green-800',
    inactive:  'bg-gray-100  border-gray-300  text-gray-600',
    suspended: 'bg-red-100   border-red-300   text-red-700'
  }

  return (
    <select value={currentStatus} onChange={handleChange}
      disabled={disabled || loading}
      className={`text-xs border rounded-lg px-2 py-1.5 font-semibold focus:outline-none
        focus:ring-2 focus:ring-green-500 ${color[currentStatus] || ''}`}>
      {OPTIONS.map(o => (
        <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
      ))}
    </select>
  )
}