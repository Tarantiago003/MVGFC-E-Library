import { v4 as uuid } from 'uuid'
import { compose } from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth } from '../../../../middleware/withAuth'
import { withRole } from '../../../../middleware/withRole'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { trigger, ch } from '../../../../lib/pusher'
import { readSheet, appendRow, batchRead } from '../../../../lib/sheets'
import { SHEETS, COL, ROLES, NOTIF_TYPE } from '../../../../lib/constants'

async function handlerRemind(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query

  // Get borrow request
  const [borrows, users, books] = await batchRead([
    SHEETS.BORROWS,
    SHEETS.USERS,
    SHEETS.BOOKS
  ])

  const borrow = borrows.find(r => r[COL.BORROWS.ID] === id)
  if (!borrow) httpError(404, 'Borrow request not found')

  if (borrow[COL.BORROWS.STATUS] !== 'APPROVED')
    httpError(400, 'Can only send reminders for approved borrows')

  const user = users.find(u => u[COL.USERS.ID] === borrow[COL.BORROWS.USER_ID])
  const book = books.find(b => b[COL.BOOKS.ID] === borrow[COL.BORROWS.BOOK_ID])

  if (!user) httpError(404, 'User not found')

  const dueDate = borrow[COL.BORROWS.DUE_DATE]
  const now = new Date()
  const due = new Date(dueDate)
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24))

  // Create notification
  const notifId = uuid()
  const timestamp = new Date().toISOString()
  
  await appendRow(SHEETS.NOTIFICATIONS, [
    notifId,
    user[COL.USERS.ID],
    NOTIF_TYPE.BORROW_DUE,
    'Book Return Reminder',
    `Your borrowed book "${book?.[COL.BOOKS.TITLE] || borrow[COL.BORROWS.BOOK_ID]}" is ${daysOverdue} day(s) overdue. Please return it as soon as possible.`,
    id,
    'FALSE',
    timestamp
  ])

  // Send Pusher notification
  await trigger(ch.userNotif(user[COL.USERS.ID]), 'overdue-reminder', {
    title: 'Book Return Reminder',
    message: `Your book is ${daysOverdue} days overdue`,
    borrowId: id
  })

  res.json({
    success: true,
    message: 'Reminder sent successfully',
    data: {
      sentTo: user[COL.USERS.EMAIL],
      daysOverdue
    }
  })
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN, ROLES.CLERK)
)(handlerRemind)