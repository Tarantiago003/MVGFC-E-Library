

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

  // Group by threadId
  const threadMap = new Map()
  for (const r of rows) {
    const tid = r[COL.CHAT.THREAD_ID]
    const msgLibrary = r[COL.CHAT.LIBRARY_LOCATION]
    
    // LIBRARY-BASED FILTERING FOR CLERKS
    if (req.user.role === ROLES.CLERK) {
      const assignedLibrary = req.user.assignedLibrary
      if (!assignedLibrary) {
        return res.status(403).json({ 
          success: false, 
          error: 'No library assigned to your account. Please contact admin.' 
        })
      }
      // Skip messages from other libraries
      if (msgLibrary && msgLibrary !== assignedLibrary) continue
    }
    // Admins see all threads (no filter)

    if (!threadMap.has(tid)) {
      threadMap.set(tid, { threadId: tid, messages: [], unread: 0 })
    }
    const t = threadMap.get(tid)
    t.messages.push(r)
    if (r[COL.CHAT.IS_READ] === 'FALSE' && r[COL.CHAT.SENDER_ROLE] === ROLES.USER) {
      t.unread++
    }
  }

  const threads = [...threadMap.values()].map(t => {
    const last = t.messages[t.messages.length - 1]
    return {
      threadId:      t.threadId,
      lastMessage:   last[COL.CHAT.TEXT],
      lastTimestamp: last[COL.CHAT.TIMESTAMP],
      threadStatus:  last[COL.CHAT.THREAD_STATUS],
      unreadCount:   t.unread,
      messageType:   t.messages[0][COL.CHAT.MSG_TYPE],
      library:       last[COL.CHAT.LIBRARY_LOCATION]  // Include library info
    }
  })

  threads.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))

  res.json({ success: true, data: threads, total: threads.length })
}

export default compose(
  withErrorHandler, rateLimiter(), withAuth, withRole(ROLES.ADMIN, ROLES.CLERK)
)(handler)
