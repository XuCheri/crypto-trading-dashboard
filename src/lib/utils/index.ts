/**
 * 工具函数
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 合并 Tailwind 类名 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 格式化价格 */
export function formatPrice(
  price: number,
  options: {
    currency?: string
    decimals?: number
    compact?: boolean
  } = {}
): string {
  const { currency, decimals, compact = false } = options

  // 根据价格大小自动确定小数位
  let autoDecimals = decimals
  if (autoDecimals === undefined) {
    if (price >= 1000) autoDecimals = 2
    else if (price >= 1) autoDecimals = 4
    else if (price >= 0.01) autoDecimals = 6
    else autoDecimals = 8
  }

  if (compact && price >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: autoDecimals,
    maximumFractionDigits: autoDecimals,
  }).format(price)

  return currency ? `${currency}${formatted}` : formatted
}

/** 格式化百分比 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/** 格式化成交量 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(2)
}

/** 格式化时间戳 */
export function formatTime(
  timestamp: number,
  format: 'time' | 'date' | 'datetime' | 'relative' = 'datetime'
): string {
  const date = new Date(timestamp)

  switch (format) {
    case 'time':
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    case 'date':
      return date.toLocaleDateString('zh-CN')
    case 'datetime':
      return date.toLocaleString('zh-CN')
    case 'relative':
      return getRelativeTime(timestamp)
  }
}

/** 获取相对时间 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return formatTime(timestamp, 'date')
}

/** 格式化数字（带千分位） */
export function formatNumber(value: number, decimals?: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** 截断字符串 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/** 延迟执行 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 节流函数 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let lastCall = 0
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }) as T
}

/** 防抖函数 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

/** 获取涨跌颜色类名 */
export function getPriceColorClass(change: number): string {
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-muted-foreground'
}

/** 获取涨跌背景色类名 */
export function getPriceBgClass(change: number): string {
  if (change > 0) return 'bg-up/10'
  if (change < 0) return 'bg-down/10'
  return 'bg-muted'
}
