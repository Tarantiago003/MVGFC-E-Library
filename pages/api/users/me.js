
import { compose } from '../../../lib/compose'
import { withErrorHandler } from '../../../middleware/errorHandler'
import { withAuth } from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import * as cache from '../../../lib/cache'
import { readSheet } from '../../../lib/sheets'
import { SHEETS, COL } from '../../../lib/constants'
import { toUser } from './index'

async function handlerMe(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  let rows = cache.get('users')
  if (!rows) {
    rows = await readSheet(SHEETS.USERS)
    cache.set('users', rows, 5 * 60 * 1000)
  }

  const u = rows.find(r => r[COL.USERS.ID] === req.user.id)
  if (!u) return res.status(404).json({ success: false, error: 'User not found' })

  res.json({ success: true, data: toUser(u) })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerMe)