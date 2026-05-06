/**
 * 尺寸测量工具
 * 提供响应式尺寸计算和转换
 */

import { Dimensions, PixelRatio, Platform } from 'react-native'

// 屏幕尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// 设计稿基准尺寸
const DESIGN_WIDTH = 375
const DESIGN_HEIGHT = 812

/**
 * 获取屏幕尺寸
 */
export function getScreenSize(): { width: number; height: number } {
  const { width, height } = Dimensions.get('window')
  return { width, height }
}

/**
 * 获取屏幕宽度
 */
export const screenWidth: number = SCREEN_WIDTH

/**
 * 获取屏幕高度
 */
export const screenHeight: number = SCREEN_HEIGHT

/**
 * 根据设计稿宽度等比缩放
 * @param size 设计稿尺寸
 * @returns 实际尺寸
 */
export function scaleWidth(size: number): number {
  return (SCREEN_WIDTH / DESIGN_WIDTH) * size
}

/**
 * 根据设计稿高度等比缩放
 * @param size 设计稿尺寸
 * @returns 实际尺寸
 */
export function scaleHeight(size: number): number {
  return (SCREEN_HEIGHT / DESIGN_HEIGHT) * size
}

/**
 * 等比缩放（取宽高缩放比例的较小值）
 * @param size 设计稿尺寸
 * @returns 实际尺寸
 */
export function scale(size: number): number {
  const scaleX = SCREEN_WIDTH / DESIGN_WIDTH
  const scaleY = SCREEN_HEIGHT / DESIGN_HEIGHT
  const scale = Math.min(scaleX, scaleY)
  return size * scale
}

/**
 * 字体缩放（根据屏幕宽度）
 * @param size 设计稿字体大小
 * @returns 实际字体大小
 */
export function fontSize(size: number): number {
  const scaleFactor = SCREEN_WIDTH / DESIGN_WIDTH
  return size * scaleFactor
}

/**
 * 获取像素密度
 */
export function getPixelRatio(): number {
  return PixelRatio.get()
}

/**
 * 将设计稿尺寸转换为实际像素
 * @param size 设计稿尺寸
 * @returns 实际像素
 */
export function toPixel(size: number): number {
  return PixelRatio.roundToNearestPixel(size)
}

/**
 * 将设计稿尺寸转换为逻辑像素（适配高清屏）
 * @param size 设计稿尺寸
 * @returns 逻辑像素
 */
export function toLogicalPixel(size: number): number {
  return size * PixelRatio.get()
}

/**
 * 计算圆角
 * @param radius 设计稿圆角
 * @returns 实际圆角
 */
export function borderRadius(radius: number): number {
  return scale(radius)
}

/**
 * 计算内边距
 * @param padding 设计稿内边距
 * @returns 实际内边距
 */
export function padding(padding: number): number {
  return scale(padding)
}

/**
 * 计算外边距
 * @param margin 设计稿外边距
 * @returns 实际外边距
 */
export function margin(margin: number): number {
  return scale(margin)
}

/**
 * 计算行高
 * @param fontSize 字体大小
 * @param lineHeightRatio 行高比例（默认1.5）
 * @returns 行高
 */
export function lineHeight(fontSize: number, lineHeightRatio: number = 1.5): number {
  return Math.round(fontSize * lineHeightRatio)
}

/**
 * 响应式尺寸配置
 */
export const responsive = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
}

/**
 * 响应式字体大小
 */
export const responsiveFont = {
  xs: fontSize(10),
  sm: fontSize(12),
  md: fontSize(14),
  lg: fontSize(16),
  xl: fontSize(18),
  xxl: fontSize(20),
  xxxl: fontSize(24),
  title: fontSize(28),
  large: fontSize(32),
}

/**
 * 安全区域
 */
export function getSafeArea(): {
  top: number
  bottom: number
  left: number
  right: number
} {
  // 简单实现，实际应该使用 react-native-safe-area-context
  return {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  }
}

/**
 * 判断是否为刘海屏
 */
export function isNotchDevice(): boolean {
  // 简单判断，实际应该检测设备型号
  const { width, height } = Dimensions.get('window')
  const aspectRatio = height / width
  return aspectRatio > 2 || (Platform.OS === 'ios' && height >= 812)
}

/**
 * 判断是否为大屏手机
 */
export function isLargeScreen(): boolean {
  const { width } = Dimensions.get('window')
  return width >= 414 // iPhone Plus 系列
}

/**
 * 判断是否为小屏手机
 */
export function isSmallScreen(): boolean {
  const { width } = Dimensions.get('window')
  return width <= 320 // iPhone SE / 早期 iPhone
}
