
import useSWR, { mutate } from 'swr'
import api from '../lib/api'
import { useEffect }       from 'react'
import { subscribeChannel } from '../lib/pusher-client'
import { useSession }       from 'next-auth/react'

const fetcher  = url => api.get(url).then(d => d.data)
const NOTIF_KEY = '/notifications'

export function useNotifications() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data, error, isLoading } = useSWR(NOTIF_KEY, fetcher, {
    refreshInterval: 60_000   // Poll every 60s as fallback
  })

  useEffect(() => {
    if (!userId) return
    return subscribeChannel(`user-notif-${userId}`, 'chat-reply', () => {
      mutate(NOTIF_KEY)
    })
  }, [userId])

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`)
    mutate(NOTIF_KEY, prev =>
      prev?.map(n => n.id === id ? { ...n, isRead: true } : n), false
    )
  }

  const unread = (data || []).filter(n => !n.isRead).length
  return { notifications: data || [], unread, loading: isLoading, error, markRead }
}