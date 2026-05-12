import { useState }  from 'react'
import StatusBadge    from '../ui/StatusBadge'
import Toast          from '../ui/Toast'
import { fmtDate }    from '../../lib/utils'
import api            from '../../lib/api'

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate)) / 86400000))
}

export default function BorrowCard({ borrow, book }) {
  const [renewing, setRenewing] = useState(false)
  const [toast,    setToast]    = useState(null)

  const isApproved  = borrow.status === 'APPROVED'
  const daysOverdue = isApproved ? getDaysOverdue(borrow.dueDate) : 0
  const isOverdue   = daysOverdue > 0

  // Determine the displayed status — show OVERDUE when applicable
  const displayStatus = isOverdue ? 'OVERDUE' : borrow.status

  async function handleRenew() {
    setRenewing(true)
    try {
      await api.post(`/borrows/${borrow.id}/renew`)
      setToast({ message: 'Renewal request sent to library staff!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to send renewal request.', type: 'error' })
    } finally {
      setRenewing(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-card p-4
      ${isOverdue ? 'border-red-200' : 'border-green-100'}`}>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      <div className="flex gap-3 items-start">
        {book?.coverImageUrl
          ? <img src={book.coverImageUrl} alt={book.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0"/>
          : <div className="w-10 h-14 bg-green-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📚</div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {book?.title || `Assc. No. ${borrow.bookId}`}
          </p>
          <p className="text-xs text-gray-500 truncate">{book?.author}</p>
          <p className="text-xs text-green-700 mt-1">{borrow.location?.replace('_', ' ')}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={displayStatus}/>
          {isOverdue && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
              ${daysOverdue > 7 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
              {daysOverdue}d overdue
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-green-50 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Requested</p>
          <p className="text-xs text-gray-700">{fmtDate(borrow.requestDate)}</p>
        </div>
        {borrow.dueDate && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Due Date</p>
            <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              {fmtDate(borrow.dueDate)}
            </p>
          </div>
        )}
        {borrow.notes && (
          <div className="col-span-2">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Note</p>
            <p className="text-xs text-gray-600">{borrow.notes}</p>
          </div>
        )}
      </div>

      {/* Renew button — only for approved borrows (overdue or not) */}
      {isApproved && (
        <button
          onClick={handleRenew}
          disabled={renewing}
          className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition
            ${isOverdue
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
              : 'bg-green-100 hover:bg-green-200 text-green-800 disabled:opacity-50'}`}>
          {renewing ? 'Sending request…' : '🔄 Request Renewal'}
        </button>
      )}
    </div>
  )
}