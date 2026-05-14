import { useState, useMemo } from 'react'
import Link                  from 'next/link'
import AppLayout             from '../../components/layout/AppLayout'
import BorrowCard            from '../../components/borrow/BorrowCard'
import Spinner               from '../../components/ui/Spinner'
import EmptyState            from '../../components/ui/EmptyState'
import { useBorrows }        from '../../hooks/useBorrows'
import { useBooks }          from '../../hooks/useBooks'

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'OVERDUE', 'REJECTED', 'RETURNED']

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate)) / 86400000))
}

export default function BorrowStatusPage() {
  const [filter, setFilter] = useState('ALL')
  const { borrows, loading } = useBorrows()
  const { books }            = useBooks()

  const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]))

  // Compute overdue count for badge
  const overdueCount = useMemo(() =>
    borrows.filter(b => b.status === 'APPROVED' && getDaysOverdue(b.dueDate) > 0).length,
    [borrows]
  )

  // Filter logic — OVERDUE is a computed subset of APPROVED
  const filtered = useMemo(() => {
    if (filter === 'ALL')     return borrows
    if (filter === 'OVERDUE') return borrows.filter(b =>
      b.status === 'APPROVED' && getDaysOverdue(b.dueDate) > 0
    )
    return borrows.filter(b => b.status === filter)
  }, [borrows, filter])

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.requestDate) - new Date(a.requestDate)
  )

  // Badge counts per filter chip
  function chipCount(f) {
    if (f === 'ALL')     return borrows.length
    if (f === 'OVERDUE') return overdueCount
    return borrows.filter(b => b.status === f).length
  }

  return (
    <AppLayout title="My Borrow Status" back>
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
        {FILTERS.map(f => {
          const count   = chipCount(f)
          const isActive = filter === f
          const isOverdue = f === 'OVERDUE'

          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`relative flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${isActive
                  ? isOverdue
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-green-700 text-white border-green-700'
                  : isOverdue && overdueCount > 0
                    ? 'bg-white text-red-600 border-red-300 hover:border-red-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
              <span className={`ml-1 text-[10px] opacity-75`}>
                ({count})
              </span>
              {/* Red dot for overdue when not active */}
              {isOverdue && overdueCount > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"/>
              )}
            </button>
          )
        })}
      </div>

      {/* Borrow flow legend */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-card p-3 mb-5">
        <p className="text-xs font-semibold text-green-700 mb-2">Borrow Flow</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 flex-wrap">
          {['Select Library','Select Book','Submit','Pending','Approved','Overdue','Returned'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded font-medium
                ${s === 'Approved'  ? 'bg-green-100 text-green-700'
                : s === 'Pending'   ? 'bg-yellow-100 text-yellow-700'
                : s === 'Overdue'   ? 'bg-red-100 text-red-700'
                : s === 'Returned'  ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'}`}>{s}</span>
              {i < arr.length - 1 && <span className="text-gray-300">→</span>}
            </span>
          ))}
        </div>
      </div>

      {loading
        ? <Spinner/>
        : sorted.length === 0
          ? <EmptyState
              icon={filter === 'OVERDUE' ? '✅' : '📋'}
              title={filter === 'OVERDUE' ? 'No overdue books!' : 'No requests found'}
              subtitle={
                filter === 'OVERDUE' ? 'All your borrowed books are within their due dates.' :
                filter === 'ALL' ? 'You have no borrow requests yet.' :
                `No ${filter.toLowerCase()} requests.`
              }
            />
          : <div className="space-y-4">
              {sorted.map(b => (
                <BorrowCard key={b.id} borrow={b} book={bookMap[b.bookId]}/>
              ))}
            </div>
      }
    </AppLayout>
  )
}

export async function getServerSideProps(ctx) {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions }      = await import('../api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/signin', permanent: false } }
  return { props: {} }
}