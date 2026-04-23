

import { compose }     from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { readSheet, updateRange, cellRange } from '../../../../lib/sheets'
import { SHEETS, COL } from '../../../../lib/constants'

async function handlerRead(req, res) {
  if (req.method !== 'PATCH')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query
  const rows   = await readSheet(SHEETS.NOTIFICATIONS)
  const idx    = rows.findIndex(r =>
    r[COL.NOTIFS.ID] === id && r[COL.NOTIFS.RECIPIENT_ID] === req.user.id
  )

  if (idx === -1) httpError(404, 'Notification not found')

  const sheetRow = idx + 2  // +2: header row + 0-based index
  await updateRange(cellRange(SHEETS.NOTIFICATIONS, sheetRow, COL.NOTIFS.IS_READ), ['TRUE'])

  res.json({ success: true, message: 'Notification marked as read' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerRead)