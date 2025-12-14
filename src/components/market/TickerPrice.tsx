'use client'

import { useState, useCallback } from 'react'
import { useTickerStream, TickerStreamData } from '@/hooks/useBinanceStream'
import { formatPrice, formatPercent, getPriceColorClass } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TickerPriceProps {
  symbol: string
  showChange?: boolean
  className?: string
}

/**
 * 实时价格显示组件
 * 使用 WebSocket 订阅单个交易对的 ticker 数据
 */
export function TickerPrice({
  symbol,
  showChange = true,
  className,
}: TickerPriceProps) {
  const [ticker, setTicker] = useState<{
    price: number
    change: number
    changePercent: number
  } | null>(null)

  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  // 处理 WebSocket 消息
  const handleMessage = useCallback(
    (data: TickerStreamData) => {
      const newPrice = parseFloat(data.c)
      const newChange = parseFloat(data.p)
      const newChangePercent = parseFloat(data.P)

      // 价格变化闪烁效果
      if (ticker) {
        if (newPrice > ticker.price) {
          setFlash('up')
        } else if (newPrice < ticker.price) {
          setFlash('down')
        }
        setTimeout(() => setFlash(null), 300)
      }

      setTicker({
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
      })
    },
    [ticker]
  )

  // 订阅 WebSocket
  const { isConnected } = useTickerStream(symbol, handleMessage, {
    enabled: !!symbol,
  })

  if (!ticker) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-24" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* 价格 */}
      <span
        className={cn(
          'text-lg font-semibold tabular-nums transition-colors duration-300',
          flash === 'up' && 'text-up',
          flash === 'down' && 'text-down'
        )}
      >
        {formatPrice(ticker.price)}
      </span>

      {/* 涨跌幅 */}
      {showChange && (
        <span
          className={cn(
            'text-sm tabular-nums',
            getPriceColorClass(ticker.changePercent)
          )}
        >
          {formatPercent(ticker.changePercent)}
        </span>
      )}

      {/* 连接状态指示器 */}
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-up animate-pulse' : 'bg-muted'
        )}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />
    </div>
  )
}
