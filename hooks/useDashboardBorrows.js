
import useSWR, { mutate } from 'swr'
import { useEffect }      from 'react'
import api                from '../lib/api'
import { subscribeChannel } from '../lib/pusher-client'

const KEY     = '/borrows'
const fetcher = url => api.get(url).then(d => d.data)

export function useDashboardBorrows() {
  const { data, error, isLoading } = useSWR(KEY, fetcher, { revalidateOnFocus: true })

  // Real-time: new borrow request arrives
  useEffect(() => {
    return subscribeChannel('admin-inbox', 'new-borrow-request', () => {
      mutate(KEY)
    })
  }, [])

  async function approveBorrow(id, dueDate) {
    await api.patch(`/borrows/${id}/status`, { status: 'APPROVED', dueDate })
    mutate(KEY)
  }

  async function rejectBorrow(id, notes) {
    await api.patch(`/borrows/${id}/status`, { status: 'REJECTED', notes })
    mutate(KEY)
  }

  async function returnBorrow(id) {
    await api.patch(`/borrows/${id}/status`, { status: 'RETURNED' })
    mutate(KEY)
  }

  return {
    borrows: data || [], loading: isLoading, error,
    approveBorrow, rejectBorrow, returnBorrow
  }
}
