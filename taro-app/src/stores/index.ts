import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 用户信息类型
export interface UserInfo {
  id: number
  username: string
  email: string
  name?: string
}

// 用户 Store
interface UserState {
  userInfo: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  setUserInfo: (user: UserInfo | null) => void
  setToken: (token: string | null) => void
  login: (user: UserInfo, token: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      isAuthenticated: false,

      setUserInfo: (user) => set({ userInfo: user, isAuthenticated: !!user }),

      setToken: (token) => set({ token, isAuthenticated: !!token }),

      login: (user, token) => {
        set({ userInfo: user, token, isAuthenticated: true })
        // 同步到 Network
        Network.setToken(token)
      },

      logout: () => {
        set({ userInfo: null, token: null, isAuthenticated: false })
        Network.clearToken()
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => Taro.getStorageSync),
    }
  )
)

// 引入 Network
import { Network } from '../utils/network'

// 地址 Store
export interface Address {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  city?: string
  category?: string
}

interface AddressState {
  addresses: Address[]
  selectedAddresses: number[]
  setAddresses: (addresses: Address[]) => void
  addAddress: (address: Address) => void
  removeAddress: (id: number) => void
  updateAddress: (id: number, address: Partial<Address>) => void
  toggleSelected: (id: number) => void
  selectAll: () => void
  clearSelection: () => void
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddresses: [],

      setAddresses: (addresses) => set({ addresses }),

      addAddress: (address) =>
        set((state) => ({ addresses: [...state.addresses, address] })),

      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
          selectedAddresses: state.selectedAddresses.filter((i) => i !== id),
        })),

      updateAddress: (id, updated) =>
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, ...updated } : a
          ),
        })),

      toggleSelected: (id) =>
        set((state) => {
          const isSelected = state.selectedAddresses.includes(id)
          return {
            selectedAddresses: isSelected
              ? state.selectedAddresses.filter((i) => i !== id)
              : [...state.selectedAddresses, id],
          }
        }),

      selectAll: () =>
        set((state) => ({
          selectedAddresses: state.addresses.map((a) => a.id),
        })),

      clearSelection: () => set({ selectedAddresses: [] }),
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => Taro.getStorageSync),
    }
  )
)

// 路线 Store
export interface RoutePoint {
  addressId: number
  name: string
  address: string
  latitude: number
  longitude: number
  order: number
}

export interface OptimizedRoute {
  id: number
  name: string
  points: RoutePoint[]
  totalDistance: number
  mode: 'greedy' | 'balanced' | 'region'
  createdAt: string
}

interface RouteState {
  routes: OptimizedRoute[]
  currentRoute: OptimizedRoute | null
  currentIndex: number
  setRoutes: (routes: OptimizedRoute[]) => void
  setCurrentRoute: (route: OptimizedRoute | null) => void
  setCurrentIndex: (index: number) => void
  nextPoint: () => void
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      routes: [],
      currentRoute: null,
      currentIndex: 0,

      setRoutes: (routes) => set({ routes }),

      setCurrentRoute: (route) => set({ currentRoute: route, currentIndex: 0 }),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      nextPoint: () =>
        set((state) => {
          if (!state.currentRoute) return state
          const maxIndex = state.currentRoute.points.length - 1
          const nextIndex = Math.min(state.currentIndex + 1, maxIndex)
          return { currentIndex: nextIndex }
        }),
    }),
    {
      name: 'route-storage',
      storage: createJSONStorage(() => Taro.getStorageSync),
    }
  )
)
