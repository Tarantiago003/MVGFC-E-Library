import { useRef, useEffect, useState } from 'react'
import { useSession }   from 'next-auth/react'
import { useRouter }    from 'next/router'
import MessageBubble    from '../components/chat/MessageBubble'
import Spinner          from '../components/ui/Spinner'
import Toast            from '../components/ui/Toast'
import { useChat }      from '../hooks/useChat'
import { useNotifications } from '../hooks/useNotifications'
import api              from '../lib/api'

const MSG_TYPES = [
  { id: 'INQUIRY',   label: '🔍 Inquiry',   desc: 'Ask about books or services' },
  { id: 'FEEDBACK',  label: '💬 Feedback',  desc: 'Share your experience' },
  { id: 'COMPLAINT', label: '⚠️ Complaint', desc: 'Report an issue' }
]

const LIBRARIES = [
  { id: 'HIGH_SCHOOL',  label: '🏫 High School Library', desc: 'For HS students and faculty' },
  { id: 'MAIN_LIBRARY', label: '📚 Main Library',        desc: 'For college departments' }
]

export default function ChatPage() {
  const router  = useRouter()
  const { data: session }  = useSession()
  const { messages, loading, sendMessage } = useChat()
  const { notifications, markRead }        = useNotifications()

  const [msgType,    setMsgType]    = useState(null)
  const [library,    setLibrary]    = useState(null)
  const [toast,      setToast]      = useState(null)
  const [text,       setText]       = useState('')
  const bottomRef                   = useRef(null)
  const textareaRef                 = useRef(null)
  const submitLockRef               = useRef(false)
  const lastSubmitRef               = useRef(0)
  const [isSending,  setIsSending]  = useState(false)
  const userId = session?.user?.id

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // AUTO-CLEAR chat-reply notifications when user opens this page
  useEffect(() => {
    if (!notifications.length) return
    notifications
      .filter(n => !n.isRead && n.type === 'CHAT_REPLY')
      .forEach(n => markRead(n.id))
  // Run once on mount + whenever new notifications arrive
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length])

  const hasMessages = messages.length > 0
  const isResolved  = hasMessages && messages[messages.length - 1]?.threadStatus === 'RESOLVED'

  async function handleSend() {
    const trimmedText = text.trim()
    if (!trimmedText) return
    if (submitLockRef.current || isSending || isResolved) return
    const now = Date.now()
    if (now - lastSubmitRef.current < 1000) return
    if (!hasMessages && (!msgType || !library)) {
      setToast({ message: 'Please select library and message type', type: 'error' })
      return
    }

    submitLockRef.current = true
    setIsSending(true)
    lastSubmitRef.current = now
    const msg = trimmedText
    setText('')

    try {
      await sendMessage(msg, !hasMessages ? msgType : undefined, library)
    } catch (err) {
      if (!err.message?.includes('progress')) {
        setText(msg)
        setToast({ message: err.message || 'Failed to send.', type: 'error' })
      }
    } finally {
      setTimeout(() => { submitLockRef.current = false; setIsSending(false) }, 1500)
      textareaRef.current?.focus()
    }
  }

  // NEW CONVERSATION — posts first message to a fresh thread
  // Achieved by calling sendMessage with fresh msgType + library (user selects again)
  const [showNewConv, setShowNewConv] = useState(false)
  const [newMsgType,  setNewMsgType]  = useState(null)
  const [newLibrary,  setNewLibrary]  = useState(null)
  const [newText,     setNewText]     = useState('')
  const [startingNew, setStartingNew] = useState(false)

  async function handleStartNew() {
    if (!newText.trim() || !newMsgType || !newLibrary) {
      setToast({ message: 'Please fill in all fields', type: 'error' })
      return
    }
    setStartingNew(true)
    try {
      // Re-open the thread by sending a new message with type + library
      await api.post('/chat/messages', {
        threadId:    userId,
        messageText: newText.trim(),
        messageType: newMsgType,
        library:     newLibrary
      })
      setShowNewConv(false)
      setNewText('')
      setNewMsgType(null)
      setNewLibrary(null)
      // SWR will revalidate and show the new message
    } catch (err) {
      setToast({ message: err.message || 'Failed to start conversation.', type: 'error' })
    } finally {
      setStartingNew(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      if (!submitLockRef.current && !isSending) handleSend()
    }
  }

  const canSend = text.trim() && !submitLockRef.current && !isSending && !isResolved &&
    (hasMessages || (msgType && library))

  return (
    <div className="min-h-screen bg-green-50 flex flex-col safe-top">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Top bar */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-30">
        <button onClick={() => router.back()}
          className="p-1 rounded-full hover:bg-green-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
            {isResolved ? '✔ Resolved' : hasMessages ? '🟢 Active conversation' : 'Start a conversation'}
          </p>
        </div>
      </header>

      {/* First-message selector */}
      {!hasMessages && !loading && (
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Select library</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {LIBRARIES.map(lib => (
              <button key={lib.id} onClick={() => setLibrary(lib.id)} disabled={isSending}
                className={`p-3 rounded-xl border-2 text-left transition
                  ${library === lib.id ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}
                  ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lib.label.split(' ')[0]}</span>
                  <div>
                    <p className={`text-xs font-semibold ${library === lib.id ? 'text-green-700' : 'text-gray-700'}`}>
                      {lib.label.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{lib.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Message type</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {MSG_TYPES.map(t => (
              <button key={t.id} onClick={() => setMsgType(t.id)} disabled={isSending}
                className={`p-2.5 rounded-xl border-2 text-center transition
                  ${msgType === t.id ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 max-w-lg mx-auto w-full chat-scroll">
        {loading ? <Spinner/> : !hasMessages
          ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-green-800 font-semibold text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs mt-1">Send your first message to get started.</p>
            </div>
          ) : (
            <>
              <div className="bg-green-100 rounded-xl px-3 py-2 mb-4 text-center">
                <p className="text-xs text-green-700">
                  💡 Library staff will reply as soon as possible.
                </p>
              </div>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === userId}/>
              ))}
              {isResolved && (
                <div className="text-center my-4 space-y-3">
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full inline-block">
                    ✔ This conversation has been resolved
                  </span>
                  {/* NEW CONVERSATION BUTTON */}
                  {!showNewConv && (
                    <div>
                      <button
                        onClick={() => setShowNewConv(true)}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs
                          font-semibold px-4 py-2 rounded-xl transition">
                        + Start New Conversation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* New conversation form (shown after clicking the button) */}
              {isResolved && showNewConv && (
                <div className="bg-white rounded-2xl border border-green-200 p-4 mt-2 space-y-3">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wide">
                    New Conversation
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {LIBRARIES.map(lib => (
                      <button key={lib.id} onClick={() => setNewLibrary(lib.id)}
                        className={`p-2 rounded-xl border-2 text-xs font-semibold transition
                          ${newLibrary === lib.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                        {lib.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {MSG_TYPES.map(t => (
                      <button key={t.id} onClick={() => setNewMsgType(t.id)}
                        className={`p-2 rounded-xl border-2 text-xs font-semibold transition
                          ${newMsgType === t.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    rows={3}
                    placeholder="Type your message…"
                    className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-green-50"
                  />

                  <div className="flex gap-2">
                    <button onClick={() => { setShowNewConv(false); setNewText('') }}
                      className="flex-1 border-2 border-gray-200 text-gray-600 text-xs
                        font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={handleStartNew} disabled={startingNew || !newText.trim() || !newMsgType || !newLibrary}
                      className="flex-1 bg-green-700 text-white text-xs font-semibold py-2
                        rounded-xl hover:bg-green-800 transition disabled:opacity-50">
                      {startingNew ? 'Sending…' : '✔ Send'}
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef}/>
            </>
          )
        }
      </div>

      {/* Input bar — hidden when resolved */}
      {!isResolved && (
        <form onSubmit={e => { e.preventDefault(); e.stopPropagation() }}
          className="sticky bottom-0 w-full max-w-lg mx-auto bg-white border-t border-green-100 px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isSending}
              placeholder={hasMessages ? 'Type a message…' : 'Select library and type above first'}
              className="flex-1 resize-none border border-green-200 rounded-xl px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 max-h-28 bg-green-50
                placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
            />
            <button onClick={handleSend} disabled={!canSend} type="button"
              className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center
                justify-center disabled:opacity-40 hover:bg-green-800 transition flex-shrink-0">
              {isSending
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                  </svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
              }
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