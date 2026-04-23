


import { compose }     from '../../../../lib/compose'
import { withErrorHandler } from '../../../../middleware/errorHandler'
import { withAuth }    from '../../../../middleware/withAuth'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import { readSheet }   from '../../../../lib/sheets'
import { SHEETS, COL } from '../../../../lib/constants'
import { toMessage }   from './[threadId]/index'

async function handlerMe(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const rows = await readSheet(SHEETS.CHAT)
  const mine = rows
    .filter(r => r[COL.CHAT.THREAD_ID] === req.user.id)
    .map(toMessage)

  res.json({ success: true, data: mine, total: mine.length })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerMe)

