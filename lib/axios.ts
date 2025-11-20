import axios, { AxiosInstance } from 'axios'
import https from 'https'

// Backend base URL
const BACKEND_URL = 'https://34.42.175.232'

// Create axios instance for server-side requests (can ignore SSL)
export const serverAxios: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Ignore SSL certificate errors
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

