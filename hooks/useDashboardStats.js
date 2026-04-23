import useSWR from 'swr'
import api    from '../lib/api'
import { useSession } from 'next-auth/react'

const fetcher = url => api.get(url).then(d => d.data)

export function useDashboardStats() {
  const { data: session } = useSession()
  
  const { data: borrows = [] } = useSWR('/borrows',      fetcher, { refreshInterval: 30_000 })
  const { data: users   = [] } = useSWR('/users',        fetcher, { refreshInterval: 60_000 })
  const { data: threads = [] } = useSWR('/chat/threads', fetcher, { refreshInterval: 20_000 })

  // Filter based on role and assigned library
  const isAdmin = session?.user?.role === 'admin'
  const isClerk = session?.user?.role === 'clerk'
  const assignedLibrary = session?.user?.assignedLibrary

  let filteredBorrows = borrows
  let filteredThreads = threads

  if (isClerk && assignedLibrary) {
    // Clerks only see their library's data
    filteredBorrows = borrows.filter(b => b.location === assignedLibrary)
    filteredThreads = threads.filter(t => t.library === assignedLibrary)
  }

  return {
    totalBorrows:   filteredBorrows.length,
    pending:        filteredBorrows.filter(b => b.status === 'PENDING').length,
    approved:       filteredBorrows.filter(b => b.status === 'APPROVED').length,
    returned:       filteredBorrows.filter(b => b.status === 'RETURNED').length,
    totalUsers:     isAdmin ? users.length : 0,  // Only admins see user stats
    activeUsers:    isAdmin ? users.filter(u => u.status === 'active').length : 0,
    openChats:      filteredThreads.filter(t => t.threadStatus === 'OPEN').length,
    unresolvedComplaints: filteredThreads.filter(t => t.messageType === 'COMPLAINT' && t.threadStatus === 'OPEN').length,
    libraryName:    isClerk ? (assignedLibrary === 'HIGH_SCHOOL' ? 'High School Library' : 'Main Library') : 'All Libraries'
  }
}