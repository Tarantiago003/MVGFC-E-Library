

import useSWR, { mutate } from 'swr'
import api from '../lib/api'

const KEY     = '/users'
const fetcher = url => api.get(url).then(d => d.data)

export function useDashboardUsers() {
  const { data, error, isLoading } = useSWR(KEY, fetcher, { revalidateOnFocus: true })

  async function updateRole(userId, role) {
    await api.patch(`/users/${userId}/role`, { role })
    mutate(KEY)
  }

  async function updateStatus(userId, status) {
    await api.patch(`/users/${userId}/status`, { status })
    mutate(KEY)
  }

  return {
    users: data || [], loading: isLoading, error,
    updateRole, updateStatus
  }
}