'use client'

import { useState, useCallback, useRef } from 'react'
import { useBinanceStream } from '@/hooks/useBinanceStream'
import { TickerData, transformWsTicker, WsTicker } from '@/lib/api/types'
import { formatPrice, formatPercent, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * 跌幅榜 Widget（纯 WebSocket 模式）
 * 显示跌幅最大的交易对
 */
export function TopLosers() {
  const language = useLanguage()
  const [isConnected, setIsConnected] = useState(false)
  const tickersRef = useRef<Map<string, TickerData>>(new Map())
  const [topLosers, setTopLosers] = useState<TickerData[]>([])

  // 处理 ticker 消息
  const handleTickerMessage = useCallback((data: unknown) => {
    setIsConnected(true)

    const items = Array.isArray(data) ? data : [data]

    items.forEach((item) => {
      const ticker = item as WsTicker
      if (ticker.e === '24hrTicker' && ticker.s.endsWith('USDT')) {
        tickersRef.current.set(ticker.s, transformWsTicker(ticker))
      }
    })

    // 计算跌幅前10
    const allTickers = Array.from(tickersRef.current.values())
    const losers = allTickers
      .filter((t) => t.priceChangePercent < 0)
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 10)

    setTopLosers(losers)
  }, [])

  // 订阅全市场 ticker
  useBinanceStream(['!ticker@arr'], handleTickerMessage, {
    enabled: true,
    market: 'spot',
  })

  if (!isConnected) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-2">
        <WifiOff className="h-5 w-5 text-yellow-500 animate-pulse" />
        <div className="text-muted-foreground text-sm">
          {language === 'zh' ? '正在连接...' : 'Connecting...'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 表头 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="grid grid-cols-3 flex-1 text-xs text-muted-foreground">
          <div>{language === 'zh' ? '交易对' : 'Pair'}</div>
          <div className="text-right">{language === 'zh' ? '价格' : 'Price'}</div>
          <div className="text-right">{language === 'zh' ? '跌幅' : 'Change'}</div>
        </div>
        <Wifi className="h-3 w-3 text-green-500 ml-2" />
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {topLosers.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '等待数据...' : 'Waiting...'}
          </div>
        ) : (
          topLosers.map((ticker, index) => (
            <div
              key={ticker.symbol}
              className="grid grid-cols-3 px-4 py-2 text-sm hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                <span className="font-medium">{ticker.symbol.replace('USDT', '')}</span>
              </div>
              <div className="text-right tabular-nums">${formatPrice(ticker.price)}</div>
              <div className={cn('text-right tabular-nums font-medium', 'text-down')}>
                {formatPercent(ticker.priceChangePercent)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
