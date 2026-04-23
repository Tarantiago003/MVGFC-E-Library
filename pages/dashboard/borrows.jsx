import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import BorrowFilters from '../../components/borrows/BorrowFilters'
import BorrowsTable from '../../components/borrows/BorrowsTable'
import OverduePanel from '../../components/borrows/OverduePanel' // NEW
import ApproveModal from '../../components/borrows/ApproveModal'
import RejectModal from '../../components/borrows/RejectModal'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'
import { useDashboardBorrows } from '../../hooks/useDashboardBorrows'
import { useDashboardUsers } from '../../hooks/useDashboardUsers'
import { withDashboardAuth } from '../../components/guards/withDashboardAuth'
import useSWR from 'swr'
import api from '../../lib/api'

export default function BorrowsPage() {
  const { borrows, loading, approveBorrow, rejectBorrow, returnBorrow } = useDashboardBorrows()
  const { users } = useDashboardUsers()
  const { data: books = [] } = useSWR('/books', url => api.get(url).then(d => d.data))

  const [filters, setFilters] = useState({ status: 'ALL', library: 'ALL', search: '' })
  const [approveTarget, setApprove] = useState(null)
  const [rejectTarget, setReject] = useState(null)
  const [returnTarget, setReturn] = useState(null)
  const [actionLoading, setActLoad] = useState(false)
  const [toast, setToast] = useState(null)
  const [showOverdue, setShowOverdue] = useState(false) // NEW

  function showToast(message, type = 'success') { setToast({ message, type }) }
  function patchFilter(patch) { setFilters(prev => ({ ...prev, ...patch })) }

  // Client-side filter
  let filtered = [...borrows]
  if (filters.status !== 'ALL') filtered = filtered.filter(b => b.status === filters.status)
  if (filters.library !== 'ALL') filtered = filtered.filter(b => b.location === filters.library)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(b =>
      b.userId?.toLowerCase().includes(q) || b.bookId?.toLowerCase().includes(q)
    )
  }
  filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))

  // NEW: Send overdue reminder
  async function handleSendReminder(borrowId) {
    setActLoad(true)
    try {
      await api.post(`/borrows/${borrowId}/remind`)
      showToast('Reminder sent successfully!')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setActLoad(false)
    }
  }

  async function handleApprove(id, dueDate) {
    setActLoad(true)
    try {
      await approveBorrow(id, dueDate)
      setApprove(null)
      showToast('Request approved successfully!')
    } catch (e) { showToast(e.message, 'error') }
    finally { setActLoad(false) }
  }

  async function handleReject(id, notes) {
    setActLoad(true)
    try {
      await rejectBorrow(id, notes)
      setReject(null)
      showToast('Request rejected.')
    } catch (e) { showToast(e.message, 'error') }
    finally { setActLoad(false) }
  }

  async function handleReturn(id) {
    setActLoad(true)
    try {
      await returnBorrow(id)
      setReturn(null)
      showToast('Book marked as returned!')
    } catch (e) { showToast(e.message, 'error') }
    finally { setActLoad(false) }
  }

  return (
    <DashboardLayout title="Borrow Management">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* NEW: Overdue section toggle */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setShowOverdue(false)}
          className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition ${
            !showOverdue
              ? 'bg-green-700 text-white'
              : 'bg-white border border-green-200 text-gray-600 hover:border-green-300'
          }`}>
          📋 All Requests
        </button>
        <button
          onClick={() => setShowOverdue(true)}
          className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition ${
            showOverdue
              ? 'bg-red-600 text-white'
              : 'bg-white border border-red-200 text-gray-600 hover:border-red-300'
          }`}>
          ⚠️ Overdue Books
        </button>
      </div>

      {showOverdue ? (
        loading ? (
          <Spinner />
        ) : (
          <OverduePanel
            borrows={borrows}
            users={users}
            books={books}
            onSendReminder={handleSendReminder}
          />
        )
      ) : (
        <>
          <BorrowFilters {...filters} onChange={patchFilter} />

          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon="📋" title="No borrow requests found" subtitle="Try adjusting your filters." />
          ) : (
            <BorrowsTable
              borrows={filtered}
              users={users}
              books={books}
              onApprove={b => setApprove(b)}
              onReject={b => setReject(b)}
              onReturn={b => setReturn(b)}
            />
          )}
        </>
      )}

      <ApproveModal
        open={!!approveTarget}
        borrow={approveTarget}
        loading={actionLoading}
        onConfirm={handleApprove}
        onClose={() => setApprove(null)}
      />

      <RejectModal
        open={!!rejectTarget}
        borrow={rejectTarget}
        loading={actionLoading}
        onConfirm={handleReject}
        onClose={() => setReject(null)}
      />

      {/* Return confirmation modal */}
      <Modal open={!!returnTarget} onClose={() => setReturn(null)} title="✓ Confirm Return">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark borrow request{' '}
            <span className="font-mono font-semibold">{returnTarget?.id?.slice(0, 8)}…</span> as
            returned? This will restore the book's available copy count.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setReturn(null)}
              disabled={actionLoading}
              className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={() => handleReturn(returnTarget.id)}
              disabled={actionLoading}
              className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {actionLoading ? 'Confirming…' : '✓ Confirm Return'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export const getServerSideProps = withDashboardAuth()