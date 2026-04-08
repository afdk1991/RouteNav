// Type definitions for Route Planner App

export interface AddressItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  isStart: boolean;
  isEnd: boolean;
  orderIndex: number;
  createdAt?: string;
}

export interface RouteItem {
  id: number;
  name: string;
  optimizationMode: 'shortest' | 'balanced' | 'regional';
  totalDistance: number;
  addressIds: number[];
  orderedAddresses: AddressItem[];
  createdAt: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OptimizationRequest {
  addressIds: number[];
  mode?: 'shortest' | 'balanced' | 'regional';
}

export interface NavigationState {
  currentIndex: number;
  isNavigating: boolean;
  startTime?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface ExternalMapProvider {
  id: 'amap' | 'baidu' | 'google' | 'apple';
  name: string;
  icon: string;
}
