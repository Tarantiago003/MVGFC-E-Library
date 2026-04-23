
import Joi from 'joi'
import { compose } from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth } from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import * as cache from '../../../lib/cache'
import { readSheet, batchUpdate, rowNum, cellRange } from '../../../lib/sheets'
import { SHEETS, COL, ROLES, LIBRARY } from '../../../lib/constants'
import { getBooks, toBook } from './index'

const updateSchema = Joi.object({
  title:         Joi.string().max(255),
  author:        Joi.string().max(255),
  category:      Joi.string().max(100),
  description:   Joi.string().max(1000).allow(''),
  coverImageUrl: Joi.string().uri().allow(''),
  totalCopies:   Joi.number().integer().min(1),
  available:     Joi.number().integer().min(0)
}).min(1)

async function handlerBook(req, res) {
  const { id } = req.query
  const rows   = await getBooks()
  const book   = rows.find(r => r[COL.BOOKS.ID] === id)
  if (!book) httpError(404, 'Book not found')

  if (req.method === 'GET')
    return res.json({ success: true, data: toBook(book) })

  if (req.method === 'PATCH') {
    if (![ROLES.ADMIN, ROLES.CLERK].includes(req.user.role))
      httpError(403, 'Forbidden')

    const { error, value } = updateSchema.validate(req.body)
    if (error) httpError(400, error.details[0].message)

    const freshRows = await readSheet(SHEETS.BOOKS)
    const rn = rowNum(freshRows, COL.BOOKS.ID, id)
    if (rn === -1) httpError(404, 'Book not found')

    const updates = []
    const map = {
      title: COL.BOOKS.TITLE, author: COL.BOOKS.AUTHOR, category: COL.BOOKS.CATEGORY,
      description: COL.BOOKS.DESC, coverImageUrl: COL.BOOKS.COVER,
      totalCopies: COL.BOOKS.TOTAL, available: COL.BOOKS.AVAILABLE
    }
    for (const [key, colIdx] of Object.entries(map)) {
      if (value[key] !== undefined)
        updates.push({ range: cellRange(SHEETS.BOOKS, rn, colIdx), values: [value[key]] })
    }

    if (updates.length) await batchUpdate(updates)
    cache.del('books')
    return res.json({ success: true, message: 'Book updated' })
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  res.status(405).json({ success: false, error: 'Method not allowed' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handlerBook)