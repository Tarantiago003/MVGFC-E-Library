
export default function StatCard({ label, value, icon, color = 'green', trend }) {
  const colors = {
    green:  'bg-green-50  border-green-200  text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    red:    'bg-red-50    border-red-200    text-red-700',
    gray:   'bg-gray-50   border-gray-200   text-gray-700'
  }
  return (
    <div className={`border rounded-2xl p-5 ${colors[color]} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs mt-1 opacity-60">{trend}</p>}
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
    </div>
  )
}