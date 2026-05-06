import { v4 as uuid } from 'uuid'
import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { trigger, ch } from '../../../../lib/pusher'
import { readSheet, appendRow } from '../../../../lib/sheets'
import {
  SHEETS, COL, ROLES, NOTIF_TYPE, BORROW_STATUS, THREAD_STATUS
} from '../../../../lib/constants'

async function handlerRenew(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  if (req.user.role !== ROLES.USER)
    httpError(403, 'Only borrowers can request renewals')

  const { id } = req.query
  const borrows = await readSheet(SHEETS.BORROWS)
  const borrow  = borrows.find(r => r[COL.BORROWS.ID] === id)

  if (!borrow) httpError(404, 'Borrow request not found')
  if (borrow[COL.BORROWS.USER_ID] !== req.user.id) httpError(403, 'Access denied')
  if (borrow[COL.BORROWS.STATUS]  !== BORROW_STATUS.APPROVED)
    httpError(400, 'Can only request renewal for approved borrows')

  const location  = borrow[COL.BORROWS.LOCATION]
  const bookId    = borrow[COL.BORROWS.BOOK_ID]
  const dueDate   = borrow[COL.BORROWS.DUE_DATE]
  const timestamp = new Date().toISOString()

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  // Message posted to the user's own chat thread so staff can see & respond
  const chatText = `📖 Renewal Request — Hi! I would like to request a renewal for Assc. No. ${bookId}. Current due date: ${formattedDue}. Please let me know if it can be extended. Thank you!`

  const chatId = uuid()
  await appendRow(SHEETS.CHAT, [
    chatId,
    req.user.id,        // threadId = userId
    req.user.id,        // senderId
    ROLES.USER,         // senderRole
    'INQUIRY',          // messageType
    chatText,
    timestamp,
    'FALSE',
    THREAD_STATUS.OPEN,
    location
  ])

  // Real-time: update user's own chat page
  await trigger(ch.chat(req.user.id), 'new-message', {
    id:          chatId,
    threadId:    req.user.id,
    senderId:    req.user.id,
    senderName:  req.user.name,
    senderRole:  ROLES.USER,
    messageText: chatText,
    timestamp,
    libraryLocation: location
  })

  // Real-time: notify admin inbox (thread list refresh)
  await trigger(ch.adminInbox(location), 'new-chat-message', {
    threadId: req.user.id,
    userName: req.user.name,
    preview:  chatText.substring(0, 80),
    library:  location
  })

  res.json({ success: true, message: 'Renewal request sent to library staff.' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerRenew)