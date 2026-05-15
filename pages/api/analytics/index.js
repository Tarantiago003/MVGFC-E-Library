import { compose }     from '../../../lib/compose'
import { withErrorHandler } from '../../../middleware/errorHandler'
import { withAuth }    from '../../../middleware/withAuth'
import { withRole }    from '../../../middleware/withRole'
import { rateLimiter } from '../../../middleware/rateLimiter'
import { batchRead }   from '../../../lib/sheets'
import { SHEETS, COL, ROLES } from '../../../lib/constants'

function toEvent(r) {
  return {
    id:           r[COL.ANALYTICS.ID],
    userId:       r[COL.ANALYTICS.USER_ID],
    eventType:    r[COL.ANALYTICS.EVENT_TYPE],
    resourceName: r[COL.ANALYTICS.RESOURCE_NAME],
    resourceUrl:  r[COL.ANALYTICS.RESOURCE_URL],
    timestamp:    r[COL.ANALYTICS.TIMESTAMP]
  }
}

async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })

  const [events, users] = await batchRead([SHEETS.ANALYTICS, SHEETS.USERS])

  // Build user lookup for names
  const userMap = {}
  for (const u of users) {
    userMap[u[COL.USERS.ID]] = {
      name:      u[COL.USERS.NAME],
      email:     u[COL.USERS.EMAIL],
      institute: u[COL.USERS.INSTITUTE] || '—',
      userType:  u[COL.USERS.USER_TYPE]
    }
  }

  const mapped = events.map(r => ({
    ...toEvent(r),
    userName:      userMap[r[COL.ANALYTICS.USER_ID]]?.name      || '—',
    userEmail:     userMap[r[COL.ANALYTICS.USER_ID]]?.email     || '—',
    userInstitute: userMap[r[COL.ANALYTICS.USER_ID]]?.institute || '—',
    userType:      userMap[r[COL.ANALYTICS.USER_ID]]?.userType  || '—'
  }))

  // Sort newest first
  mapped.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  // Aggregate stats per resource
  const resourceStats = {}
  const uniquePerResource = {}
  for (const e of mapped) {
    const key = e.resourceName
    if (!resourceStats[key]) {
      resourceStats[key] = { name: key, url: e.resourceUrl, clicks: 0, uniqueUsers: new Set() }
    }
    resourceStats[key].clicks++
    resourceStats[key].uniqueUsers.add(e.userId)
    if (!uniquePerResource[key]) uniquePerResource[key] = new Set()
    uniquePerResource[key].add(e.userId)
  }

  const resources = Object.values(resourceStats).map(r => ({
    name:         r.name,
    url:          r.url,
    clicks:       r.clicks,
    uniqueVisitors: r.uniqueUsers.size
  }))

  // Daily breakdown (last 30 days)
  const dailyMap = {}
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const e of mapped) {
    if (new Date(e.timestamp).getTime() < cutoff) continue
    const day = e.timestamp.split('T')[0]
    dailyMap[day] = (dailyMap[day] || 0) + 1
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Institute breakdown
  const instituteMap = {}
  for (const e of mapped) {
    const inst = e.userInstitute || '—'
    instituteMap[inst] = (instituteMap[inst] || 0) + 1
  }
  const byInstitute = Object.entries(instituteMap)
    .sort(([, a], [, b]) => b - a)
    .map(([institute, clicks]) => ({ institute, clicks }))

  const uniqueTotal = new Set(mapped.map(e => e.userId)).size

  res.json({
    success: true,
    data: {
      totalClicks:    mapped.length,
      uniqueVisitors: uniqueTotal,
      resources,
      byInstitute,
      daily,
      recent: mapped.slice(0, 50)   // last 50 events with user info
    }
  })
}

export default compose(
  withErrorHandler, rateLimiter(), withAuth, withRole(ROLES.ADMIN, ROLES.CLERK)
)(handler)