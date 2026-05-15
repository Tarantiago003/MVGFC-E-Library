import Joi from 'joi'
import { v4 as uuid }  from 'uuid'
import { compose }     from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { appendRow }   from '../../../lib/sheets'
import { SHEETS, COL, EVENT_TYPE } from '../../../lib/constants'

const schema = Joi.object({
  eventType:    Joi.string().valid(...Object.values(EVENT_TYPE)).required(),
  resourceName: Joi.string().max(200).required(),
  resourceUrl:  Joi.string().uri().max(500).required()
})

async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { error, value } = schema.validate(req.body)
  if (error) httpError(400, error.details[0].message)

  const id        = uuid()
  const timestamp = new Date().toISOString()

  await appendRow(SHEETS.ANALYTICS, [
    id,
    req.user.id,
    value.eventType,
    value.resourceName,
    value.resourceUrl,
    timestamp
  ])

  res.status(201).json({ success: true, data: { id } })
}

export default compose(withErrorHandler, rateLimiter(200), withAuth)(handler)