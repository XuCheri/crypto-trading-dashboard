'use client'

import { useState, useEffect } from 'react'

/**
 * 媒体查询 Hook
 * 用于响应式设计
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // 初始值
    setMatches(media.matches)

    // 监听变化
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// 预定义的断点 hooks
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsLargeDesktop() {
  return useMediaQuery('(min-width: 1280px)')
}
