import useSWR, { mutate } from 'swr'
import api from '../lib/api'
import { useEffect, useRef } from 'react'
import { subscribeChannel } from '../lib/pusher-client'
import { useSession } from 'next-auth/react'

const fetcher = url => api.get(url).then(d => d.data)
const CHAT_KEY = '/chat/threads/me'

export function useChat() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  
  const sendingRef = useRef(false)
  const lastSendTimeRef = useRef(0)
  const messageQueueRef = useRef(null)

  const { data, error, isLoading } = useSWR(CHAT_KEY, fetcher, {
    revalidateOnFocus: false
  })

  useEffect(() => {
    if (!userId) return
    return subscribeChannel(`chat-${userId}`, 'new-message', (msg) => {
      // 🔥 FIX: Check for duplicates before adding
      mutate(CHAT_KEY, prev => {
        const existing = prev || []
        // Don't add if message ID already exists
        if (existing.some(m => m.id === msg.id)) {
          console.log('🔒 Duplicate message blocked (Pusher):', msg.id)
          return existing
        }
        return [...existing, msg]
      }, false)
    })
  }, [userId])

  async function sendMessage(messageText, messageType, library) {
    if (sendingRef.current) {
      console.log('🔒 useChat LOCKED - already sending')
      return Promise.reject(new Error('Send already in progress'))
    }

    const now = Date.now()
    if (now - lastSendTimeRef.current < 1000) {
      console.log('🔒 useChat LOCKED - debounce (too fast)')
      return Promise.reject(new Error('Please wait before sending another message'))
    }

    if (messageQueueRef.current === messageText) {
      console.log('🔒 useChat LOCKED - duplicate message in queue')
      return Promise.reject(new Error('Message already queued'))
    }

    sendingRef.current = true
    lastSendTimeRef.current = now
    messageQueueRef.current = messageText

    try {
      const msg = {
        threadId: userId,
        messageText,
        ...(messageType && { messageType }),
        ...(library && { library })
      }
      
      const res = await api.post('/chat/messages', msg)
      
      // 🔥 FIX: Don't add to local state - let Pusher handle it
      // This prevents the duplicate key error because:
      // 1. Pusher will broadcast the message
      // 2. The above useEffect will add it (with duplicate check)
      // 3. No race condition between optimistic update and Pusher
      
      // OLD (caused duplicates):
      // mutate(CHAT_KEY, prev => [...(prev || []), res.data], false)
      
      return res
    } catch (err) {
      console.error('useChat send error:', err)
      throw err
    } finally {
      setTimeout(() => {
        sendingRef.current = false
        messageQueueRef.current = null
      }, 1500)
    }
  }

  return { messages: data || [], loading: isLoading, error, sendMessage }
}