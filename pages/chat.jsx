import { useRef, useEffect, useState } from 'react'
import { useSession }      from 'next-auth/react'
import { useRouter }       from 'next/router'
import { v4 as uuid }      from 'uuid'
import MessageBubble       from '../components/chat/MessageBubble'
import ComplaintTag        from '../components/chat/ComplaintTag'
import Spinner             from '../components/ui/Spinner'
import Toast               from '../components/ui/Toast'
import Logo                from '../components/ui/Logo'
import { useChat }         from '../hooks/useChat'
import { useNotifications } from '../hooks/useNotifications'

const MSG_TYPES = [
  { id: 'INQUIRY',   label: '🔍 Inquiry',   desc: 'Ask about books or services' },
  { id: 'FEEDBACK',  label: '💬 Feedback',  desc: 'Share your experience' },
  { id: 'COMPLAINT', label: '⚠️ Complaint', desc: 'Report an issue' }
]
const LIBRARIES = [
  { id: 'HIGH_SCHOOL',  label: '🏫 High School Library', desc: 'For HS students and faculty' },
  { id: 'MAIN_LIBRARY', label: '📚 Main Library',        desc: 'For college departments' }
]

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function ChatPage() {
  const router = useRouter()
  const { data: session }  = useSession()
  const { notifications, markRead } = useNotifications()
  const {
    threads, threadsLoading,
    messages, messagesLoading,
    activeThreadId, setActiveThreadId,
    sendMessage
  } = useChat()

  const userId = session?.user?.id

  const [showNewForm, setShowNewForm] = useState(false)
  const [newMsgType,  setNewMsgType]  = useState(null)
  const [newLibrary,  setNewLibrary]  = useState(null)
  const [newText,     setNewText]     = useState('')
  const [startingNew, setStartingNew] = useState(false)

  const [replyText,  setReplyText]  = useState('')
  const [isSending,  setIsSending]  = useState(false)
  const submitLockRef = useRef(false)
  const lastSubmitRef = useRef(0)

  const [toast, setToast] = useState(null)
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!notifications.length) return
    notifications
      .filter(n => !n.isRead && n.type === 'CHAT_REPLY')
      .forEach(n => markRead(n.id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length])

  const activeThread = threads.find(t => t.threadId === activeThreadId) || null
  const isResolved   = activeThread?.threadStatus === 'RESOLVED'

  async function handleCreateTicket() {
    if (!newText.trim() || !newMsgType || !newLibrary) {
      setToast({ message: 'Please fill in all fields', type: 'error' })
      return
    }
    setStartingNew(true)
    const newThreadId = uuid()
    try {
      await sendMessage(newText.trim(), newMsgType, newLibrary, newThreadId)
      setShowNewForm(false); setNewText(''); setNewMsgType(null); setNewLibrary(null)
      setActiveThreadId(newThreadId)
    } catch (err) {
      setToast({ message: err.message || 'Failed to create ticket.', type: 'error' })
    } finally {
      setStartingNew(false)
    }
  }

  async function handleReply() {
    const trimmed = replyText.trim()
    if (!trimmed || submitLockRef.current || isSending || isResolved) return
    const now = Date.now()
    if (now - lastSubmitRef.current < 1000) return

    submitLockRef.current = true
    setIsSending(true)
    lastSubmitRef.current = now
    setReplyText('')

    try {
      await sendMessage(trimmed)
    } catch (err) {
      if (!err.message?.includes('progress')) {
        setReplyText(trimmed)
        setToast({ message: err.message || 'Failed to send.', type: 'error' })
      }
    } finally {
      setTimeout(() => { submitLockRef.current = false; setIsSending(false) }, 1500)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); e.stopPropagation()
      if (!submitLockRef.current && !isSending) handleReply()
    }
  }

  const canSend = replyText.trim() && !submitLockRef.current && !isSending && !isResolved

  return (
    <div className="min-h-screen bg-green-50 flex flex-col safe-top">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      {/* ── Top bar ── */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-30">
        {/* Back / Logo */}
        {activeThreadId
          ? (
            <button onClick={() => setActiveThreadId(null)}
              className="p-1 rounded-full hover:bg-green-700 transition flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )
          : (
            <button onClick={() => router.back()}
              className="p-1 rounded-full hover:bg-green-700 transition flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )
        }

        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo size={8} dark={true}/>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {activeThreadId
              ? `${LIBRARIES.find(l => l.id === activeThread?.library)?.label.split(' ').slice(1).join(' ') || 'Library'} Support`
              : 'My Tickets'}
          </p>
          <p className="text-green-300 text-xs">
            {activeThreadId
              ? isResolved ? '✔ Resolved' : '🟢 Active'
              : `${threads.length} ticket${threads.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {!activeThreadId && (
          <button onClick={() => { setShowNewForm(true); setActiveThreadId(null) }}
            className="bg-white text-green-800 text-xs font-bold px-3 py-1.5 rounded-xl
              hover:bg-green-100 transition flex-shrink-0">
            + New Ticket
          </button>
        )}
      </header>

      {/* ── Thread list ── */}
      {!activeThreadId && (
        <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">

          {showNewForm && (
            <div className="m-4 bg-white rounded-2xl border border-green-200 p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-green-800">New Support Ticket</p>

              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wide">Library</p>
                <div className="grid grid-cols-2 gap-2">
                  {LIBRARIES.map(lib => (
                    <button key={lib.id} onClick={() => setNewLibrary(lib.id)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-semibold text-left transition
                        ${newLibrary === lib.id
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                      {lib.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wide">Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {MSG_TYPES.map(t => (
                    <button key={t.id} onClick={() => setNewMsgType(t.id)}
                      className={`p-2 rounded-xl border-2 text-center text-xs font-semibold transition
                        ${newMsgType === t.id
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                      <span className="block text-base">{t.label.split(' ')[0]}</span>
                      {t.label.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={3}
                placeholder="Describe your inquiry, feedback, or complaint…"
                className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-green-50"/>

              <div className="flex gap-2">
                <button onClick={() => { setShowNewForm(false); setNewText(''); setNewMsgType(null); setNewLibrary(null) }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 text-xs font-semibold
                    py-2 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleCreateTicket}
                  disabled={startingNew || !newText.trim() || !newMsgType || !newLibrary}
                  className="flex-1 bg-green-700 text-white text-xs font-semibold py-2 rounded-xl
                    hover:bg-green-800 transition disabled:opacity-50">
                  {startingNew ? 'Sending…' : '✔ Submit Ticket'}
                </button>
              </div>
            </div>
          )}

          {threadsLoading ? (
            <Spinner/>
          ) : threads.length === 0 && !showNewForm ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <span className="text-5xl mb-4">💬</span>
              <p className="font-semibold text-green-800">No tickets yet</p>
              <p className="text-gray-400 text-sm mt-1">Tap <strong>+ New Ticket</strong> to contact library staff.</p>
            </div>
          ) : (
            <div className="divide-y divide-green-50">
              {threads.map(t => {
                const lib      = LIBRARIES.find(l => l.id === t.library)
                const resolved = t.threadStatus === 'RESOLVED'
                return (
                  <button key={t.threadId}
                    onClick={() => { setActiveThreadId(t.threadId); setShowNewForm(false) }}
                    className="w-full text-left px-4 py-4 hover:bg-green-50 transition flex gap-3 items-start">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                      text-white text-sm font-bold ${resolved ? 'bg-gray-400' : 'bg-green-600'}`}>
                      {t.messageType === 'COMPLAINT' ? '⚠' : t.messageType === 'FEEDBACK' ? '💬' : '🔍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ComplaintTag type={t.messageType}/>
                          {resolved && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                              ✔ Resolved
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{fmtTime(t.lastTimestamp)}</span>
                      </div>
                      <p className="text-xs text-green-700 mt-0.5 font-medium">{lib?.label || t.library}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{t.lastMessage}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px]
                        font-bold rounded-full flex items-center justify-center">
                        {t.unreadCount > 9 ? '9+' : t.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Thread detail ── */}
      {activeThreadId && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 max-w-lg mx-auto w-full chat-scroll">
            {messagesLoading ? <Spinner/> : (
              <>
                <div className="bg-green-100 rounded-xl px-3 py-2 mb-4 text-center">
                  <p className="text-xs text-green-700">
                    💡 Library staff will reply as soon as possible. Please be patient.
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
                    <div>
                      <button onClick={() => { setShowNewForm(true); setActiveThreadId(null) }}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs
                          font-semibold px-4 py-2 rounded-xl transition">
                        + Open New Ticket
                      </button>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </>
            )}
          </div>

          {!isResolved && (
            <form onSubmit={e => { e.preventDefault(); e.stopPropagation() }}
              className="sticky bottom-0 w-full max-w-lg mx-auto bg-white border-t border-green-100 px-4 py-3">
              <div className="flex gap-2 items-end">
                <textarea ref={textareaRef} value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown} rows={1} disabled={isSending}
                  placeholder="Type a reply…"
                  className="flex-1 resize-none border border-green-200 rounded-xl px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500 max-h-28 bg-green-50
                    placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ overflowY: replyText.split('\n').length > 3 ? 'auto' : 'hidden' }}/>
                <button onClick={handleReply} disabled={!canSend} type="button"
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
        </>
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