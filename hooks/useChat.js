import useSWR, { mutate } from 'swr'
import api from '../lib/api'
import { useEffect, useRef, useState } from 'react'
import { subscribeChannel } from '../lib/pusher-client'
import { useSession } from 'next-auth/react'

const fetcher = url => api.get(url).then(d => d.data)
const THREADS_KEY = '/chat/threads/me'

export function useChat() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [activeThreadId, setActiveThreadId] = useState(null)

  const sendingRef       = useRef(false)
  const lastSendTimeRef  = useRef(0)
  const messageQueueRef  = useRef(null)

  // All user's ticket summaries
  const { data: threads, error: threadsError, isLoading: threadsLoading } = useSWR(
    THREADS_KEY, fetcher, { revalidateOnFocus: false }
  )

  // Messages for the active thread
  const threadMsgKey = activeThreadId ? `/chat/threads/${activeThreadId}` : null
  const { data: messages, isLoading: messagesLoading } = useSWR(threadMsgKey, fetcher, {
    revalidateOnFocus: false
  })

  // Real-time: staff reply arrives on ANY of the user's threads
  useEffect(() => {
    if (!userId) return
    return subscribeChannel(`user-notif-${userId}`, 'chat-reply', ({ threadId }) => {
      // Refresh the thread list (unread counts change)
      mutate(THREADS_KEY)
      // If the active thread got a reply, also refresh its messages
      if (threadId && threadId === activeThreadId) {
        mutate(`/chat/threads/${activeThreadId}`)
      }
    })
  }, [userId, activeThreadId])

  // Real-time: new message pushed directly to a thread channel
  useEffect(() => {
    if (!activeThreadId) return
    return subscribeChannel(`chat-${activeThreadId}`, 'new-message', (msg) => {
      mutate(threadMsgKey, prev => {
        const existing = prev || []
        if (existing.some(m => m.id === msg.id)) return existing
        return [...existing, msg]
      }, false)
      mutate(THREADS_KEY) // keep thread list fresh
    })
  }, [activeThreadId, threadMsgKey])

  async function sendMessage(messageText, messageType, library, threadId) {
    // threadId can be explicitly passed (for new tickets) or defaults to activeThreadId
    const targetThread = threadId || activeThreadId

    if (sendingRef.current)
      return Promise.reject(new Error('Send already in progress'))
    const now = Date.now()
    if (now - lastSendTimeRef.current < 1000)
      return Promise.reject(new Error('Please wait before sending'))
    if (messageQueueRef.current === messageText)
      return Promise.reject(new Error('Message already queued'))

    sendingRef.current    = true
    lastSendTimeRef.current = now
    messageQueueRef.current = messageText

    try {
      const body = {
        threadId:    targetThread,
        messageText,
        ...(messageType && { messageType }),
        ...(library    && { library })
      }
      const res = await api.post('/chat/messages', body)

      // Switch active thread to the newly created/sent-to thread
      if (targetThread !== activeThreadId) setActiveThreadId(targetThread)

      mutate(THREADS_KEY)
      if (targetThread) mutate(`/chat/threads/${targetThread}`)
      return res
    } catch (err) {
      throw err
    } finally {
      setTimeout(() => {
        sendingRef.current    = false
        messageQueueRef.current = null
      }, 1500)
    }
  }

  return {
    threads:        threads  || [],
    threadsLoading,
    messages:       messages || [],
    messagesLoading,
    activeThreadId,
    setActiveThreadId,
    sendMessage
  }
}