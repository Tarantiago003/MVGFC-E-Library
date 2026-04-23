
const windows = new Map()

export function rateLimiter(limit = 100, windowMs = 60_000) {
  return (handler) => async (req, res) => {
    // Identify by user ID (post-auth) or IP (pre-auth)
    const key = req.user?.id
      || req.headers['x-forwarded-for']?.split(',')[0]
      || 'anon'

    const now = Date.now()
    let w = windows.get(key)

    if (!w || now > w.resetAt) {
      w = { count: 0, resetAt: now + windowMs }
    }

    w.count++
    windows.set(key, w)

    res.setHeader('X-RateLimit-Limit', limit)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - w.count))

    if (w.count > limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before retrying.'
      })
    }

    return handler(req, res)
  }
}
