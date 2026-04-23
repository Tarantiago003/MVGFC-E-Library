import useSWR, { mutate } from 'swr'
import { useEffect, useState, useRef } from 'react'
import api                from '../lib/api'
import { subscribeChannel } from '../lib/pusher-client'

const THREADS_KEY = '/chat/threads'
const fetcher     = url => api.get(url).then(d => d.data)

export function useDashboardChat() {
  const [activeThread, setActiveThread] = useState(null)
  
  const sendLockRef = useRef(false)
  const lastSendTimeRef = useRef(0)
  const messageQueueRef = useRef(null)

  const { data: threads = [], isLoading: threadsLoading } = useSWR(
    THREADS_KEY, fetcher, { revalidateOnFocus: true }
  )
  const threadMsgKey = activeThread ? `/chat/threads/${activeThread}` : null
  const { data: messages = [], isLoading: msgsLoading } = useSWR(threadMsgKey, fetcher)

  // Real-time: new message in any thread → refresh thread list unread counts
  useEffect(() => {
    return subscribeChannel('admin-inbox', 'new-chat-message', ({ threadId }) => {
      mutate(THREADS_KEY)
      if (threadId === activeThread) mutate(`/chat/threads/${activeThread}`)
    })
  }, [activeThread])

  // Real-time: new message in the active thread
  useEffect(() => {
    if (!activeThread) return
    return subscribeChannel(`chat-${activeThread}`, 'new-message', (msg) => {
      // 🔥 FIX: Check for duplicates before adding
      mutate(threadMsgKey, prev => {
        const existing = prev || []
        // Don't add if message ID already exists
        if (existing.some(m => m.id === msg.id)) {
          console.log('🔒 Duplicate message blocked (Pusher):', msg.id)
          return existing
        }
        return [...existing, msg]
      }, false)
      mutate(THREADS_KEY)
    })
  }, [activeThread, threadMsgKey])

  async function sendReply(text) {
    if (!activeThread) {
      console.log('🔒 No active thread')
      return Promise.reject(new Error('No active thread'))
    }
    
    if (sendLockRef.current) {
      console.log('🔒 useDashboardChat LOCKED - already sending')
      return Promise.reject(new Error('Send already in progress'))
    }

    const now = Date.now()
    if (now - lastSendTimeRef.current < 1000) {
      console.log('🔒 useDashboardChat LOCKED - debounce')
      return Promise.reject(new Error('Please wait before sending'))
    }

    if (messageQueueRef.current === text) {
      console.log('🔒 useDashboardChat LOCKED - duplicate in queue')
      return Promise.reject(new Error('Message already queued'))
    }

    sendLockRef.current = true
    lastSendTimeRef.current = now
    messageQueueRef.current = text

    try {
      const res = await api.post('/chat/messages', {
        threadId: activeThread,
        messageText: text
      })
      
      // 🔥 FIX: Don't add to local state - let Pusher handle it
      // This prevents the duplicate key error because:
      // 1. Pusher will broadcast the message
      // 2. The above useEffect will add it (with duplicate check)
      // 3. No race condition between optimistic update and Pusher
      
      // OLD (caused duplicates):
      // mutate(threadMsgKey, prev => [...(prev || []), res.data], false)
      
      return res
    } catch (err) {
      console.error('useDashboardChat send error:', err)
      throw err
    } finally {
      setTimeout(() => {
        sendLockRef.current = false
        messageQueueRef.current = null
      }, 1500)
    }
  }

  async function resolveThread(threadId) {
    await api.patch(`/chat/threads/${threadId}/resolve`)
    mutate(THREADS_KEY)
    mutate(`/chat/threads/${threadId}`)
  }

  return {
    threads, threadsLoading,
    messages, msgsLoading,
    activeThread, setActiveThread,
    sendReply, resolveThread
  }
}