import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8089/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      Cookies.remove('role')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
