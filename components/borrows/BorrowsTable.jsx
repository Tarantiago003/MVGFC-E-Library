

import StatusBadge from '../ui/StatusBadge'
import Table       from '../ui/Table'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const COLS = ['Request ID', 'User', 'Book', 'Location', 'Status', 'Requested', 'Due', 'Actions']

export default function BorrowsTable({ borrows, onApprove, onReject, onReturn, users, books }) {
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))
  const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]))

  return (
    <Table columns={COLS} caption={`${borrows.length} record(s) found`}>
      {borrows.map(b => {
        const u = userMap[b.userId]
        const bk = bookMap[b.bookId]
        return (
          <tr key={b.id} className="hover:bg-green-50/50 transition">
            <td className="px-4 py-3">
              <span className="font-mono text-xs text-gray-400">{b.id.slice(0, 8)}…</span>
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-sm text-gray-800">{u?.name || '—'}</p>
              <p className="text-xs text-gray-400">{u?.email}</p>
            </td>
            <td className="px-4 py-3 max-w-[180px]">
              <p className="font-medium text-sm text-gray-800 truncate">{bk?.title || `Assc. No. ${b.bookId}`}</p>
              <p className="text-xs text-gray-400 truncate">{bk?.author}</p>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {b.location === 'HIGH_SCHOOL' ? '🏫 HS Dept' : '🏛️ Main'}
              </span>
            </td>
            <td className="px-4 py-3"><StatusBadge status={b.status}/></td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(b.requestDate)}</td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(b.dueDate)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {b.status === 'PENDING' && (
                  <>
                    <button onClick={() => onApprove(b)}
                      className="text-xs bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-green-800 transition">
                      Approve
                    </button>
                    <button onClick={() => onReject(b)}
                      className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-red-600 transition">
                      Reject
                    </button>
                  </>
                )}
                {b.status === 'APPROVED' && (
                  <button onClick={() => onReturn(b)}
                    className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-700 transition">
                    ↩ Return
                  </button>
                )}
                {['REJECTED', 'RETURNED'].includes(b.status) && (
                  <span className="text-xs text-gray-300 italic">No action</span>
                )}
              </div>
            </td>
          </tr>
        )
      })}
    </Table>
  )
}