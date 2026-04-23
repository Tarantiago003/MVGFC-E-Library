
export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export const STATUS_META = {
  PENDING:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400 badge-pulse' },
  APPROVED: { label: 'Approved', color: 'bg-green-100  text-green-800',  dot: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100    text-red-800',    dot: 'bg-red-500' },
  RETURNED: { label: 'Returned', color: 'bg-blue-100   text-blue-800',   dot: 'bg-blue-400' },
  OPEN:     { label: 'Open',     color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  RESOLVED: { label: 'Resolved', color: 'bg-gray-100   text-gray-700',   dot: 'bg-gray-400' }
}
