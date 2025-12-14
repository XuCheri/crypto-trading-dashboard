'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 合约页面
 * 默认重定向到 USDT-M 永续合约
 */
export default function FuturesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/futures/usdt-m')
  }, [router])

  return (
    <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  )
}
