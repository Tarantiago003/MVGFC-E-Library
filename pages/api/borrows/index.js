import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import { compose }         from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth }        from '../../../middleware/withAuth'
import { rateLimiter }     from '../../../middleware/rateLimiter'
import { enqueue }         from '../../../lib/queue'
import { trigger, ch }     from '../../../lib/pusher'
import { readSheet, batchRead, appendRow } from '../../../lib/sheets'
import { SHEETS, COL, ROLES, BORROW_STATUS, LIBRARY } from '../../../lib/constants'

// Helper to get correct books sheet based on library location
function getBooksSheetName(libraryLocation) {
  return libraryLocation === LIBRARY.HIGH_SCHOOL 
    ? SHEETS.BOOKS_HS 
    : SHEETS.BOOKS_MAIN
}

export function toBorrow(r) {
  return {
    id:             r[COL.BORROWS.ID],
    userId:         r[COL.BORROWS.USER_ID],
    bookId:         r[COL.BORROWS.BOOK_ID],
    location:       r[COL.BORROWS.LOCATION],
    status:         r[COL.BORROWS.STATUS],
    requestDate:    r[COL.BORROWS.REQ_DATE],
    approvalDate:   r[COL.BORROWS.APPROVAL_DATE],
    dueDate:        r[COL.BORROWS.DUE_DATE],
    returnDate:     r[COL.BORROWS.RETURN_DATE],
    processedBy:    r[COL.BORROWS.PROCESSED_BY],
    notes:          r[COL.BORROWS.NOTES]
  }
}

const createSchema = Joi.object({
  bookId:          Joi.string().required(),
  libraryLocation: Joi.string().valid(...Object.values(LIBRARY)).required()
})

async function handler(req, res) {
  // GET: List borrow requests
  if (req.method === 'GET') {
    let rows = await readSheet(SHEETS.BORROWS)

    // ROLE-BASED FILTERING
    if (req.user.role === ROLES.USER) {
      rows = rows.filter(r => r[COL.BORROWS.USER_ID] === req.user.id)
    } else if (req.user.role === ROLES.CLERK) {
      const assignedLibrary = req.user.assignedLibrary
      if (!assignedLibrary) {
        return res.status(403).json({ 
          success: false, 
          error: 'No library assigned to your account. Please contact admin.' 
        })
      }
      rows = rows.filter(r => r[COL.BORROWS.LOCATION] === assignedLibrary)
    }

    // Additional filters from query params
    if (req.query.userId) {
      rows = rows.filter(r => r[COL.BORROWS.USER_ID] === req.query.userId)
    }

    const { status, location } = req.query
    if (status)   rows = rows.filter(r => r[COL.BORROWS.STATUS]   === status.toUpperCase())
    if (location) rows = rows.filter(r => r[COL.BORROWS.LOCATION] === location.toUpperCase())

    return res.json({ success: true, data: rows.map(toBorrow), total: rows.length })
  }

  // POST: Submit a borrow request
  if (req.method === 'POST') {
    if (req.user.role !== ROLES.USER)
      httpError(403, 'Only end users can submit borrow requests')

    const { error, value } = createSchema.validate(req.body)
    if (error) httpError(400, error.details[0].message)

    const { bookId, libraryLocation } = value
    const result = { id: null }

    await enqueue(async () => {
      // CRITICAL FIX: Fetch books from the CORRECT library sheet
      const booksSheetName = getBooksSheetName(libraryLocation)
      const [borrows, books] = await batchRead([
        SHEETS.BORROWS, 
        booksSheetName  // Use library-specific sheet
      ])

      // Duplicate request guard
      const dup = borrows.find(r =>
        r[COL.BORROWS.USER_ID] === req.user.id &&
        r[COL.BORROWS.BOOK_ID] === bookId &&
        r[COL.BORROWS.STATUS]  === BORROW_STATUS.PENDING
      )
      if (dup) httpError(409, 'You already have a pending request for this book')

      // Book availability check - now checking the correct sheet
      const book = books.find(b => b[COL.BOOKS.ID] === bookId)
      
      if (!book) httpError(404, 'Book not found at this library location')
      
      const available = parseInt(book[COL.BOOKS.AVAILABLE]) || 0
      if (available < 1)
        httpError(400, 'No copies currently available')

      // Append borrow request row
      const id  = uuid()
      const now = new Date().toISOString()
      await appendRow(SHEETS.BORROWS, [
        id, req.user.id, bookId, libraryLocation,
        BORROW_STATUS.PENDING, now, '', '', '', '', ''
      ])
      result.id = id

      // Notify admin/clerk via Pusher
      await trigger(ch.adminInbox(libraryLocation), 'new-borrow-request', {
        requestId: id, userId: req.user.id,
        bookTitle: book[COL.BOOKS.TITLE], location: libraryLocation
      })
    })

    return res.status(201).json({ success: true, data: { requestId: result.id } })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ success: false, error: 'Method not allowed' })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handler)