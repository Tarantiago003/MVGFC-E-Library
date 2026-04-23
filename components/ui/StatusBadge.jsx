
const META = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400 animate-pulse' },
  APPROVED:  { label: 'Approved',  cls: 'bg-green-100  text-green-800',  dot: 'bg-green-500' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-100    text-red-800',    dot: 'bg-red-500' },
  RETURNED:  { label: 'Returned',  cls: 'bg-blue-100   text-blue-800',   dot: 'bg-blue-400' },
  OPEN:      { label: 'Open',      cls: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  RESOLVED:  { label: 'Resolved',  cls: 'bg-gray-100   text-gray-600',   dot: 'bg-gray-400' },
  active:    { label: 'Active',    cls: 'bg-green-100  text-green-800',  dot: 'bg-green-500' },
  inactive:  { label: 'Inactive',  cls: 'bg-gray-100   text-gray-600',   dot: 'bg-gray-400' },
  suspended: { label: 'Suspended', cls: 'bg-red-100    text-red-700',    dot: 'bg-red-500' }
}
export default function StatusBadge({ status }) {
  const m = META[status] || { label: status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}/>
      {m.label}
    </span>
  )
}