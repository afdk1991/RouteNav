import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: number
  username: string
  email: string
  name?: string
  avatar?: string
}

interface UserState {
  userInfo: User | null
  token: string | null
  isLoading: boolean
  setUserInfo: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initAuth: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  token: null,
  isLoading: true,

  setUserInfo: (user) => set({ userInfo: user }),

  setToken: (token) => {
    set({ token })
    if (token) {
      AsyncStorage.setItem('auth_token', token)
    } else {
      AsyncStorage.removeItem('auth_token')
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    set({ userInfo: null, token: null })
    AsyncStorage.removeItem('auth_token')
    AsyncStorage.removeItem('user_info')
  },

  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      const userStr = await AsyncStorage.getItem('user_info')
      if (token && userStr) {
        set({ 
          token, 
          userInfo: JSON.parse(userStr),
          isLoading: false 
        })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  }
}))
