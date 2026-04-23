
export const ROLES = { ADMIN: 'admin', CLERK: 'clerk', USER: 'user' }

export function withDashboardAuth(allowedRoles = [ROLES.ADMIN, ROLES.CLERK]) {
  return async (ctx) => {
    const { getServerSession } = await import('next-auth/next')
    const { authOptions }      = await import('../../pages/api/auth/[...nextauth]')
    const session = await getServerSession(ctx.req, ctx.res, authOptions)

    if (!session?.user)
      return { redirect: { destination: '/auth/signin?callbackUrl=/dashboard/home', permanent: false } }

    if (!allowedRoles.includes(session.user.role))
      return { redirect: { destination: '/dashboard/403', permanent: false } }

    return { props: { session } }
  }
}