
import { compose }     from '../../../lib/compose'
import { withErrorHandler } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { readSheet }   from '../../../lib/sheets'
import { SHEETS, COL } from '../../../lib/constants'

function toNotif(r) {
  return {
    id:          r[COL.NOTIFS.ID],
    recipientId: r[COL.NOTIFS.RECIPIENT_ID],
    type:        r[COL.NOTIFS.TYPE],
    title:       r[COL.NOTIFS.TITLE],
    message:     r[COL.NOTIFS.MESSAGE],
    relatedId:   r[COL.NOTIFS.RELATED_ID],
    isRead:      r[COL.NOTIFS.IS_READ] === 'TRUE',
    createdAt:   r[COL.NOTIFS.CREATED]
  }
}

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const rows = await readSheet(SHEETS.NOTIFICATIONS)
  let notifs = rows
    .filter(r => r[COL.NOTIFS.RECIPIENT_ID] === req.user.id)
    .map(toNotif)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (req.query.unreadOnly === 'true')
    notifs = notifs.filter(n => !n.isRead)

  res.json({
    success:     true,
    data:        notifs,
    total:       notifs.length,
    unreadCount: notifs.filter(n => !n.isRead).length
  })
}

export default compose(withErrorHandler, rateLimiter(), withAuth)(handler)

