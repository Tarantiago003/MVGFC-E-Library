/**
 * Tracked redirect endpoint.
 *
 * Usage (any link in the app or on mvgallegolibrary.com):
 *   /api/analytics/redirect?name=EBSCO&url=https://www.ebsco.com/...
 *
 * Logs the click (name, url, user, schoolId, institute) then redirects.
 */
import { v4 as uuid }  from 'uuid'
import { compose }     from '../../../lib/compose'
import { withErrorHandler, httpError } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { appendRow, readSheet } from '../../../lib/sheets'
import { SHEETS, COL } from '../../../lib/constants'

const ALLOWED_HOSTS = [
  'mvgallegolibrary.com',
  'www.mvgallegolibrary.com',
  'search.ebscohost.com',
  'proquest.com',
  'www.proquest.com',
  'doaj.org',
  'www.doaj.org',
  'pubmed.ncbi.nlm.nih.gov',
  'scholar.google.com',
  'jstor.org',
  'www.jstor.org',
  'sciencedirect.com',
  'www.sciencedirect.com',
  'researchgate.net',
  'www.researchgate.net',
  'eric.ed.gov',
  'semanticscholar.org',
]

function isSafeUrl(raw) {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    return ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))
  } catch { return false }
}

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const { name, url } = req.query
  if (!name || !url)   httpError(400, 'Missing name or url query parameters')
  if (!isSafeUrl(url)) httpError(400, 'Target URL is not on the allowed list')

  // Fetch user row for institute + school ID
  const users   = await readSheet(SHEETS.USERS)
  const userRow = users.find(r => r[COL.USERS.ID] === req.user.id)

  const institute = userRow?.[COL.USERS.INSTITUTE] || '—'
  const userType  = userRow?.[COL.USERS.USER_TYPE]
  const schoolId  = userType === 'student'
    ? (userRow?.[COL.USERS.STUDENT_ID]   || '—')
    : (userRow?.[COL.USERS.EMPLOYEE_NUM] || '—')

  const id        = uuid()
  const timestamp = new Date().toISOString()

  await appendRow(SHEETS.ANALYTICS, [
    id,
    req.user.id,
    req.user.name,
    schoolId,                       // SchoolID ← new column
    institute,
    decodeURIComponent(name),
    decodeURIComponent(url),
    timestamp
  ])

  res.redirect(302, decodeURIComponent(url))
}

export default compose(withErrorHandler, rateLimiter(300), withAuth)(handler)