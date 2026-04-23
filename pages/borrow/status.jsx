
import { useState }    from 'react'
import Link            from 'next/link'
import AppLayout       from '../../components/layout/AppLayout'
import BorrowCard      from '../../components/borrow/BorrowCard'
import Spinner         from '../../components/ui/Spinner'
import EmptyState      from '../../components/ui/EmptyState'
import { useBorrows }  from '../../hooks/useBorrows'
import { useBooks }    from '../../hooks/useBooks'

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'RETURNED']

export default function BorrowStatusPage() {
  const [filter, setFilter] = useState('ALL')
  const { borrows, loading } = useBorrows()
  const { books }            = useBooks()

  const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]))

  const filtered = filter === 'ALL'
    ? borrows
    : borrows.filter(b => b.status === filter)

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.requestDate) - new Date(a.requestDate)
  )

  return (
    <AppLayout title="My Borrow Status" back>
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition
              ${filter === f
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}>
            {f.charAt(0) + f.slice(1).toLowerCase()}
            {f !== 'ALL' && (
              <span className="ml-1 text-[10px] opacity-75">
                ({borrows.filter(b => b.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Borrow flow visual legend */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-card p-3 mb-5">
        <p className="text-xs font-semibold text-green-700 mb-2">Borrow Flow</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 flex-wrap">
          {['Select Library','Select Book','Submit','Pending','Approved / Rejected','Returned'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded font-medium
                ${s.includes('Approved') ? 'bg-green-100 text-green-700'
                : s === 'Pending'        ? 'bg-yellow-100 text-yellow-700'
                : s === 'Returned'       ? 'bg-blue-100 text-blue-700'
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
              icon="📋"
              title="No requests found"
              subtitle={filter === 'ALL' ? 'You have no borrow requests yet.' : `No ${filter.toLowerCase()} requests.`}
              action={
                <Link href="/borrow"
                  className="mt-2 inline-block bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                  Borrow a Book
                </Link>
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