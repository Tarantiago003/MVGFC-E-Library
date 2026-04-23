
import { compose } from '../../../lib/compose'
import { withErrorHandler } from '../../../middleware/errorHandler'
import { withAuth } from '../../../middleware/withAuth'
import { withRole } from '../../../middleware/withRole'
import { rateLimiter } from '../../../middleware/rateLimiter'
import * as cache from '../../../lib/cache'
import { readSheet } from '../../../lib/sheets'
import { SHEETS, COL, ROLES } from '../../../lib/constants'

const USERS_TTL = parseInt(process.env.CACHE_TTL_USERS_MS) || 5 * 60 * 1000

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  let rows = cache.get('users')
  if (!rows) {
    rows = await readSheet(SHEETS.USERS)
    cache.set('users', rows, USERS_TTL)
  }

  const { role, status } = req.query
  if (role)   rows = rows.filter(r => r[COL.USERS.ROLE]   === role)
  if (status) rows = rows.filter(r => r[COL.USERS.STATUS] === status)

  res.json({ success: true, data: rows.map(toUser), total: rows.length })
}

export function toUser(r) {
  return {
    id:         r[COL.USERS.ID],
    name:       r[COL.USERS.NAME],
    email:      r[COL.USERS.EMAIL],
    role:       r[COL.USERS.ROLE],
    dept:       r[COL.USERS.DEPT],
    status:     r[COL.USERS.STATUS],
    createdAt:  r[COL.USERS.CREATED],
    lastLogin:  r[COL.USERS.LAST_LOGIN]
  }
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN, ROLES.CLERK)
)(handler)