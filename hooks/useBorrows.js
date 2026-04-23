
import useSWR, { mutate } from 'swr'
import api from '../lib/api'
import { useEffect } from 'react'
import { subscribeChannel } from '../lib/pusher-client'
import { useSession }        from 'next-auth/react'

const fetcher = url => api.get(url).then(d => d.data)

export function useBorrows(filters = {}) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const params = new URLSearchParams(filters)
  const key    = `/borrows?${params.toString()}`

  const { data, error, isLoading } = useSWR(key, fetcher)

  // Real-time: update status when Pusher fires
  useEffect(() => {
    if (!userId) return
    return subscribeChannel(`borrow-status-${userId}`, 'status-updated', ({ requestId, status }) => {
      mutate(key, prev => {
        if (!prev) return prev
        return prev.map(b => b.id === requestId ? { ...b, status } : b)
      }, false)
    })
  }, [userId, key])

  async function submitBorrow(bookId, libraryLocation) {
    const res = await api.post('/borrows', { bookId, libraryLocation })
    mutate(key)
    return res
  }

  return { borrows: data || [], loading: isLoading, error, submitBorrow }
}