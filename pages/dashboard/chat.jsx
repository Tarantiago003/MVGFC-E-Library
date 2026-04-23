import { useState, useRef } from 'react'  // ADD useRef
import DashboardLayout        from '../../components/layout/DashboardLayout'
import ThreadList             from '../../components/chat/ThreadList'
import ChatPanel              from '../../components/chat/ChatPanel'
import Toast                  from '../../components/ui/Toast'
import { useDashboardChat }   from '../../hooks/useDashboardChat'
import { withDashboardAuth }  from '../../components/guards/withDashboardAuth'

export default function ChatConsolePage() {
  const {
    threads, threadsLoading,
    messages, msgsLoading,
    activeThread, setActiveThread,
    sendReply, resolveThread
  } = useDashboardChat()

  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)
  const sendLockRef = useRef(false)  // ADD THIS

  const activeThreadObj = threads.find(t => t.threadId === activeThread) || null

  async function handleSend(text) {
    // CRITICAL FIX: Add lock to prevent double sends
    if (sendLockRef.current || sending) {
      console.log('Send already in progress, skipping...')
      return
    }

    sendLockRef.current = true
    setSending(true)

    try {
      await sendReply(text)
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setTimeout(() => {
        sendLockRef.current = false
        setSending(false)
      }, 1000) // 1 second lock
    }
  }

  async function handleResolve(threadId) {
    try {
      await resolveThread(threadId)
      setToast({ message: 'Thread marked as resolved.' })
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
  }

  // Filter stats
  const openCount       = threads.filter(t => t.threadStatus === 'OPEN').length
  const complaintCount  = threads.filter(t => t.messageType === 'COMPLAINT' && t.threadStatus === 'OPEN').length
  const totalUnread     = threads.reduce((s, t) => s + (t.unreadCount || 0), 0)

  return (
    <DashboardLayout title="Chat Console">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      {/* Summary strip */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Open Threads',     value: openCount,      color: 'bg-blue-50   border-blue-200   text-blue-700'   },
          { label: 'Unread Messages',  value: totalUnread,    color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Open Complaints',  value: complaintCount, color: 'bg-red-50    border-red-200    text-red-700'    },
          { label: 'Total Threads',    value: threads.length, color: 'bg-green-50  border-green-200  text-green-700'  },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl px-4 py-3 flex gap-3 items-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Split-pane chat console */}
      <div className="flex rounded-2xl border border-green-100 shadow-sm overflow-hidden bg-white"
        style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left: thread list */}
        <div className="w-72 flex-shrink-0 border-r border-green-100 flex flex-col">
          <div className="px-4 py-3 border-b border-green-100 bg-green-50">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Conversations</p>
          </div>
          <ThreadList
            threads={threads}
            activeThread={activeThread}
            onSelect={setActiveThread}
            loading={threadsLoading}
          />
        </div>

        {/* Right: chat panel */}
        <ChatPanel
          messages={messages}
          thread={activeThreadObj}
          loading={msgsLoading}
          onSend={handleSend}
          onResolve={handleResolve}
          sending={sending}
        />
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps = withDashboardAuth()