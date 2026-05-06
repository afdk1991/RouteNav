/**
 * Network 模块
 * 封装网络请求，自动处理：
 * - 项目域名前缀拼接
 * - 相对路径/绝对路径判断
 * - 请求/响应日志打印
 * - Token 自动注入
 * - 错误处理
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'

// API 基础地址
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'

// 日志开关
const DEBUG = process.env.NODE_ENV === 'development'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}

interface UploadOptions {
  url: string
  fileUri: string
  name?: string
  mimeType?: string
  data?: Record<string, string>
}

export interface NetworkResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

// Token 存储
let token: string | null = null

async function initToken(): Promise<void> {
  try {
    token = await AsyncStorage.getItem('auth_token')
  } catch (e) {
    console.warn('[Network] Failed to load token:', e)
  }
}

function setToken(newToken: string | null): void {
  token = newToken
  if (newToken) {
    AsyncStorage.setItem('auth_token', newToken)
  } else {
    AsyncStorage.removeItem('auth_token')
  }
}

function getFullUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`
  }
  return `${BASE_URL}/${url}`
}

function log(method: string, url: string, data?: any, response?: any): void {
  if (!DEBUG) return
  console.log(`[Network] ${method} ${url}`)
  if (data) console.log(`[Network] Request:`, data)
  if (response) console.log(`[Network] Response:`, response)
}

async function request<T = any>(options: RequestOptions): Promise<NetworkResponse<T>> {
  const { url, method = 'GET', data, headers = {}, timeout = 30000 } = options

  const fullUrl = getFullUrl(url)

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // 添加 Token
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  // 构建请求配置
  const config: RequestInit = {
    method,
    headers: requestHeaders,
  }

  try {
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    config.signal = controller.signal

    const response = await fetch(fullUrl, config)
    clearTimeout(timeoutId)

    const result = await response.json()

    log(method, fullUrl, data, result)

    // 处理业务错误
    if (!response.ok) {
      if (response.status === 401) {
        setToken(null)
      }
      return {
        success: false,
        error: result.error || result.message || `HTTP ${response.status}`,
        statusCode: response.status,
      }
    }

    return {
      success: true,
      data: result,
      statusCode: response.status,
    }
  } catch (error: any) {
    log(method, fullUrl, data, { error: error.message })

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时，请稍后重试',
      }
    }

    return {
      success: false,
      error: error.message || '网络请求失败',
    }
  }
}

export const Network = {
  initToken,
  setToken,
  
  get: <T = any>(url: string, data?: Record<string, any>): Promise<NetworkResponse<T>> => {
    let fullUrl = url
    if (data) {
      const params = new URLSearchParams()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const queryString = params.toString()
      if (queryString) {
        fullUrl += (url.includes('?') ? '&' : '?') + queryString
      }
    }
    return request<T>({ url: fullUrl, method: 'GET' })
  },

  post: <T = any>(url: string, data?: any): Promise<NetworkResponse<T>> => {
    return request<T>({ url, method: 'POST', data })
  },

  put: <T = any>(url: string, data?: any): Promise<NetworkResponse<T>> => {
    return request<T>({ url, method: 'PUT', data })
  },

  delete: <T = any>(url: string, data?: any): Promise<NetworkResponse<T>> => {
    return request<T>({ url, method: 'DELETE', data })
  },

  patch: <T = any>(url: string, data?: any): Promise<NetworkResponse<T>> => {
    return request<T>({ url, method: 'PATCH', data })
  },

  uploadFile: async <T = any>(options: UploadOptions): Promise<NetworkResponse<T>> => {
    const { url, fileUri, name = 'file', mimeType, data = {} } = options
    const fullUrl = getFullUrl(url)

    try {
      const formData = new FormData()
      
      const fileName = fileUri.split('/').pop() || 'file'
      formData.append(name, {
        uri: fileUri,
        name: fileName,
        type: mimeType || 'application/octet-stream',
      } as any)

      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          statusCode: response.status,
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '文件上传失败',
      }
    }
  },

  downloadFile: async (url: string, fileUri: string): Promise<NetworkResponse> => {
    try {
      const fullUrl = getFullUrl(url)
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const downloadResult = await FileSystem.downloadAsync(fullUrl, fileUri, {
        headers,
      })

      if (downloadResult.status === 200) {
        return {
          success: true,
          data: { tempFilePath: downloadResult.uri },
        }
      }

      return {
        success: false,
        error: '下载失败',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '下载失败',
      }
    }
  },
}

// 初始化 Token
initToken()

export type { RequestOptions, UploadOptions }
