import { compose }     from '../../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../../middleware/errorHandler'
import { withAuth }    from '../../../../../middleware/withAuth'
import { rateLimiter } from '../../../../../middleware/rateLimiter'
import { readSheet, batchUpdate, rowNum, cellRange } from '../../../../../lib/sheets'
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

  // Users can only read their own thread
  if (!isStaff && threadId !== req.user.id)
    httpError(403, 'Access denied')

  const rows = await readSheet(SHEETS.CHAT)
  let msgs = rows.filter(r => r[COL.CHAT.THREAD_ID] === threadId)
  
  if (!msgs.length) httpError(404, 'Thread not found')

  // 🔧 FIX: More permissive library filtering for clerks
  if (req.user.role === ROLES.CLERK) {
    const assignedLibrary = req.user.assignedLibrary
    
    // If clerk has NO assigned library, deny access entirely
    if (!assignedLibrary) {
      return res.status(403).json({ 
        success: false, 
        error: 'No library assigned to your account. Please contact admin.' 
      })
    }
    
    // Check thread library (use first message's library location)
    const threadLibrary = msgs[0]?.[COL.CHAT.LIBRARY_LOCATION]
    
    // 🔧 FIX: Only deny if thread has a library AND it doesn't match
    // If threadLibrary is empty/undefined, allow access (legacy threads)
    if (threadLibrary && threadLibrary !== assignedLibrary) {
      return res.status(403).json({
        success: false,
        error: `This conversation belongs to ${threadLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library'}. You are assigned to ${assignedLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library'}.`
      })
    }
  }

  // Mark messages as read (for staff viewing)
  if (isStaff) {
    const unread = msgs
      .map((r, i) => ({ r, sheetRow: rows.indexOf(r) + 2 }))
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