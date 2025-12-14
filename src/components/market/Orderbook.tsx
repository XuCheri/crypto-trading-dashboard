'use client'

import { useState, useCallback, useMemo } from 'react'
import { useDepthStream, DepthStreamData } from '@/hooks/useBinanceStream'
import { formatPrice, formatNumber, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

/** 部分深度流数据格式 */
interface PartialDepthStreamData {
  lastUpdateId: number
  bids: [string, string][]
  asks: [string, string][]
}

interface OrderbookProps {
  symbol: string
  rows?: number
  className?: string
}

interface OrderbookLevel {
  price: number
  quantity: number
  total: number
  percent: number
}

/**
 * 订单簿组件
 * 显示买卖盘深度数据
 */
export function Orderbook({ symbol, rows = 15, className }: OrderbookProps) {
  const language = useLanguage()

  // 订单簿数据
  const [bids, setBids] = useState<[string, string][]>([])
  const [asks, setAsks] = useState<[string, string][]>([])

  // 处理深度数据更新
  // 支持两种格式：
  // - 增量深度流 (depthUpdate): { b: [...], a: [...] }
  // - 部分深度流 (depth<levels>): { bids: [...], asks: [...] }
  const handleDepthUpdate = useCallback((data: DepthStreamData | PartialDepthStreamData) => {
    // 检查数据格式，兼容两种流
    const bidsData = 'bids' in data ? data.bids : data.b
    const asksData = 'asks' in data ? data.asks : data.a

    if (bidsData) {
      setBids(bidsData.slice(0, 20))
    }
    if (asksData) {
      setAsks(asksData.slice(0, 20))
    }
  }, [])

  // 订阅深度数据
  const { isConnected } = useDepthStream(symbol, handleDepthUpdate, {
    enabled: !!symbol,
  })

  // 处理买单数据
  const processedBids = useMemo((): OrderbookLevel[] => {
    let cumulative = 0
    const levels = bids.slice(0, rows).map(([price, qty]) => {
      const p = parseFloat(price)
      const q = parseFloat(qty)
      cumulative += q
      return { price: p, quantity: q, total: cumulative, percent: 0 }
    })

    // 计算百分比
    const maxTotal = levels.length > 0 ? levels[levels.length - 1].total : 1
    return levels.map((l) => ({ ...l, percent: (l.total / maxTotal) * 100 }))
  }, [bids, rows])

  // 处理卖单数据
  const processedAsks = useMemo((): OrderbookLevel[] => {
    let cumulative = 0
    const levels = asks.slice(0, rows).map(([price, qty]) => {
      const p = parseFloat(price)
      const q = parseFloat(qty)
      cumulative += q
      return { price: p, quantity: q, total: cumulative, percent: 0 }
    })

    // 计算百分比
    const maxTotal = levels.length > 0 ? levels[levels.length - 1].total : 1
    return levels.map((l) => ({ ...l, percent: (l.total / maxTotal) * 100 }))
  }, [asks, rows])

  // 中间价
  const midPrice = useMemo(() => {
    if (processedBids.length === 0 || processedAsks.length === 0) return null
    return (processedBids[0].price + processedAsks[0].price) / 2
  }, [processedBids, processedAsks])

  // 价差
  const spread = useMemo(() => {
    if (processedBids.length === 0 || processedAsks.length === 0) return null
    const spreadValue = processedAsks[0].price - processedBids[0].price
    const spreadPercent = (spreadValue / processedAsks[0].price) * 100
    return { value: spreadValue, percent: spreadPercent }
  }, [processedBids, processedAsks])

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="font-semibold text-sm">
          {language === 'zh' ? '订单簿' : 'Order Book'}
        </h3>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-up animate-pulse' : 'bg-muted'
          )}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-3 px-3 py-1 text-xs text-muted-foreground border-b border-border">
        <div>{language === 'zh' ? '价格' : 'Price'}</div>
        <div className="text-right">{language === 'zh' ? '数量' : 'Amount'}</div>
        <div className="text-right">{language === 'zh' ? '累计' : 'Total'}</div>
      </div>

      {/* 卖单（从低到高显示，倒序） */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col-reverse">
          {processedAsks.slice(0, rows).map((level, i) => (
            <div
              key={`ask-${i}`}
              className="relative grid grid-cols-3 px-3 py-0.5 text-xs hover:bg-accent/50"
            >
              {/* 深度背景 */}
              <div
                className="absolute inset-y-0 right-0 bg-down/10"
                style={{ width: `${level.percent}%` }}
              />
              <div className="relative text-down tabular-nums">
                {formatPrice(level.price)}
              </div>
              <div className="relative text-right tabular-nums">
                {formatNumber(level.quantity, 4)}
              </div>
              <div className="relative text-right tabular-nums text-muted-foreground">
                {formatNumber(level.total, 4)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 中间价和价差 */}
      <div className="px-3 py-2 border-y border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tabular-nums">
            {midPrice ? formatPrice(midPrice) : '-'}
          </span>
          {spread && (
            <span className="text-xs text-muted-foreground">
              {language === 'zh' ? '价差' : 'Spread'}: {spread.percent.toFixed(3)}%
            </span>
          )}
        </div>
      </div>

      {/* 买单 */}
      <div className="flex-1 overflow-hidden">
        {processedBids.slice(0, rows).map((level, i) => (
          <div
            key={`bid-${i}`}
            className="relative grid grid-cols-3 px-3 py-0.5 text-xs hover:bg-accent/50"
          >
            {/* 深度背景 */}
            <div
              className="absolute inset-y-0 right-0 bg-up/10"
              style={{ width: `${level.percent}%` }}
            />
            <div className="relative text-up tabular-nums">
              {formatPrice(level.price)}
            </div>
            <div className="relative text-right tabular-nums">
              {formatNumber(level.quantity, 4)}
            </div>
            <div className="relative text-right tabular-nums text-muted-foreground">
              {formatNumber(level.total, 4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
