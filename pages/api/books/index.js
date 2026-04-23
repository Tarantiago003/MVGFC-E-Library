

import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import { compose } from '../../../lib/compose'
import { withErrorHandler } from '../../../middleware/errorHandler'
import { withAuth } from '../../../middleware/withAuth'
import { withRole } from '../../../middleware/withRole'
import { rateLimiter } from '../../../middleware/rateLimiter'
import * as cache from '../../../lib/cache'
import { SHEETS, COL, ROLES, LIBRARY } from '../../../lib/constants'
import { readSheet, appendRow, batchRead } from '../../../lib/sheets'

const BOOKS_TTL = parseInt(process.env.CACHE_TTL_BOOKS_MS) || 10 * 60 * 1000

export async function getBooks(libraryLocation = null) {
  if (!libraryLocation) {
    // Fetch from both sheets and combine
    const [mainRows, hsRows] = await batchRead([
      SHEETS.BOOKS_MAIN,
      SHEETS.BOOKS_HS
    ])
    const cached = [...mainRows, ...hsRows]
    cache.set('books', cached, BOOKS_TTL)
    return cached
  }
  
  // Fetch from specific library
  const sheetName = libraryLocation === LIBRARY.HIGH_SCHOOL 
    ? SHEETS.BOOKS_HS 
    : SHEETS.BOOKS_MAIN
  const cached = cache.get(`books_${libraryLocation}`)
  if (cached) return cached
  const rows = await readSheet(sheetName)
  cache.set(`books_${libraryLocation}`, rows, BOOKS_TTL)
  return rows
}

export function toBook(r) {
  return {
    id:            r[COL.BOOKS.ID],
    title:         r[COL.BOOKS.TITLE],
    author:        r[COL.BOOKS.AUTHOR],
    isbn:          r[COL.BOOKS.ISBN],
    category:      r[COL.BOOKS.CATEGORY],
    location:      r[COL.BOOKS.LOCATION],
    totalCopies:   parseInt(r[COL.BOOKS.TOTAL])     || 0,
    available:     parseInt(r[COL.BOOKS.AVAILABLE]) || 0,
    description:   r[COL.BOOKS.DESC],
    coverImageUrl: r[COL.BOOKS.COVER],
    addedAt:       r[COL.BOOKS.ADDED_AT],
    addedBy:       r[COL.BOOKS.ADDED_BY]
  }
}

const createSchema = Joi.object({
  title:       Joi.string().max(255).required(),
  author:      Joi.string().max(255).required(),
  isbn:        Joi.string().max(20).optional().allow(''),
  category:    Joi.string().max(100).required(),
  location:    Joi.string().valid(...Object.values(LIBRARY)).required(),
  totalCopies: Joi.number().integer().min(1).required(),
  description: Joi.string().max(1000).optional().allow(''),
  coverImageUrl: Joi.string().uri().optional().allow('')
})

async function handler(req, res) {
  if (req.method === 'GET') {
    let rows = await getBooks()
    
    // LIBRARY-BASED FILTERING FOR CLERKS
    if (req.user.role === ROLES.CLERK) {
      const assignedLibrary = req.user.assignedLibrary
      if (!assignedLibrary) {
        return res.status(403).json({ 
          success: false, 
          error: 'No library assigned to your account. Please contact admin.' 
        })
      }
      rows = rows.filter(r => r[COL.BOOKS.LOCATION] === assignedLibrary)
    }
    // Admins and users see all books (no filter)

    // Additional filters from query params
    const { location, category, search } = req.query
    if (location) rows = rows.filter(r => r[COL.BOOKS.LOCATION] === location.toUpperCase())
    if (category) rows = rows.filter(r => r[COL.BOOKS.CATEGORY]?.toLowerCase() === category.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r[COL.BOOKS.TITLE]?.toLowerCase().includes(q) ||
        r[COL.BOOKS.AUTHOR]?.toLowerCase().includes(q) ||
        r[COL.BOOKS.ISBN]?.includes(q)
      )
    }
    return res.json({ success: true, data: rows.map(toBook), total: rows.length })
  }

  if (req.method === 'POST') {
    if (![ROLES.ADMIN, ROLES.CLERK].includes(req.user.role))
      return res.status(403).json({ success: false, error: 'Forbidden' })

    const { error, value } = createSchema.validate(req.body)
    if (error) return res.status(400).json({ success: false, error: error.details[0].message })

    // CLERKS CAN ONLY ADD BOOKS TO THEIR LIBRARY
    if (req.user.role === ROLES.CLERK) {
      const assignedLibrary = req.user.assignedLibrary
      if (!assignedLibrary) {
        return res.status(403).json({ 
          success: false, 
          error: 'No library assigned to your account. Please contact admin.' 
        })
      }
      if (value.location !== assignedLibrary) {
        return res.status(403).json({ 
          success: false, 
          error: `You can only add books to ${assignedLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library'}` 
        })
      }
    }

    const sheetName = value.location === LIBRARY.HIGH_SCHOOL 
      ? SHEETS.BOOKS_HS 
      : SHEETS.BOOKS_MAIN

    const id  = uuid()
    const now = new Date().toISOString()
    await appendRow(sheetName, [
      id, value.title, value.author, value.isbn || '',
      value.category, value.location, value.totalCopies, value.totalCopies,
      value.description || '', value.coverImageUrl || '', now, req.user.id
    ])
    
    cache.del('books')
    cache.del(`books_${value.location}`)
    return res.status(201).json({ success: true, data: { id } })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ success: false, error: 'Method not allowed' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handler)

