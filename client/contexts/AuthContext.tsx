import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
const AUTH_STORAGE_KEY = '@auth_data';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Get stored token for authenticated requests
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    const token = stored ? JSON.parse(stored).token : null;

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

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

async function generateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem('@device_id');
  if (existing) return existing;

  const uuid = Crypto.randomUUID();
  await AsyncStorage.setItem('@device_id', uuid);
  return uuid;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user: storedUser, token: storedToken } = JSON.parse(stored);
        if (storedToken && storedUser) {
          // Verify token is still valid
          const result = await request<User>('/api/v1/auth/me');
          if (result.success && result.data) {
            setUser(result.data);
            setToken(storedToken);
          } else {
            // Token invalid, clear storage
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }

      // Auto-register demo user if not logged in
      const existingUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!existingUser) {
        const deviceId = await generateDeviceId();
        const demoEmail = `demo_${deviceId.substring(0, 8)}@routeplanner.local`;
        const result = await request<{ id: number; username: string; email: string; token: string }>(
          '/api/v1/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({
              username: 'Demo用户',
              email: demoEmail,
              password: 'demo123',
            }),
          }
        );

        if (result.success && result.data) {
          const authData = {
            user: {
              id: result.data.id,
              username: result.data.username,
              email: result.data.email,
            },
            token: result.data.token,
          };
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
          setUser(authData.user);
          setToken(authData.token);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await request<{ id: number; username: string; email: string; token: string }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      if (result.success && result.data) {
        const authData = {
          user: {
            id: result.data.id,
            username: result.data.username,
            email: result.data.email,
          },
          token: result.data.token,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        setUser(authData.user);
        setToken(authData.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const result = await request<{ id: number; username: string; email: string; token: string }>(
        '/api/v1/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ username, email, password }),
        }
      );

      if (result.success && result.data) {
        const authData = {
          user: {
            id: result.data.id,
            username: result.data.username,
            email: result.data.email,
          },
          token: result.data.token,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        setUser(authData.user);
        setToken(authData.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
