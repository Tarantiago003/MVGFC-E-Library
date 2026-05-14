import { v4 as uuid } from 'uuid'
import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { trigger, ch } from '../../../../lib/pusher'
import { readSheet, appendRow } from '../../../../lib/sheets'
import {
  SHEETS, COL, ROLES, BORROW_STATUS, THREAD_STATUS
} from '../../../../lib/constants'

// In-memory: track last renewal request per borrowId
// Prevents spam even across multiple button taps before client lock kicks in
const renewalCache = new Map()  // key: borrowId, value: timestamp
const RENEWAL_COOLDOWN = 24 * 60 * 60 * 1000  // 24 hours

// Cleanup old entries every hour
setInterval(() => {
  const cutoff = Date.now() - RENEWAL_COOLDOWN
  for (const [key, ts] of renewalCache.entries()) {
    if (ts < cutoff) renewalCache.delete(key)
  }
}, 60 * 60 * 1000)

async function handlerRenew(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  if (req.user.role !== ROLES.USER)
    httpError(403, 'Only borrowers can request renewals')

  const { id } = req.query

  // Server-side cooldown check
  const cacheKey  = `${req.user.id}:${id}`
  const lastSent  = renewalCache.get(cacheKey)
  if (lastSent && (Date.now() - lastSent) < RENEWAL_COOLDOWN) {
    const hoursAgo = Math.floor((Date.now() - lastSent) / 3600000)
    return res.status(429).json({
      success: false,
      error: `You already sent a renewal request ${hoursAgo}h ago. Please wait for staff to respond.`
    })
  }

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

  const chatText = `📖 Renewal Request — Hi! I would like to request a renewal for Assc. No. ${bookId}. Current due date: ${formattedDue}. Please let me know if it can be extended. Thank you!`
  const chatId   = uuid()

  await appendRow(SHEETS.CHAT, [
    chatId,
    req.user.id,
    req.user.id,
    ROLES.USER,
    'INQUIRY',
    chatText,
    timestamp,
    'FALSE',
    THREAD_STATUS.OPEN,
    location
  ])

  // Record in cache AFTER successful write
  renewalCache.set(cacheKey, Date.now())

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

  await trigger(ch.adminInbox(location), 'new-chat-message', {
    threadId: req.user.id,
    userName: req.user.name,
    preview:  chatText.substring(0, 80),
    library:  location
  })

  res.json({ success: true, message: 'Renewal request sent to library staff.' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerRenew)