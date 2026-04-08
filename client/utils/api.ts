import type { AddressItem, RouteItem, GeocodeResult, ApiResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

// ============ Address APIs ============

export async function getAddresses(): Promise<ApiResponse<AddressItem[]>> {
  return request<AddressItem[]>('/api/v1/addresses');
}

export async function getAddress(id: number): Promise<ApiResponse<AddressItem>> {
  return request<AddressItem>(`/api/v1/addresses/${id}`);
}

export async function createAddress(data: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}): Promise<ApiResponse<AddressItem>> {
  return request<AddressItem>('/api/v1/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  id: number,
  data: Partial<AddressItem>
): Promise<ApiResponse<AddressItem>> {
  return request<AddressItem>(`/api/v1/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: number): Promise<ApiResponse<void>> {
  return request<void>(`/api/v1/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function geocodeAddress(query: string): Promise<ApiResponse<GeocodeResult>> {
  return request<GeocodeResult>('/api/v1/geocode', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ApiResponse<{ displayName: string; city: string }>> {
  return request<{ displayName: string; city: string }>('/api/v1/reverse-geocode', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}

// ============ Route APIs ============

export async function getRoutes(): Promise<ApiResponse<RouteItem[]>> {
  return request<RouteItem[]>('/api/v1/routes');
}

export async function getRoute(id: number): Promise<ApiResponse<RouteItem>> {
  return request<RouteItem>(`/api/v1/routes/${id}`);
}

export async function optimizeRoute(
  addressIds: number[],
  mode: 'shortest' | 'balanced' | 'regional' = 'shortest'
): Promise<ApiResponse<RouteItem>> {
  return request<RouteItem>('/api/v1/routes/optimize', {
    method: 'POST',
    body: JSON.stringify({ addressIds, mode }),
  });
}

export async function saveRoute(data: {
  name: string;
  optimizationMode: string;
  totalDistance: number;
  addressIds: number[];
  orderedAddresses: AddressItem[];
}): Promise<ApiResponse<RouteItem>> {
  return request<RouteItem>('/api/v1/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteRoute(id: number): Promise<ApiResponse<void>> {
  return request<void>(`/api/v1/routes/${id}`, {
    method: 'DELETE',
  });
}

export async function calculateDistance(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<ApiResponse<{ distance: number; unit: string }>> {
  return request<{ distance: number; unit: string }>('/api/v1/distance', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
}

export async function getExternalMapUrl(
  latitude: number,
  longitude: number,
  name?: string,
  provider: 'amap' | 'baidu' | 'google' | 'apple' = 'amap'
): Promise<ApiResponse<{ url: string; provider: string }>> {
  return request<{ url: string; provider: string }>('/api/v1/external-map-url', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, name, provider }),
  });
}
