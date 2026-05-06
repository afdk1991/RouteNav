/**
 * 平台检测工具
 * 检测当前运行平台
 */

import { Platform, Dimensions } from 'react-native'

export type PlatformType = 'ios' | 'android' | 'web' | 'macos' | 'windows' | 'tv' | 'unknown'

/**
 * 获取当前平台
 */
export function getPlatform(): PlatformType {
  const os = Platform.OS
  if (os === 'ios') return 'ios'
  if (os === 'android') return 'android'
  if (os === 'web') return 'web'
  if (os === 'macos') return 'macos'
  if (os === 'windows') return 'windows'
  if (os === 'tvos') return 'tv'
  return 'unknown'
}

/**
 * 是否为 iOS 平台
 */
export const isIOS: boolean = Platform.OS === 'ios'

/**
 * 是否为 Android 平台
 */
export const isAndroid: boolean = Platform.OS === 'android'

/**
 * 是否为 Web 平台
 */
export const isWeb: boolean = Platform.OS === 'web'

/**
 * 是否为移动端
 */
export const isMobile: boolean = isIOS || isAndroid

/**
 * 是否为桌面端
 */
export const isDesktop: boolean = Platform.OS === 'macos' || Platform.OS === 'windows'

/**
 * 获取平台版本
 */
export function getPlatformVersion(): string {
  return Platform.Version?.toString() || 'unknown'
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): {
  platform: PlatformType
  version: string
  isMobile: boolean
  isDesktop: boolean
  isTablet: boolean
} {
  return {
    platform: getPlatform(),
    version: getPlatformVersion(),
    isMobile,
    isDesktop,
    isTablet: isTablet(),
  }
}

/**
 * 是否为平板
 */
function isTablet(): boolean {
  const { width, height } = Dimensions.get('window')
  const minDimension = Math.min(width, height)
  // 简单判断，实际应该检测设备型号
  return Platform.OS === 'ios' && minDimension >= 600
}

/**
 * 根据平台返回不同值
 */
export function selectByPlatform<T>(options: {
  ios?: T
  android?: T
  web?: T
  default?: T
}): T {
  const os = Platform.OS as keyof typeof options
  if (options[os] !== undefined) {
    return options[os] as T
  }
  return options.default as T
}

/**
 * Web 端检测
 */
export function isWechat(): boolean {
  if (typeof navigator === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent || '')
}

export function isWeibo(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Weibo/i.test(navigator.userAgent || '')
}

export function isDingTalk(): boolean {
  if (typeof navigator === 'undefined') return false
  return /DingTalk/i.test(navigator.userAgent || '')
}

export function isAlipay(): boolean {
  if (typeof navigator === 'undefined') return false
  return /AlipayClient/i.test(navigator.userAgent || '')
}

/**
 * 开发环境检测
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * 判断是否支持某些功能
 */
export const supports = {
  // 是否支持网络请求
  fetch: typeof fetch === 'function',
  
  // 是否支持 WebSocket
  webSocket: typeof WebSocket === 'function',
  
  // 是否支持本地存储 (Web 端)
  localStorage: typeof localStorage !== 'undefined',
  
  // 是否支持地理位置 (Web 端)
  geolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  
  // 是否支持通知 (Web 端)
  notification: typeof Notification !== 'undefined',
  
  // 是否支持 Service Worker (Web 端)
  serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
}
