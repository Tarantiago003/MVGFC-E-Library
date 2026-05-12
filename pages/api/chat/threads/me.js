import { compose }     from '../../../../lib/compose'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { readSheet }   from '../../../../lib/sheets'
import { SHEETS, COL, ROLES } from '../../../../lib/constants'

async function handlerMe(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const rows = await readSheet(SHEETS.CHAT)

  // Find all threadIds where this user has sent at least one message
  const myThreadIds = new Set(
    rows
      .filter(r => r[COL.CHAT.SENDER_ID] === req.user.id)
      .map(r => r[COL.CHAT.THREAD_ID])
  )

  // Group all rows for those threads
  const threadMap = new Map()
  for (const r of rows) {
    const tid = r[COL.CHAT.THREAD_ID]
    if (!myThreadIds.has(tid)) continue
    if (!threadMap.has(tid)) threadMap.set(tid, [])
    threadMap.get(tid).push(r)
  }

  const threads = [...threadMap.entries()].map(([tid, msgs]) => {
    const last         = msgs[msgs.length - 1]
    const firstUserMsg = msgs.find(m => m[COL.CHAT.SENDER_ROLE] === ROLES.USER)
    // Unread = messages NOT sent by this user that they haven't read
    const unreadCount  = msgs.filter(m =>
      m[COL.CHAT.IS_READ] === 'FALSE' && m[COL.CHAT.SENDER_ID] !== req.user.id
    ).length

    return {
      threadId:      tid,
      lastMessage:   last[COL.CHAT.TEXT],
      lastTimestamp: last[COL.CHAT.TIMESTAMP],
      threadStatus:  last[COL.CHAT.THREAD_STATUS],
      messageType:   firstUserMsg?.[COL.CHAT.MSG_TYPE] || '',
      library:       last[COL.CHAT.LIBRARY_LOCATION] || '',
      unreadCount
    }
  })

  threads.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
  res.json({ success: true, data: threads, total: threads.length })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerMe)