
import { useSession } from 'next-auth/react'

export default function RoleGuard({ allow = [], fallback = null, children }) {
  const { data: session } = useSession()
  if (!session?.user) return null
  return allow.includes(session.user.role) ? children : fallback
}