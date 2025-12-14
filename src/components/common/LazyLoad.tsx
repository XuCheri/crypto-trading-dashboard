'use client'

import { Suspense, ComponentType, ReactNode } from 'react'
import dynamic from 'next/dynamic'

interface LoadingProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * 加载占位组件
 */
export function LoadingFallback({ className = '' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )
}

/**
 * 骨架屏组件
 */
export function Skeleton({ className = '', style }: LoadingProps) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} style={style} />
  )
}

/**
 * 图表加载占位
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4"
      style={{ height }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-full w-full" style={{ height: height - 80 }} />
    </div>
  )
}

/**
 * 表格加载占位
 */
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* 表头 */}
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-border">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {/* 行 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 卡片加载占位
 */
export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

/**
 * 创建懒加载组件
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: ReactNode = <LoadingFallback />
) {
  const LazyComponent = dynamic(importFn, {
    loading: () => <>{fallback}</>,
    ssr: false,
  })

  return LazyComponent
}

/**
 * 带 Suspense 的懒加载包装器
 */
export function LazyWrapper({
  children,
  fallback = <LoadingFallback />,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
