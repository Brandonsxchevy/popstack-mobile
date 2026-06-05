import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const API_URL = 'https://popstack-api-staging.onrender.com/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token')
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refresh}` }
        })
        const { accessToken } = res.data
        await SecureStore.setItemAsync('access_token', accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync('access_token')
        await SecureStore.deleteItemAsync('refresh_token')
      }
    }
    return Promise.reject(error)
  }
)
