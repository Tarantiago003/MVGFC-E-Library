import { useState, useRef } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  
  // 🔥 TRIPLE LOCK SYSTEM
  const [sending, setSending] = useState(false)
  const sendLockRef = useRef(false)
  const lastSendTimeRef = useRef(0)
  
  const ref = useRef()

  async function submit() {
    const t = text.trim()
    
    // 🔥 CRITICAL: Multi-layer validation
    if (!t) return
    if (disabled) return
    if (sending) {
      console.log('🔒 ChatInput locked - sending state')
      return
    }
    if (sendLockRef.current) {
      console.log('🔒 ChatInput locked - ref lock')
      return
    }
    
    // 🔥 DEBOUNCE: Prevent sends within 1 second
    const now = Date.now()
    if (now - lastSendTimeRef.current < 1000) {
      console.log('🔒 ChatInput locked - debounce')
      return
    }
    
    // 🔥 LOCK EVERYTHING
    sendLockRef.current = true
    setSending(true)
    lastSendTimeRef.current = now
    setText('') // Clear immediately
    
    try {
      await onSend(t)
    } catch (err) {
      // Restore text only if actual error (not lock)
      if (!err?.message?.includes('locked') && !err?.message?.includes('progress')) {
        setText(t)
      }
      console.error('ChatInput send error:', err)
    } finally {
      // 🔥 UNLOCK AFTER DELAY
      setTimeout(() => {
        setSending(false)
        sendLockRef.current = false
      }, 1500) // 1.5 second lock
      ref.current?.focus()
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation() // Stop bubbling
      
      // Only submit if not locked
      if (!sending && !sendLockRef.current) {
        submit()
      }
    }
  }

  // 🔥 PREVENT FORM SUBMISSION
  function handleFormSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const canSend = text.trim() && !disabled && !sending && !sendLockRef.current

  return (
    <form onSubmit={handleFormSubmit} className="flex gap-2 items-end px-4 py-3 bg-white border-t border-green-100 safe-bottom">
      <textarea 
        ref={ref} 
        value={text} 
        onChange={e => setText(e.target.value)} 
        onKeyDown={onKey}
        rows={1} 
        placeholder="Type a message…" 
        disabled={disabled || sending || sendLockRef.current}
        className="flex-1 resize-none border border-green-200 rounded-xl px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-green-500 max-h-28 bg-green-50 placeholder-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
      />
      <button 
        onClick={submit} 
        disabled={!canSend}
        type="button"
        className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center
          disabled:opacity-40 hover:bg-green-800 transition flex-shrink-0">
        {(sending || sendLockRef.current) ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        )}
      </button>
    </form>
  )
}