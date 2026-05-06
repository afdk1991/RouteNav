import { create } from 'zustand'

export interface Route {
  id: number
  name: string
  mode: 'greedy' | 'balanced' | 'region'
  totalDistance: number
  addresses: number[]
  optimizedOrder: number[]
  createdAt: string
}

interface NavigationState {
  currentRoute: Route | null
  currentIndex: number
  isNavigating: boolean
  currentLocation: { latitude: number; longitude: number } | null
  setCurrentRoute: (route: Route | null) => void
  setCurrentIndex: (index: number) => void
  setIsNavigating: (navigating: boolean) => void
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void
  nextStop: () => void
  prevStop: () => void
  reset: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentRoute: null,
  currentIndex: 0,
  isNavigating: false,
  currentLocation: null,

  setCurrentRoute: (route) => set({ currentRoute: route, currentIndex: 0 }),
  
  setCurrentIndex: (index: number) => set({ currentIndex: index }),
  
  setIsNavigating: (navigating: boolean) => set({ isNavigating: navigating }),
  
  setCurrentLocation: (location) => set({ currentLocation: location }),

  nextStop: () => {
    const { currentRoute, currentIndex } = get()
    if (currentRoute && currentIndex < currentRoute.addresses.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prevStop: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  reset: () => set({
    currentRoute: null,
    currentIndex: 0,
    isNavigating: false,
    currentLocation: null
  })
}))
