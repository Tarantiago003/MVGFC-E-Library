

import { useState } from 'react'
import Modal        from '../ui/Modal'

export default function ApproveModal({ open, borrow, onConfirm, onClose, loading }) {
  // Default due date: 7 days from today
  const defaultDue = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]
  const [dueDate, setDueDate] = useState(defaultDue)

  if (!borrow) return null
  return (
    <Modal open={open} onClose={onClose} title="✅ Approve Borrow Request">
      <div className="space-y-4">
        <div className="bg-green-50 rounded-xl p-4 text-sm">
          <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Request Details</p>
          <p><span className="text-gray-500">Assc. No.:</span> <span className="font-medium">{borrow.bookId}</span></p>
          <p className="mt-1"><span className="text-gray-500">User ID:</span> <span className="font-medium">{borrow.userId}</span></p>
          <p className="mt-1"><span className="text-gray-500">Location:</span> <span className="font-medium">{borrow.location?.replace('_', ' ')}</span></p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-green-800 mb-1.5">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input type="date" value={dueDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-green-500"/>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(borrow.id, dueDate)} disabled={loading || !dueDate}
            className="flex-1 bg-green-700 text-white font-semibold py-2.5 rounded-xl hover:bg-green-800 transition disabled:opacity-50">
            {loading ? 'Approving…' : '✓ Approve'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
