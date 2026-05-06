/**
 * Taro 网络请求封装
 * 自动处理：
 * - 项目域名前缀拼接
 * - 请求/响应日志打印
 * - 错误处理
 */

const BASE_URL = process.env.TARO_API_BASE_URL || 'http://localhost:9091'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  headers?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
}

interface ResponseData<T = any> {
  code: number
  data: T
  message: string
}

class Network {
  private baseURL: string
  private token: string = ''

  constructor() {
    this.baseURL = BASE_URL
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = ''
  }

  getToken(): string {
    return this.token
  }

  private async request<T = any>(options: RequestOptions): Promise<ResponseData<T>> {
    const { url, method = 'GET', data, headers = {}, showLoading = true, showError = true } = options

    // 处理 URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url.startsWith('/') ? '' : '/'}${url}`

    // 合并 headers
    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (this.token) {
      mergedHeaders['Authorization'] = `Bearer ${this.token}`
    }

    // 显示加载提示
    if (showLoading && Taro.showLoading) {
      Taro.showLoading({ title: '加载中...' })
    }

    try {
      console.log(`[Network] ${method} ${fullUrl}`, data || '')

      const response = await Taro.request({
        url: fullUrl,
        method,
        data,
        header: mergedHeaders,
        timeout: 30000,
      })

      if (showLoading && Taro.hideLoading) {
        Taro.hideLoading()
      }

      const result = response.data as ResponseData<T>

      console.log(`[Network] Response:`, result)

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return result
      } else {
        // 处理错误状态码
        if (showError && Taro.showToast) {
          Taro.showToast({
            title: result.message || '请求失败',
            icon: 'none',
          })
        }
        throw new Error(result.message || `HTTP ${response.statusCode}`)
      }
    } catch (error: any) {
      if (showLoading && Taro.hideLoading) {
        Taro.hideLoading()
      }

      console.error(`[Network] Error:`, error)

      if (showError && Taro.showToast) {
        Taro.showToast({
          title: error.message || '网络请求失败',
          icon: 'none',
        })
      }

      throw error
    }
  }

  get<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ResponseData<T>> {
    return this.request<T>({ url, method: 'GET', data, ...options })
  }

  post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ResponseData<T>> {
    return this.request<T>({ url, method: 'POST', data, ...options })
  }

  put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ResponseData<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...options })
  }

  delete<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ResponseData<T>> {
    return this.request<T>({ url, method: 'DELETE', data, ...options })
  }

  patch<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ResponseData<T>> {
    return this.request<T>({ url, method: 'PATCH', data, ...options })
  }

  // 文件上传
  uploadFile(options: {
    url: string
    filePath: string
    name?: string
    formData?: Record<string, string>
    showLoading?: boolean
  }): Promise<ResponseData<{ url: string }>> {
    const { url, filePath, name = 'file', formData, showLoading = true } = options

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url.startsWith('/') ? '' : '/'}${url}`

    if (showLoading && Taro.showLoading) {
      Taro.showLoading({ title: '上传中...' })
    }

    return new Promise((resolve, reject) => {
      const header: Record<string, string> = {}
      if (this.token) {
        header['Authorization'] = `Bearer ${this.token}`
      }

      Taro.uploadFile({
        url: fullUrl,
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          if (showLoading && Taro.hideLoading) {
            Taro.hideLoading()
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(res.data) as ResponseData<{ url: string }>
            resolve(data)
          } else {
            reject(new Error('上传失败'))
          }
        },
        fail: (err) => {
          if (showLoading && Taro.hideLoading) {
            Taro.hideLoading()
          }
          reject(err)
        },
      })
    })
  }

  // 文件下载
  downloadFile(options: { url: string; showLoading?: boolean }): Promise<string> {
    const { url, showLoading = true } = options

    if (showLoading && Taro.showLoading) {
      Taro.showLoading({ title: '下载中...' })
    }

    return new Promise((resolve, reject) => {
      Taro.downloadFile({
        url,
        success: (res) => {
          if (showLoading && Taro.hideLoading) {
            Taro.hideLoading()
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.tempFilePath)
          } else {
            reject(new Error('下载失败'))
          }
        },
        fail: (err) => {
          if (showLoading && Taro.hideLoading) {
            Taro.hideLoading()
          }
          reject(err)
        },
      })
    })
  }
}

export const Network = new Network()
export default Network
