
import Joi from 'joi'
import { compose } from '../../../../lib/compose'
import { withErrorHandler, httpError } from '../../../../middleware/errorHandler'
import { withAuth } from '../../../../middleware/withAuth'
import { withRole } from '../../../../middleware/withRole'
import { withValidation } from '../../../../middleware/withValidation'
import { rateLimiter } from '../../../../middleware/rateLimiter'
import * as cache from '../../../../lib/cache'
import { readSheet, updateRange, rowNum, cellRange } from '../../../../lib/sheets'
import { SHEETS, COL, ROLES, USER_STATUS } from '../../../../lib/constants'

const schema = Joi.object({
  status: Joi.string().valid(...Object.values(USER_STATUS)).required()
})

async function handlerStatus(req, res) {
  if (req.method !== 'PATCH')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { id } = req.query
  const { status } = req.body

  const rows = await readSheet(SHEETS.USERS)
  const rn = rowNum(rows, COL.USERS.ID, id)
  if (rn === -1) httpError(404, 'User not found')

  await updateRange(cellRange(SHEETS.USERS, rn, COL.USERS.STATUS), [status])
  cache.del('users')

  res.json({ success: true, message: `User status updated to '${status}'` })
}

export default compose(
  withErrorHandler,
  rateLimiter(),
  withAuth,
  withRole(ROLES.ADMIN),
  withValidation(schema)
)(handlerStatus)
