import Joi from 'joi'
import { v4 as uuid }  from 'uuid'
import { compose }     from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { appendRow, readSheet } from '../../../lib/sheets'
import { SHEETS, COL } from '../../../lib/constants'

const schema = Joi.object({
  resourceName: Joi.string().max(200).required(),
  resourceUrl:  Joi.string().uri().max(500).required()
})

async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  // Fetch user row to get institute + school ID
  const users   = await readSheet(SHEETS.USERS)
  const userRow = users.find(r => r[COL.USERS.ID] === req.user.id)

  const institute = userRow?.[COL.USERS.INSTITUTE] || '—'
  const userType  = userRow?.[COL.USERS.USER_TYPE]
  // Student → Student ID,  Employee → Employee Number
  const schoolId  = userType === 'student'
    ? (userRow?.[COL.USERS.STUDENT_ID]  || '—')
    : (userRow?.[COL.USERS.EMPLOYEE_NUM] || '—')

  const id        = uuid()
  const timestamp = new Date().toISOString()

  await appendRow(SHEETS.ANALYTICS, [
    id,
    req.user.id,
    req.user.name,   // UserName
    schoolId,        // SchoolID  ← new column
    institute,       // Institute
    value.resourceName,
    value.resourceUrl,
    timestamp
  ])

  res.status(201).json({ success: true, data: { id } })
}

export default compose(withErrorHandler, rateLimiter(200), withAuth)(handler)