
export function withRole(...allowed) {
  return (handler) => async (req, res) => {
    if (!req.user)
      return res.status(401).json({ success: false, error: 'Unauthenticated' })

    if (!allowed.includes(req.user.role))
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowed.join(' or ')}`
      })

    return handler(req, res)
  }
}