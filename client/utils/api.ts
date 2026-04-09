import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AddressItem, RouteItem, GeocodeResult, ApiResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
const AUTH_STORAGE_KEY = '@auth_data';

// Get stored token
async function getToken(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const { token } = JSON.parse(stored);
      return token || null;
    }
    return null;
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  _retry?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - token expired
      if (response.status === 401 && !options._retry) {
        // Clear invalid token
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return {
          success: false,
          error: data.error || '登录已过期，请重新登录',
        };
      }
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

// Retry wrapper with exponential backoff
async function requestWithRetry<T>(
  endpoint: string,
  options: RequestOptions = {},
  maxRetries = 3
): Promise<ApiResponse<T>> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const result = await request<T>(endpoint, options);
    if (result.success) return result;

    lastError = new Error(result.error);
    // Don't retry on certain errors
    if (
      result.error?.includes('401') ||
      result.error?.includes('登录已过期') ||
      result.error?.includes('404') ||
      result.error?.includes('400')
    ) {
      return result;
    }

    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  return {
    success: false,
    error: lastError?.message || `Failed after ${maxRetries} retries`,
  };
}

// ============ Address APIs ============

export async function getAddresses(): Promise<ApiResponse<AddressItem[]>> {
  return requestWithRetry<AddressItem[]>('/api/v1/addresses');
}

export async function getAddress(id: number): Promise<ApiResponse<AddressItem>> {
  return requestWithRetry<AddressItem>(`/api/v1/addresses/${id}`);
}

export async function createAddress(data: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}): Promise<ApiResponse<AddressItem>> {
  return requestWithRetry<AddressItem>('/api/v1/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  id: number,
  data: Partial<AddressItem>
): Promise<ApiResponse<AddressItem>> {
  return requestWithRetry<AddressItem>(`/api/v1/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: number): Promise<ApiResponse<void>> {
  return requestWithRetry<void>(`/api/v1/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function geocodeAddress(query: string): Promise<ApiResponse<GeocodeResult>> {
  return requestWithRetry<GeocodeResult>('/api/v1/geocode', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ApiResponse<{ displayName: string; city: string }>> {
  return requestWithRetry<{ displayName: string; city: string }>('/api/v1/reverse-geocode', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}

// ============ Route APIs ============

export async function getRoutes(): Promise<ApiResponse<RouteItem[]>> {
  return requestWithRetry<RouteItem[]>('/api/v1/routes');
}

export async function getRoute(id: number): Promise<ApiResponse<RouteItem>> {
  return requestWithRetry<RouteItem>(`/api/v1/routes/${id}`);
}

export async function optimizeRoute(
  addressIds: number[],
  mode: 'shortest' | 'balanced' | 'regional' = 'shortest'
): Promise<ApiResponse<{
  addressIds: number[];
  orderedAddresses: AddressItem[];
  totalDistance: number;
  optimizationMode: string;
}>> {
  return requestWithRetry(`/api/v1/routes/optimize`, {
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
  return requestWithRetry<RouteItem>('/api/v1/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteRoute(id: number): Promise<ApiResponse<void>> {
  return requestWithRetry<void>(`/api/v1/routes/${id}`, {
    method: 'DELETE',
  });
}

export async function calculateDistance(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<ApiResponse<{ distance: number; unit: string }>> {
  return requestWithRetry<{ distance: number; unit: string }>('/api/v1/distance', {
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
  return requestWithRetry<{ url: string; provider: string }>('/api/v1/external-map-url', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, name, provider }),
  });
}

// ============ Attraction APIs ============

export interface AttractionItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  category: string;
  region: string;
}

export async function getAttractions(params?: {
  city?: string;
  category?: string;
  region?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<{
  items: AttractionItem[];
  total: number;
  limit: number;
  offset: number;
}>> {
  const searchParams = new URLSearchParams();
  if (params?.city) searchParams.append('city', params.city);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.region) searchParams.append('region', params.region);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  return requestWithRetry(`/api/v1/attractions${query ? `?${query}` : ''}`);
}

export async function getAttraction(id: number): Promise<ApiResponse<AttractionItem>> {
  return requestWithRetry<AttractionItem>(`/api/v1/attractions/${id}`);
}

export async function getCitiesList(): Promise<ApiResponse<{ city: string; count: number }[]>> {
  return requestWithRetry(`/api/v1/attractions/cities/list`);
}

// ============ Health Check ============

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    return response.ok;
  } catch {
    return false;
  }
}
