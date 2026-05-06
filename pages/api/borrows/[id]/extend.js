import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { withRole }    from '../../../../middleware/withRole'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { trigger, ch } from '../../../../lib/pusher'
import { readSheet, appendRow, batchUpdate, rowNum, cellRange } from '../../../../lib/sheets'
import {
  SHEETS, COL, ROLES, NOTIF_TYPE, BORROW_STATUS
} from '../../../../lib/constants'

const schema = Joi.object({
  dueDate: Joi.string().isoDate().required()
})

async function handlerExtend(req, res) {
  if (req.method !== 'PATCH')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query
  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  const { dueDate } = value
  const rows   = await readSheet(SHEETS.BORROWS)
  const borrow = rows.find(r => r[COL.BORROWS.ID] === id)

  if (!borrow) httpError(404, 'Borrow request not found')
  if (borrow[COL.BORROWS.STATUS] !== BORROW_STATUS.APPROVED)
    httpError(400, 'Can only extend due date for approved borrows')

  // Clerks can only manage their assigned library
  if (req.user.role === ROLES.CLERK) {
    if (borrow[COL.BORROWS.LOCATION] !== req.user.assignedLibrary)
      httpError(403, 'This borrow belongs to a different library')
  }

  const rn  = rowNum(rows, COL.BORROWS.ID, id)
  if (rn === -1) httpError(404, 'Borrow row not found')

  const now  = new Date().toISOString()
  const note = `Due date extended to ${dueDate} by ${req.user.name} on ${now}`

  await batchUpdate([
    { range: cellRange(SHEETS.BORROWS, rn, COL.BORROWS.DUE_DATE), values: [dueDate] },
    { range: cellRange(SHEETS.BORROWS, rn, COL.BORROWS.NOTES),    values: [note]    }
  ])

  // Notify the borrower
  const borrowerId = borrow[COL.BORROWS.USER_ID]
  const formattedDue = new Date(dueDate).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  await appendRow(SHEETS.NOTIFICATIONS, [
    uuid(), borrowerId,
    NOTIF_TYPE.BORROW_APPROVED,
    '📅 Due Date Extended',
    `Great news! Your borrowing due date has been extended to ${formattedDue}.`,
    id, 'FALSE', now
  ])

  await trigger(ch.borrowStat(borrowerId), 'status-updated', {
    requestId: id,
    status:    BORROW_STATUS.APPROVED,
    message:   `Your due date has been extended to ${formattedDue}`
  })

  res.json({ success: true, message: `Due date extended to ${formattedDue}.` })
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN, ROLES.CLERK)
)(handlerExtend)