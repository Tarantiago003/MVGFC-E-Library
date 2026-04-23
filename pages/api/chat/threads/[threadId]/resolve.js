

import { compose }     from '../../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../../middleware/errorHandler'
import { withAuth }    from '../../../../../middleware/withAuth'
import { withRole }    from '../../../../../middleware/withRole'
import { rateLimiter } from '../../../../../middleware/rateLimiter'
import { readSheet, updateRange, cellRange } from '../../../../../lib/sheets'
import { SHEETS, COL, ROLES, THREAD_STATUS } from '../../../../../lib/constants'

async function handlerResolve(req, res) {
  if (req.method !== 'PATCH')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { threadId } = req.query
  const rows = await readSheet(SHEETS.CHAT)
  const threadRows = rows
    .map((r, i) => ({ r, sheetRow: i + 2 }))
    .filter(({ r }) => r[COL.CHAT.THREAD_ID] === threadId)

  if (!threadRows.length) httpError(404, 'Thread not found')

  // Update THREAD_STATUS on the last row of this thread
  const last = threadRows[threadRows.length - 1]
  await updateRange(
    cellRange(SHEETS.CHAT, last.sheetRow, COL.CHAT.THREAD_STATUS),
    [THREAD_STATUS.RESOLVED]
  )

  res.json({ success: true, message: 'Thread marked as resolved' })
}

export default compose(
  withErrorHandler, rateLimiter(), withAuth, withRole(ROLES.ADMIN, ROLES.CLERK)
)(handlerResolve)

