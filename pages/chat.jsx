import { useRef, useEffect, useState } from 'react'
import { useSession }   from 'next-auth/react'
import { useRouter }    from 'next/router'
import MessageBubble    from '../components/chat/MessageBubble'
import Spinner          from '../components/ui/Spinner'
import Toast            from '../components/ui/Toast'
import { useChat }      from '../hooks/useChat'

const MSG_TYPES = [
  { id: 'INQUIRY',   label: '🔍 Inquiry',   desc: 'Ask about books or services' },
  { id: 'FEEDBACK',  label: '💬 Feedback',  desc: 'Share your experience' },
  { id: 'COMPLAINT', label: '⚠️ Complaint', desc: 'Report an issue' }
]

const LIBRARIES = [
  { id: 'HIGH_SCHOOL',   label: '🏫 High School Library', desc: 'For HS students and faculty' },
  { id: 'MAIN_LIBRARY',  label: '📚 Main Library',       desc: 'For college departments' }
]

export default function ChatPage() {
  const router = useRouter()
  const { data: session }       = useSession()
  const { messages, loading, sendMessage } = useChat()
  const [msgType, setMsgType]   = useState(null)
  const [library, setLibrary]   = useState(null)
  const [toast, setToast]       = useState(null)
  const [text, setText]         = useState('')
  const bottomRef               = useRef(null)
  const textareaRef             = useRef(null)
  
  // 🔥 TRIPLE LOCK SYSTEM
  const submitLockRef           = useRef(false)  // Prevents concurrent sends
  const lastSubmitTimeRef       = useRef(0)      // Debounce timer
  const [isSending, setIsSending] = useState(false)  // UI state
  
  const userId                  = session?.user?.id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hasMessages = messages.length > 0
  const isResolved  = hasMessages && messages[messages.length - 1]?.threadStatus === 'RESOLVED'

  async function handleSend() {
    const trimmedText = text.trim()
    
    // 🔥 CRITICAL: Multi-layer validation
    if (!trimmedText) return
    if (submitLockRef.current) {
      console.log('🔒 Send locked - already in progress')
      return
    }
    if (isSending) {
      console.log('🔒 Send locked - UI state sending')
      return
    }
    if (isResolved) return
    
    // 🔥 DEBOUNCE: Prevent sends within 1 second
    const now = Date.now()
    if (now - lastSubmitTimeRef.current < 1000) {
      console.log('🔒 Send locked - debounce (too fast)')
      return
    }
    
    // Check if first message and missing required fields
    if (!hasMessages && (!msgType || !library)) {
      setToast({ message: 'Please select library and message type', type: 'error' })
      return
    }

    // 🔥 LOCK EVERYTHING IMMEDIATELY
    submitLockRef.current = true
    setIsSending(true)
    lastSubmitTimeRef.current = now
    
    // Clear input immediately to prevent re-submission
    const messageToSend = trimmedText
    setText('')

    try {
      await sendMessage(messageToSend, !hasMessages ? msgType : undefined, library)
    } catch (err) {
      // Only restore text if send actually failed (not a lock error)
      if (!err.message?.includes('Already sending')) {
        setText(messageToSend)
        setToast({ message: err.message || 'Failed to send message.', type: 'error' })
      }
    } finally {
      // 🔥 UNLOCK AFTER DELAY
      setTimeout(() => {
        submitLockRef.current = false
        setIsSending(false)
      }, 1500) // 1.5 second lock
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation() // Stop event bubbling
      
      // Only call handleSend if not locked
      if (!submitLockRef.current && !isSending) {
        handleSend()
      }
    }
  }

  // 🔥 PREVENT ANY FORM SUBMISSION
  function handleFormSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const canSend = text.trim() && !submitLockRef.current && !isSending && !isResolved && 
    (hasMessages || (msgType && library))

  return (
    <div className="min-h-screen bg-green-50 flex flex-col safe-top">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Top bar with BACK BUTTON */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-30">
        <button onClick={() => router.back()}
          className="p-1 rounded-full hover:bg-green-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm">Library Support</p>
          <p className="text-green-300 text-xs">
            {isResolved ? '✓ Resolved' : hasMessages ? '🟢 Active conversation' : 'Start a conversation'}
          </p>
        </div>
      </header>

      {/* Library & Message type selector */}
      {!hasMessages && !loading && (
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
            Select library
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {LIBRARIES.map(lib => (
              <button key={lib.id} onClick={() => setLibrary(lib.id)}
                disabled={isSending}
                className={`p-3 rounded-xl border-2 text-left transition
                  ${library === lib.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'}
                  ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lib.label.split(' ')[0]}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${library === lib.id ? 'text-green-700' : 'text-gray-700'}`}>
                      {lib.label.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{lib.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
            Message type
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {MSG_TYPES.map(t => (
              <button key={t.id} onClick={() => setMsgType(t.id)}
                disabled={isSending}
                className={`p-2.5 rounded-xl border-2 text-center transition
                  ${msgType === t.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'}
                  ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span className="text-base block">{t.label.split(' ')[0]}</span>
                <span className={`text-[10px] font-semibold block mt-0.5
                  ${msgType === t.id ? 'text-green-700' : 'text-gray-500'}`}>
                  {t.label.split(' ')[1]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">
            {library && msgType
              ? `You're contacting ${LIBRARIES.find(l => l.id === library)?.label.split(' ').slice(1).join(' ')}`
              : 'Select both library and message type to continue'}
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 max-w-lg mx-auto w-full chat-scroll">
        {loading
          ? <Spinner/>
          : !hasMessages
            ? <div className="flex flex-col items-center justify-center h-48 text-center">
                <span className="text-4xl mb-3">💬</span>
                <p className="text-green-800 font-semibold text-sm">No messages yet</p>
                <p className="text-gray-400 text-xs mt-1">Send your first message to get started.</p>
              </div>
            : <>
                <div className="bg-green-100 rounded-xl px-3 py-2 mb-4 text-center">
                  <p className="text-xs text-green-700">
                    💡 Library staff will reply as soon as possible. Please be patient.
                  </p>
                </div>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === userId}/>
                ))}
                {isResolved && (
                  <div className="text-center my-4">
                    <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                      ✓ This conversation has been resolved
                    </span>
                  </div>
                )}
                <div ref={bottomRef}/>
              </>
        }
      </div>

      {/* Input - 🔥 WRAPPED IN FORM TO PREVENT DEFAULT SUBMISSION */}
      {!isResolved && (
        <form onSubmit={handleFormSubmit} className="sticky bottom-0 w-full max-w-lg mx-auto bg-white border-t border-green-100 px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea 
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={submitLockRef.current || isSending}
              placeholder={hasMessages ? "Type a message…" : "Select library and type above first"}
              className="flex-1 resize-none border border-green-200 rounded-xl px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 max-h-28 bg-green-50 
                placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              type="button"
              className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center
                disabled:opacity-40 hover:bg-green-800 transition flex-shrink-0">
              {(submitLockRef.current || isSending) ? (
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
          </div>
        </form>
      )}
    </div>
  )
}

export async function getServerSideProps(ctx) {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions }      = await import('./api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/signin', permanent: false } }
  return { props: {} }
}