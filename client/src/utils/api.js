import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.__B1GCRM_API_URL__) ||
  ''

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('b1gcrm-active-token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userType')
      localStorage.removeItem('user')
    }

    return Promise.reject(error)
  },
)

export { API_URL }
export default api
