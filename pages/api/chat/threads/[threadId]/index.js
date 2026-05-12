import { compose }     from '../../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../../middleware/errorHandler'
import { withAuth }    from '../../../../../middleware/withAuth'
import { rateLimiter } from '../../../../../middleware/rateLimiter'
import { readSheet, batchUpdate, cellRange } from '../../../../../lib/sheets'
import { SHEETS, COL, ROLES } from '../../../../../lib/constants'

export function toMessage(r) {
  return {
    id:           r[COL.CHAT.ID],
    threadId:     r[COL.CHAT.THREAD_ID],
    senderId:     r[COL.CHAT.SENDER_ID],
    senderRole:   r[COL.CHAT.SENDER_ROLE],
    messageType:  r[COL.CHAT.MSG_TYPE],
    messageText:  r[COL.CHAT.TEXT],
    timestamp:    r[COL.CHAT.TIMESTAMP],
    isRead:       r[COL.CHAT.IS_READ] === 'TRUE',
    threadStatus: r[COL.CHAT.THREAD_STATUS]
  }
}

async function handlerThread(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { threadId } = req.query
  const isStaff = [ROLES.ADMIN, ROLES.CLERK].includes(req.user.role)

  const rows = await readSheet(SHEETS.CHAT)
  let msgs = rows.filter(r => r[COL.CHAT.THREAD_ID] === threadId)
  if (!msgs.length) httpError(404, 'Thread not found')

  // Users: verify ownership via senderId (works for UUID threads too)
  if (!isStaff) {
    const isOwner = msgs.some(r => r[COL.CHAT.SENDER_ID] === req.user.id)
    if (!isOwner) httpError(403, 'Access denied')
  }

  // Clerks: library-based filtering
  if (req.user.role === ROLES.CLERK) {
    const assignedLibrary = req.user.assignedLibrary
    if (!assignedLibrary)
      return res.status(403).json({ success: false, error: 'No library assigned to your account.' })
    const threadLibrary = msgs[0]?.[COL.CHAT.LIBRARY_LOCATION]
    if (threadLibrary && threadLibrary !== assignedLibrary)
      return res.status(403).json({
        success: false,
        error: `This conversation belongs to a different library.`
      })
  }

  // Mark messages as read (staff viewing user messages)
  if (isStaff) {
    const unread = msgs
      .map((r, _) => ({ r, sheetRow: rows.indexOf(r) + 2 }))
      .filter(({ r }) => r[COL.CHAT.IS_READ] === 'FALSE' && r[COL.CHAT.SENDER_ROLE] === ROLES.USER)

    if (unread.length) {
      const updates = unread.map(({ sheetRow }) => ({
        range:  cellRange(SHEETS.CHAT, sheetRow, COL.CHAT.IS_READ),
        values: ['TRUE']
      }))
      await batchUpdate(updates)
    }
  }

  res.json({ success: true, data: msgs.map(toMessage), total: msgs.length })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerThread)