import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'DEVELOPER' | 'ADMIN'
  badges: string[]
  avgRating: number | null
  preferredLanguage: string
  autoTranslate: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (token: string, refreshToken: string, user: User) => Promise<void>
  clearAuth: () => Promise<void>
  isAuthenticated: () => boolean
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setAuth: async (token, refreshToken, user) => {
    await SecureStore.setItemAsync('access_token', token)
    await SecureStore.setItemAsync('refresh_token', refreshToken)
    set({ token, user })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    set({ token: null, user: null })
  },

  isAuthenticated: () => !!get().token && !!get().user,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token')
      if (token) set({ token })
    } catch {
      set({ token: null, user: null })
    }
  },
}))