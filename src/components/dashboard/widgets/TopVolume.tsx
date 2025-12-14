'use client'

import { useState, useCallback, useRef } from 'react'
import { useBinanceStream } from '@/hooks/useBinanceStream'
import { TickerData, transformWsTicker, WsTicker } from '@/lib/api/types'
import { formatVolume, formatPercent, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * 成交额排行 Widget（纯 WebSocket 模式）
 * 显示成交额最大的交易对
 */
export function TopVolume() {
  const language = useLanguage()
  const [isConnected, setIsConnected] = useState(false)
  const tickersRef = useRef<Map<string, TickerData>>(new Map())
  const [topVolume, setTopVolume] = useState<TickerData[]>([])

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

    // 计算成交额前10
    const allTickers = Array.from(tickersRef.current.values())
    const sorted = allTickers
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, 10)

    setTopVolume(sorted)
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
          <div className="text-right">{language === 'zh' ? '成交额' : 'Volume'}</div>
          <div className="text-right">{language === 'zh' ? '涨跌' : 'Change'}</div>
        </div>
        <Wifi className="h-3 w-3 text-green-500 ml-2" />
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {topVolume.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '等待数据...' : 'Waiting...'}
          </div>
        ) : (
          topVolume.map((ticker, index) => (
            <div
              key={ticker.symbol}
              className="grid grid-cols-3 px-4 py-2 text-sm hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                <span className="font-medium">{ticker.symbol.replace('USDT', '')}</span>
              </div>
              <div className="text-right tabular-nums text-xs">
                ${formatVolume(ticker.quoteVolume)}
              </div>
              <div
                className={cn(
                  'text-right tabular-nums font-medium',
                  getPriceColorClass(ticker.priceChangePercent)
                )}
              >
                {formatPercent(ticker.priceChangePercent)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
