
import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

// Attach error message from API response
api.interceptors.response.use(
  r => r.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export default api

