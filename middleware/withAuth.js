
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import { USER_STATUS } from '../lib/constants'

export function withAuth(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user)
      return res.status(401).json({ success: false, error: 'Authentication required' })

    if (session.user.status !== USER_STATUS.ACTIVE)
      return res.status(403).json({ success: false, error: 'Account is inactive or suspended' })

    req.user = session.user   // { id, name, email, role, status }
    return handler(req, res)
  }
}