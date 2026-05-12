import { v4 as uuid } from 'uuid'
import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { withRole }    from '../../../../middleware/withRole'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { trigger, ch } from '../../../../lib/pusher'
import { readSheet, appendRow, batchRead } from '../../../../lib/sheets'
import {
  SHEETS, COL, ROLES, NOTIF_TYPE, THREAD_STATUS, getBooksSheet
} from '../../../../lib/constants'

async function handlerRemind(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query

  // Read borrows first to determine which books sheet to use
  const borrowsRows = await readSheet(SHEETS.BORROWS)
  const borrow = borrowsRows.find(r => r[COL.BORROWS.ID] === id)
  if (!borrow) httpError(404, 'Borrow request not found')
  if (borrow[COL.BORROWS.STATUS] !== 'APPROVED')
    httpError(400, 'Can only send reminders for approved borrows')

  const borrowLocation = borrow[COL.BORROWS.LOCATION]
  const booksSheetName = getBooksSheet(borrowLocation)   // FIX: use correct sheet

  const [users, books] = await batchRead([SHEETS.USERS, booksSheetName])

  const user = users.find(u => u[COL.USERS.ID] === borrow[COL.BORROWS.USER_ID])
  const book = books.find(b => b[COL.BOOKS.ID] === borrow[COL.BORROWS.BOOK_ID])
  if (!user) httpError(404, 'User not found')

  const dueDate  = borrow[COL.BORROWS.DUE_DATE]
  const now      = new Date()
  const due      = new Date(dueDate)
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24))
  const timestamp   = new Date().toISOString()

  const bookTitle   = book?.[COL.BOOKS.TITLE] || `Assc. No. ${borrow[COL.BORROWS.BOOK_ID]}`
  const formattedDue = new Date(dueDate).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  // 1. In-app notification
  await appendRow(SHEETS.NOTIFICATIONS, [
    uuid(), user[COL.USERS.ID],
    NOTIF_TYPE.BORROW_DUE,
    '⚠️ Book Return Reminder',
    `Your borrowed book "${bookTitle}" is ${daysOverdue} day(s) overdue (due: ${formattedDue}). Please return it as soon as possible.`,
    id, 'FALSE', timestamp
  ])

  // 2. Chat message from staff into the user's thread — allows the user to reply
  const chatText = `📚 *Overdue Notice* — Hello! This is a reminder from ${req.user.name} that the book "${bookTitle}" was due on ${formattedDue} and is now ${daysOverdue} day(s) overdue. Please return it to the library at your earliest convenience. If you need an extension, you can reply here. Thank you!`
  const chatId   = uuid()

  await appendRow(SHEETS.CHAT, [
    chatId,
    user[COL.USERS.ID],   
    req.user.id,           
    req.user.role,         
    'INQUIRY',
    chatText,
    timestamp,
    'FALSE',
    THREAD_STATUS.OPEN,
    borrowLocation
  ])

  // 3. Pusher: update borrower's notification badge
  await trigger(ch.userNotif(user[COL.USERS.ID]), 'overdue-reminder', {
    title:    '⚠️ Book Return Reminder',
    message:  `Your book is ${daysOverdue} day(s) overdue`,
    borrowId: id
  })

  // 4. Pusher: push chat message to borrower's chat channel (live update)
  await trigger(ch.chat(user[COL.USERS.ID]), 'new-message', {
    id:          chatId,
    threadId:    user[COL.USERS.ID],
    senderId:    req.user.id,
    senderName:  req.user.name,
    senderRole:  req.user.role,
    messageText: chatText,
    timestamp,
    libraryLocation: borrowLocation
  })

  // 5. Pusher: refresh thread list in admin chat console
  await trigger(ch.adminInbox(borrowLocation), 'new-chat-message', {
    threadId: user[COL.USERS.ID],
    userName: user[COL.USERS.NAME],
    preview:  chatText.substring(0, 80),
    library:  borrowLocation
  })

  res.json({
    success: true,
    message: 'Reminder sent successfully',
    data:    { sentTo: user[COL.USERS.EMAIL], daysOverdue, chatSent: true }
  })
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN, ROLES.CLERK)
)(handlerRemind)