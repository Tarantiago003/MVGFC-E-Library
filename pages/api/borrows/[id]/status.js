import Joi from 'joi'
import { v4 as uuid }  from 'uuid'
import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { withRole }    from '../../../../middleware/withRole'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { enqueue }     from '../../../../lib/queue'
import { trigger, ch } from '../../../../lib/pusher'
import * as cache      from '../../../../lib/cache'
import {
  batchRead, appendRow, batchUpdate, rowNum, cellRange
} from '../../../../lib/sheets'
import {
  SHEETS, COL, ROLES, BORROW_STATUS, NOTIF_TYPE
} from '../../../../lib/constants'

const allowedTransitions = {
  [BORROW_STATUS.PENDING]:  [BORROW_STATUS.APPROVED, BORROW_STATUS.REJECTED],
  [BORROW_STATUS.APPROVED]: [BORROW_STATUS.RETURNED]
}

const schema = Joi.object({
  status:  Joi.string().valid(
    BORROW_STATUS.APPROVED, BORROW_STATUS.REJECTED, BORROW_STATUS.RETURNED
  ).required(),
  notes:   Joi.string().max(500).optional().allow(''),
  dueDate: Joi.string().isoDate().optional()   // Required when APPROVED
})

async function handlerBorrowStatus(req, res) {
  if (req.method !== 'PATCH')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query
  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  const { status: newStatus, notes = '', dueDate = '' } = value
  if (newStatus === BORROW_STATUS.APPROVED && !dueDate)
    httpError(400, 'dueDate is required when approving a borrow request')

  await enqueue(async () => {
    // 🔧 FIX: Read borrows first to determine which books sheet to use
    const borrowsRows = await batchRead([SHEETS.BORROWS])
    const borrows = borrowsRows[0]

    // Find the borrow request
    const borrow = borrows.find(r => r[COL.BORROWS.ID] === id)
    if (!borrow) httpError(404, 'Borrow request not found')

    const curStatus = borrow[COL.BORROWS.STATUS]
    const allowed   = allowedTransitions[curStatus] || []
    if (!allowed.includes(newStatus))
      httpError(400, `Cannot transition from ${curStatus} to ${newStatus}`)

    // 🔧 FIX: Determine correct books sheet based on location
    const borrowLocation = borrow[COL.BORROWS.LOCATION]
    const booksSheetName = borrowLocation === 'HIGH_SCHOOL' 
      ? SHEETS.BOOKS_HS 
      : SHEETS.BOOKS_MAIN

    // Now read the correct books sheet
    const [books] = await batchRead([booksSheetName])

    const brRow  = rowNum(borrows, COL.BORROWS.ID, id)
    const now    = new Date().toISOString()
    const bookId = borrow[COL.BORROWS.BOOK_ID]

    const bookRow  = rowNum(books, COL.BOOKS.ID, bookId)
    const available = parseInt(books.find(b => b[COL.BOOKS.ID] === bookId)?.[COL.BOOKS.AVAILABLE]) || 0

    // Build batch updates
    const updates = [
      { range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.STATUS),       values: [newStatus] },
      { range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.APPROVAL_DATE), values: [now] },
      { range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.DUE_DATE),      values: [dueDate] },
      { range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.PROCESSED_BY),  values: [req.user.id] },
      { range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.NOTES),         values: [notes] }
    ]

    if (newStatus === BORROW_STATUS.RETURNED) {
      updates.push({ range: cellRange(SHEETS.BORROWS, brRow, COL.BORROWS.RETURN_DATE), values: [now] })
    }

    // Update book availability in the CORRECT sheet
    if (bookRow !== -1) {
      if (newStatus === BORROW_STATUS.APPROVED) {
        updates.push({ range: cellRange(booksSheetName, bookRow, COL.BOOKS.AVAILABLE), values: [available - 1] })
      } else if (newStatus === BORROW_STATUS.RETURNED) {
        updates.push({ range: cellRange(booksSheetName, bookRow, COL.BOOKS.AVAILABLE), values: [available + 1] })
      }
    }

    // Atomic batch write
    await batchUpdate(updates)
    cache.del('books')
    cache.del(`books_${borrowLocation}`)  // Clear location-specific cache

    // Create notification for the borrowing user
    const borrowerUserId = borrow[COL.BORROWS.USER_ID]
    const notifMap = {
      [BORROW_STATUS.APPROVED]: {
        type:    NOTIF_TYPE.BORROW_APPROVED,
        title:   'Borrow Request Approved',
        message: `Your borrow request has been approved. Due date: ${dueDate}.`
      },
      [BORROW_STATUS.REJECTED]: {
        type:    NOTIF_TYPE.BORROW_REJECTED,
        title:   'Borrow Request Rejected',
        message: `Your borrow request was rejected. ${notes ? 'Reason: ' + notes : ''}`
      },
      [BORROW_STATUS.RETURNED]: {
        type:    NOTIF_TYPE.BORROW_APPROVED,
        title:   'Book Return Confirmed',
        message: 'Your book return has been confirmed. Thank you!'
      }
    }

    const notif = notifMap[newStatus]
    await appendRow(SHEETS.NOTIFICATIONS, [
      uuid(), borrowerUserId, notif.type, notif.title, notif.message, id, 'FALSE', now
    ])

    // Push real-time event to user
    await trigger(ch.borrowStat(borrowerUserId), 'status-updated', {
      requestId: id, status: newStatus, message: notif.message
    })
  })

  res.json({ success: true, message: `Borrow request ${newStatus.toLowerCase()}` })
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN, ROLES.CLERK)
)(handlerBorrowStatus)