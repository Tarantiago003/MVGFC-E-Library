import { compose }     from '../../../../lib/compose'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { withRole }    from '../../../../middleware/withRole'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { readSheet }   from '../../../../lib/sheets'
import { SHEETS, COL, ROLES } from '../../../../lib/constants'

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const rows = await readSheet(SHEETS.CHAT)
  const threadMap = new Map()

  for (const r of rows) {
    const tid        = r[COL.CHAT.THREAD_ID]
    const msgLibrary = r[COL.CHAT.LIBRARY_LOCATION]

    if (req.user.role === ROLES.CLERK) {
      const assignedLibrary = req.user.assignedLibrary
      if (!assignedLibrary)
        return res.status(403).json({ success: false, error: 'No library assigned to your account.' })
      if (msgLibrary && msgLibrary !== assignedLibrary) continue
    }

    if (!threadMap.has(tid)) threadMap.set(tid, { threadId: tid, messages: [], unread: 0 })
    const t = threadMap.get(tid)
    t.messages.push(r)
    if (r[COL.CHAT.IS_READ] === 'FALSE' && r[COL.CHAT.SENDER_ROLE] === ROLES.USER) t.unread++
  }

  const threads = [...threadMap.values()].map(t => {
    const last = t.messages[t.messages.length - 1]

    // userId = first user-role sender — works for both old (threadId=userId)
    // and new (threadId=UUID) style threads
    const firstUserMsg = t.messages.find(m => m[COL.CHAT.SENDER_ROLE] === ROLES.USER)
    const userId = firstUserMsg?.[COL.CHAT.SENDER_ID] || t.threadId

    return {
      threadId:      t.threadId,
      userId,                          // used by ThreadList for name lookup
      lastMessage:   last[COL.CHAT.TEXT],
      lastTimestamp: last[COL.CHAT.TIMESTAMP],
      threadStatus:  last[COL.CHAT.THREAD_STATUS],
      unreadCount:   t.unread,
      messageType:   t.messages[0][COL.CHAT.MSG_TYPE],
      library:       last[COL.CHAT.LIBRARY_LOCATION]
    }
  })

  threads.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
  res.json({ success: true, data: threads, total: threads.length })
}

export default compose(
  withErrorHandler, rateLimiter(), withAuth, withRole(ROLES.ADMIN, ROLES.CLERK)
)(handler)