

import { useSession } from 'next-auth/react'
import { useRouter }  from 'next/router'
import { useEffect }  from 'react'
import Spinner        from '../components/ui/Spinner'

export default function Index() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) router.replace('/dashboard')
    else         router.replace('/auth/signin')
  }, [session, status])

  return <div className="min-h-screen bg-green-50 flex items-center justify-center"><Spinner/></div>
}