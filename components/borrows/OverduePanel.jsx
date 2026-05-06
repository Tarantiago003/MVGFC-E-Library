import { useState }  from 'react'
import Modal           from '../ui/Modal'
import api             from '../../lib/api'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate)) / 86400000))
}

export default function OverduePanel({ borrows, users, books, onSendReminder, onExtend }) {
  const [reminderTarget, setReminderTarget] = useState(null)
  const [extendTarget,   setExtendTarget]   = useState(null)
  const [newDueDate,     setNewDueDate]      = useState('')
  const [sending,        setSending]         = useState(false)
  const [extending,      setExtending]       = useState(false)

  const overdueBorrows = borrows
    .filter(b => b.status === 'APPROVED' && b.dueDate && getDaysOverdue(b.dueDate) > 0)
    .sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate))

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))
  const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]))

  async function handleSendReminder() {
    if (!reminderTarget) return
    setSending(true)
    try {
      await onSendReminder(reminderTarget.id)
      setReminderTarget(null)
    } finally {
      setSending(false)
    }
  }

  async function handleExtend() {
    if (!extendTarget || !newDueDate) return
    setExtending(true)
    try {
      await onExtend(extendTarget.id, newDueDate)
      setExtendTarget(null)
      setNewDueDate('')
    } finally {
      setExtending(false)
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
            const u   = userMap[b.userId]
            const bk  = bookMap[b.bookId]
            const days = getDaysOverdue(b.dueDate)

            return (
              <div key={b.id} className="px-5 py-4 hover:bg-red-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold
                        ${days > 7 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                        {days} day{days > 1 ? 's' : ''} overdue
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {b.location === 'HIGH_SCHOOL' ? '🏫 HS' : '📚 Main'}
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

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setReminderTarget(b)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                      📩 Remind
                    </button>
                    <button
                      onClick={() => {
                        setExtendTarget(b)
                        // Default to 7 days from today
                        setNewDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                      📅 Extend
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reminder confirmation modal */}
      <Modal open={!!reminderTarget} onClose={() => setReminderTarget(null)}
        title="📩 Send Overdue Reminder">
        {reminderTarget && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Send reminder to: {userMap[reminderTarget.userId]?.name}
              </p>
              <p className="text-xs text-gray-600">Email: {userMap[reminderTarget.userId]?.email}</p>
              <p className="text-xs text-gray-600 mt-1">
                Book: {bookMap[reminderTarget.bookId]?.title || reminderTarget.bookId}
              </p>
              <p className="text-xs text-red-600 font-semibold mt-2">
                {getDaysOverdue(reminderTarget.dueDate)} days overdue
              </p>
            </div>
            <p className="text-sm text-gray-600">
              This will send an in-app notification <strong>and</strong> post a message in the
              borrower's chat thread so they can reply.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setReminderTarget(null)} disabled={sending}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold
                  py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSendReminder} disabled={sending}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl
                  hover:bg-red-700 transition disabled:opacity-50">
                {sending ? 'Sending…' : '✉️ Send Reminder'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Extend due date modal */}
      <Modal open={!!extendTarget} onClose={() => { setExtendTarget(null); setNewDueDate('') }}
        title="📅 Extend Due Date">
        {extendTarget && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                {bookMap[extendTarget.bookId]?.title || `Assc. No. ${extendTarget.bookId}`}
              </p>
              <p className="text-gray-600">
                Borrower: {userMap[extendTarget.userId]?.name}
              </p>
              <p className="text-red-600 text-xs font-semibold mt-1">
                Currently {getDaysOverdue(extendTarget.dueDate)} days overdue
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-800 mb-1.5">
                New Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newDueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setExtendTarget(null); setNewDueDate('') }} disabled={extending}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold
                  py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleExtend} disabled={extending || !newDueDate}
                className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl
                  hover:bg-blue-700 transition disabled:opacity-50">
                {extending ? 'Extending…' : '✅ Extend'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}