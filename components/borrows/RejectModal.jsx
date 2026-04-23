
import { useState } from 'react'
import Modal        from '../ui/Modal'

export default function RejectModal({ open, borrow, onConfirm, onClose, loading }) {
  const [notes, setNotes] = useState('')
  if (!borrow) return null
  return (
    <Modal open={open} onClose={onClose} title="❌ Reject Borrow Request">
      <div className="space-y-4">
        <div className="bg-red-50 rounded-xl p-4 text-sm border border-red-100">
          <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Request Details</p>
          <p><span className="text-gray-500">Assc. No.:</span> <span className="font-medium">{borrow.bookId}</span></p>
          <p className="mt-1"><span className="text-gray-500">User ID:</span> <span className="font-medium">{borrow.userId}</span></p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-green-800 mb-1.5">
            Reason for Rejection <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={3} placeholder="e.g. Book not available at this location, ID could not be verified…"
            className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-red-400"/>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(borrow.id, notes)} disabled={loading}
            className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Rejecting…' : '✗ Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}