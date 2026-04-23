
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error(`[API ERROR] ${req.method} ${req.url}`, err)

      // Propagate structured errors thrown intentionally
      if (err.statusCode && err.message) {
        return res.status(err.statusCode).json({ success: false, error: err.message })
      }

      res.status(500).json({ success: false, error: 'An unexpected server error occurred' })
    }
  }
}

// Helper to throw structured HTTP errors from anywhere in handlers
export function httpError(statusCode, message) {
  const e = new Error(message)
  e.statusCode = statusCode
  throw e
}