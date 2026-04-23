

import { useState }      from 'react'
import { useRouter }     from 'next/router'
import AppLayout         from '../../components/layout/AppLayout'
import StepIndicator     from '../../components/borrow/StepIndicator'
import LibraryCard       from '../../components/borrow/LibraryCard'
import BookCard          from '../../components/borrow/BookCard'
import Spinner           from '../../components/ui/Spinner'
import EmptyState        from '../../components/ui/EmptyState'
import Toast             from '../../components/ui/Toast'
import { useBooks }      from '../../hooks/useBooks'
import { useBorrows }    from '../../hooks/useBorrows'

const LIBRARIES = [
  {
    id: 'HIGH_SCHOOL',
    name: 'High School Department',
    description: 'Library for HS students and faculty.',
    icon: '🏫'
  },
  {
    id: 'MAIN_LIBRARY',
    name: 'Main Library',
    description: 'Central academic library for all college departments.',
    icon: '🏛️'
  }
]

export default function BorrowPage() {
  const router = useRouter()
  const [step,     setStep]     = useState(0)
  const [library,  setLibrary]  = useState(null)
  const [book,     setBook]     = useState(null)
  const [search,   setSearch]   = useState('')
  const [toast,    setToast]    = useState(null)
  const [submitting, setSub]    = useState(false)

  const { books, loading: bLoading } = useBooks({ location: library, search })
  const { submitBorrow }             = useBorrows()

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  async function handleSubmit() {
    if (!book || !library) return
    setSub(true)
    try {
      await submitBorrow(book.id, library)
      showToast('Borrow request submitted! Awaiting approval.')
      setTimeout(() => router.push('/borrow/status'), 1800)
    } catch (err) {
      showToast(err.message || 'Failed to submit request.', 'error')
    } finally {
      setSub(false)
    }
  }

  return (
    <AppLayout title="Borrow a Book" back={step > 0}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      <StepIndicator current={step}/>

      {/* ── STEP 0: Select Library ─── */}
      {step === 0 && (
        <div>
          <h2 className="text-green-800 font-bold text-lg mb-1">Select Library</h2>
          <p className="text-gray-500 text-sm mb-5">Choose the library location you want to borrow from.</p>
          <div className="space-y-3">
            {LIBRARIES.map(lib => (
              <LibraryCard key={lib.id} {...lib}
                selected={library === lib.id}
                onClick={() => setLibrary(lib.id)}
              />
            ))}
          </div>
          <button onClick={() => setStep(1)} disabled={!library}
            className="mt-6 w-full bg-green-700 disabled:opacity-40 text-white font-semibold
              py-3.5 rounded-2xl transition hover:bg-green-800">
            Next: Browse Books →
          </button>
        </div>
      )}

      {/* ── STEP 1: Select Book ─── */}
      {step === 1 && (
        <div>
          <h2 className="text-green-800 font-bold text-lg mb-1">Select a Book</h2>
          <p className="text-gray-500 text-sm mb-4">
            {library === 'HIGH_SCHOOL' ? '🏫 High School Department' : '🏛️ Main Library'}
          </p>

          {/* Search bar */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setBook(null) }}
              placeholder="Search title or author…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-white
                text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>

          {bLoading
            ? <Spinner/>
            : books.length === 0
              ? <EmptyState icon="🔍" title="No books found"
                  subtitle={search ? `No results for "${search}"` : 'No books at this location.'}/>
              : <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  {books.map(b => (
                    <BookCard key={b.id} book={b}
                      selected={book?.id === b.id}
                      onClick={() => setBook(b)}/>
                  ))}
                </div>
          }

          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(0)}
              className="flex-1 border-2 border-green-200 text-green-700 font-semibold
                py-3 rounded-2xl hover:bg-green-50 transition">
              ← Back
            </button>
            <button onClick={() => setStep(2)} disabled={!book}
              className="flex-1 bg-green-700 disabled:opacity-40 text-white font-semibold
                py-3 rounded-2xl hover:bg-green-800 transition">
              Next: Confirm →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Confirm ─── */}
      {step === 2 && book && (
        <div>
          <h2 className="text-green-800 font-bold text-lg mb-1">Confirm Request</h2>
          <p className="text-gray-500 text-sm mb-5">Review your borrow request before submitting.</p>

          {/* Book summary card */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-card p-5 mb-5">
            <div className="flex gap-4">
              {book.coverImageUrl
                ? <img src={book.coverImageUrl} alt={book.title} className="w-16 h-22 object-cover rounded-xl flex-shrink-0"/>
                : <div className="w-16 h-22 bg-green-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📘</div>
              }
              <div>
                <p className="font-bold text-gray-800 text-sm leading-snug">{book.title}</p>
                <p className="text-gray-500 text-xs mt-1">{book.author}</p>
                <p className="text-green-700 text-xs mt-1">{book.category}</p>
                <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {book.available} copies available
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-green-50 rounded-2xl p-4 mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Library</span>
              <span className="font-semibold text-green-800">
                {library === 'HIGH_SCHOOL' ? '🏫 High School' : '🏛️ Main Library'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-semibold text-yellow-700">⏳ Pending Approval</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Processing Time</span>
              <span className="font-semibold text-gray-700">1–2 business days</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mb-5">
            By submitting, you agree to return the book by the due date assigned by library staff.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} disabled={submitting}
              className="flex-1 border-2 border-green-200 text-green-700 font-semibold
                py-3 rounded-2xl hover:bg-green-50 transition disabled:opacity-40">
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 bg-green-700 disabled:opacity-60 text-white font-semibold
                py-3 rounded-2xl hover:bg-green-800 transition flex items-center justify-center gap-2">
              {submitting
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                    </svg> Submitting…</>
                : '✓ Submit Request'
              }
            </button>
          </div>
        </div>
      )}
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
