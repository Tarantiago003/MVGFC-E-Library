

import StatusBadge from '../ui/StatusBadge'
import { fmtDate } from '../../lib/utils'

export default function BorrowCard({ borrow, book }) {
  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-card p-4">
      <div className="flex gap-3 items-start">
        {book?.coverImageUrl
          ? <img src={book.coverImageUrl} alt={book.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0"/>
          : <div className="w-10 h-14 bg-green-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📘</div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{book?.title || `Assc. No. ${borrow.bookId}`}</p>
          <p className="text-xs text-gray-500 truncate">{book?.author}</p>
          <p className="text-xs text-green-700 mt-1">{borrow.location?.replace('_', ' ')}</p>
        </div>
        <StatusBadge status={borrow.status}/>
      </div>
      <div className="mt-3 pt-3 border-t border-green-50 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Requested</p>
          <p className="text-xs text-gray-700">{fmtDate(borrow.requestDate)}</p>
        </div>
        {borrow.dueDate && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Due Date</p>
            <p className="text-xs text-gray-700">{fmtDate(borrow.dueDate)}</p>
          </div>
        )}
        {borrow.notes && (
          <div className="col-span-2">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Note</p>
            <p className="text-xs text-gray-600">{borrow.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}