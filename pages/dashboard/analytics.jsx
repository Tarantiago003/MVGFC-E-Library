import useSWR            from 'swr'
import DashboardLayout   from '../../components/layout/DashboardLayout'
import Spinner           from '../../components/ui/Spinner'
import EmptyState        from '../../components/ui/EmptyState'
import { withDashboardAuth } from '../../components/guards/withDashboardAuth'
import api               from '../../lib/api'

const fetcher = url => api.get(url).then(d => d.data)

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function BarRow({ label, value, max, color = 'bg-green-600' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700 truncate max-w-[70%]">{label}</span>
        <span className="font-bold text-gray-800">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  )
}

function MiniSparkline({ daily }) {
  if (!daily?.length) return null
  const max = Math.max(...daily.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-0.5 h-10">
      {daily.slice(-14).map(d => (
        <div key={d.date} className="flex-1 bg-green-500 rounded-sm opacity-80"
          style={{ height: `${Math.max(4, (d.count / max) * 40)}px` }}
          title={`${d.date}: ${d.count} click${d.count !== 1 ? 's' : ''}`}/>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR('/analytics', fetcher, { refreshInterval: 30_000 })

  if (isLoading) return (
    <DashboardLayout title="📊 Traffic Analytics"><Spinner/></DashboardLayout>
  )

  if (!data) return (
    <DashboardLayout title="📊 Traffic Analytics">
      <EmptyState icon="📊" title="No analytics data yet" subtitle="Link clicks will appear here once users start visiting resources."/>
    </DashboardLayout>
  )

  const { totalClicks, uniqueVisitors, resources = [], byInstitute = [], daily = [], recent = [] } = data
  const maxClicks = Math.max(...resources.map(r => r.clicks), 1)
  const maxInst   = Math.max(...byInstitute.map(i => i.clicks), 1)

  const RESOURCE_COLORS = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-teal-600']

  return (
    <DashboardLayout title="📊 Traffic Analytics">

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Clicks',     value: totalClicks,    icon: '🖱️',  color: 'text-green-700  bg-green-50  border-green-200'  },
          { label: 'Unique Visitors',  value: uniqueVisitors, icon: '👤',  color: 'text-blue-700   bg-blue-50   border-blue-200'   },
          { label: 'Resources Tracked',value: resources.length,icon: '🔗', color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { label: 'Days Recorded',    value: daily.length,   icon: '📅',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-5 ${s.color} shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <span className="text-3xl opacity-80">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Resource breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <h3 className="font-bold text-green-800 mb-4">🔗 Clicks by Resource</h3>
          {resources.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No resource clicks yet.</p>
            : resources.map((r, i) => (
                <div key={r.name} className="mb-4 last:mb-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline truncate block max-w-[280px]">
                        {r.url}
                      </a>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-800">{r.clicks}</p>
                      <p className="text-[10px] text-gray-400">{r.uniqueVisitors} unique</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${RESOURCE_COLORS[i % RESOURCE_COLORS.length]}`}
                      style={{ width: `${Math.round((r.clicks / maxClicks) * 100)}%` }}/>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Institute breakdown */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <h3 className="font-bold text-green-800 mb-4">🏛️ Clicks by Institute</h3>
          {byInstitute.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
            : byInstitute.map(({ institute, clicks }) => (
                <BarRow key={institute} label={institute} value={clicks} max={maxInst}
                  color="bg-indigo-500"/>
              ))
          }
        </div>
      </div>

      {/* Daily sparkline */}
      {daily.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-green-800">📈 Daily Activity (last 14 days)</h3>
            <span className="text-xs text-gray-400">Each bar = 1 day</span>
          </div>
          <MiniSparkline daily={daily}/>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{daily.slice(-14)[0]?.date}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Recent activity log */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-green-50 flex items-center justify-between">
          <h3 className="font-bold text-green-800">🕐 Recent Activity</h3>
          <span className="text-xs text-gray-400">{recent.length} latest events</span>
        </div>
        {recent.length === 0
          ? <div className="py-10 text-center text-gray-400 text-sm">No activity yet.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    {['User', 'Institute', 'Resource', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-green-700 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {recent.map(e => (
                    <tr key={e.id} className="hover:bg-green-50/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-gray-800">{e.userName}</p>
                        <p className="text-xs text-gray-400">{e.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                          {e.userInstitute}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700">{e.resourceName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmtTime(e.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps = withDashboardAuth()