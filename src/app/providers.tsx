'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // 创建 QueryClient 实例（每个客户端独立）
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30秒内数据视为新鲜
            staleTime: 30 * 1000,
            // 5分钟垃圾回收
            gcTime: 5 * 60 * 1000,
            // 失败重试3次
            retry: 3,
            // 指数退避重试延迟
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // 窗口聚焦时刷新
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
