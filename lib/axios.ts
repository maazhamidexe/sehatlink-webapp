import axios, { AxiosInstance } from 'axios'
import https from 'https'

// Backend base URL - use environment variable or default to localhost:8000
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

// Check if URL is HTTPS to determine if we need SSL agent
const isHttps = BACKEND_URL.startsWith('https://')

// Create axios instance for server-side requests
export const serverAxios: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  ...(isHttps && {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false // Ignore SSL certificate errors for HTTPS
    })
  }),
  timeout: 30000,
})

// Create axios instance for client-side requests (browser handles SSL)
export const clientAxios: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
})

// Add request interceptor for error handling
clientAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Better error handling for network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
      console.error('Network error - this may be due to SSL certificate issues')
      // You might want to show a user-friendly error message
    }
    return Promise.reject(error)
  }
)

export default { serverAxios, clientAxios }

