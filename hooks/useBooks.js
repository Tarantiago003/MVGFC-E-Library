

import useSWR from 'swr'
import api from '../lib/api'

const fetcher = url => api.get(url).then(d => d.data)

export function useBooks({ location, search, category } = {}) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (search)   params.set('search',   search)
  if (category) params.set('category', category)
  const key = `/books?${params.toString()}`

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000
  })
  return { books: data || [], loading: isLoading, error }
}