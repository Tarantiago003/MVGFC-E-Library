import { useState, useRef, useEffect } from 'react'
import { useSession }   from 'next-auth/react'
import ComplaintTag     from './ComplaintTag'
import Spinner          from '../ui/Spinner'

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function ChatPanel({ messages, thread, loading, onSend, onResolve, sending }) {
  const { data: session } = useSession()
  const staffId   = session?.user?.id
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isResolved = thread?.threadStatus === 'RESOLVED'
  const msgType    = messages[0]?.messageType

  async function handleSend() {
    const trimmedText = text.trim()
    
    // 🔧 SIMPLIFIED: Let parent handle locking
    if (!trimmedText || sending || isResolved) return
    
    setText('') // Clear immediately
    
    try {
      await onSend(trimmedText)
    } catch (error) {
      // Restore text if send failed
      setText(trimmedText)
      console.error('Failed to send message:', error)
    } finally {
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      
      if (!sending) {
        handleSend()
      }
    }
  }

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-green-50/30">
        <span className="text-5xl mb-4">💬</span>
        <p className="font-semibold text-green-800 text-base">Select a conversation</p>
        <p className="text-gray-400 text-sm mt-1">Choose a thread from the list to view messages and reply.</p>
      </div>
    )
  }

  const canSend = text.trim() && !sending && !isResolved

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-green-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
            {thread.threadId.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">
              Thread: {thread.threadId.slice(0, 12)}...
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <ComplaintTag type={msgType}/>
              {isResolved ? (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  ✓ Resolved
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  ● Active
                </span>
              )}
            </div>
          </div>
        </div>
        {!isResolved && (
          <button onClick={() => onResolve(thread.threadId)}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">
            ✓ Mark Resolved
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-green-50/30">
        {loading ? (
          <Spinner/>
        ) : (
          <>
            {messages.map(msg => {
              const isStaff = msg.senderRole !== 'user'
              return (
                <div key={msg.id} className={`flex flex-col mb-3 ${isStaff ? 'items-end' : 'items-start'}`}>
                  {!isStaff && (
                    <span className="text-xs text-gray-500 font-medium ml-2 mb-1">User</span>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isStaff
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-green-100 rounded-bl-sm'}`}>
                    {msg.messageText}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 mx-2">{fmtTime(msg.timestamp)}</span>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* Reply input */}
      {isResolved
        ? (
          <div className="px-5 py-4 bg-white border-t border-green-100 text-center">
            <p className="text-xs text-gray-400 italic">This conversation is resolved. No further replies needed.</p>
          </div>
        )
        : (
          <div className="flex gap-2 items-end px-4 py-3 bg-white border-t border-green-100 flex-shrink-0">
            <textarea 
              ref={textareaRef}
              value={text} 
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1} 
              disabled={sending} 
              placeholder="Type a reply… (Enter to send)"
              className="flex-1 resize-none border border-green-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 max-h-32 bg-green-50
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              onClick={handleSend} 
              disabled={!canSend}
              type="button"
              className="h-10 w-10 bg-green-700 text-white rounded-xl flex items-center justify-center
                hover:bg-green-800 transition disabled:opacity-40 flex-shrink-0">
              {sending
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                  </svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
              }
            </button>
          </div>
        )
      }
    </div>
  )
}