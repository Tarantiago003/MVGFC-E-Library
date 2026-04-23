import { useState } from 'react'
import StatusBadge from '../ui/StatusBadge'
import Modal from '../ui/Modal'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const now = new Date()
  const diff = now - due
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function OverduePanel({ borrows, users, books, onSendReminder }) {
  const [selectedBorrow, setSelectedBorrow] = useState(null)
  const [sending, setSending] = useState(false)

  // Filter for overdue borrows
  const overdueBorrows = borrows.filter(b => {
    if (b.status !== 'APPROVED') return false
    if (!b.dueDate) return false
    return getDaysOverdue(b.dueDate) > 0
  }).sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate))

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))
  const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]))

  async function handleSendReminder() {
    if (!selectedBorrow) return
    setSending(true)
    try {
      await onSendReminder(selectedBorrow.id)
      setSelectedBorrow(null)
    } finally {
      setSending(false)
    }
  }

  if (overdueBorrows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
        <span className="text-4xl mb-3 block">✅</span>
        <p className="font-semibold text-green-800">No Overdue Books</p>
        <p className="text-sm text-gray-400 mt-1">All borrowed books are within their due dates.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm font-bold text-red-700">
            ⚠️ {overdueBorrows.length} Overdue Book{overdueBorrows.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="divide-y divide-red-50">
          {overdueBorrows.map(b => {
            const u = userMap[b.userId]
            const bk = bookMap[b.bookId]
            const daysOverdue = getDaysOverdue(b.dueDate)

            return (
              <div key={b.id} className="px-5 py-4 hover:bg-red-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold
                        ${daysOverdue > 7 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                        {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {b.location === 'HIGH_SCHOOL' ? '🎓 HS' : '📚 Main'}
                      </span>
                    </div>

                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {bk?.title || `Assc. No. ${b.bookId}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{bk?.author}</p>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Borrower:</span>
                        <p className="font-medium text-gray-700">{u?.name || '—'}</p>
                        <p className="text-gray-400">{u?.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Due Date:</span>
                        <p className="font-medium text-red-600">{fmtDate(b.dueDate)}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBorrow(b)}
                    className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white 
                      px-4 py-2 rounded-lg text-xs font-semibold transition">
                    📧 Send Reminder
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reminder confirmation modal */}
      <Modal open={!!selectedBorrow} onClose={() => setSelectedBorrow(null)} 
        title="📧 Send Overdue Reminder">
        {selectedBorrow && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Send reminder to: {userMap[selectedBorrow.userId]?.name}
              </p>
              <p className="text-xs text-gray-600">
                Email: {userMap[selectedBorrow.userId]?.email}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Book: {bookMap[selectedBorrow.bookId]?.title || selectedBorrow.bookId}
              </p>
              <p className="text-xs text-red-600 font-semibold mt-2">
                {getDaysOverdue(selectedBorrow.dueDate)} days overdue
              </p>
            </div>

            <p className="text-sm text-gray-600">
              This will send an email reminder to the borrower about returning the book.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedBorrow(null)}
                disabled={sending}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold 
                  py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={sending}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl 
                  hover:bg-red-700 transition disabled:opacity-50">
                {sending ? 'Sending…' : '✉️ Send Reminder'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}