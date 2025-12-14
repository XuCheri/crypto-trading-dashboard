'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useBinanceStream } from '@/hooks/useBinanceStream'
import { TickerData, transformWsTicker, WsTicker } from '@/lib/api/types'
import { formatPrice, formatPercent, formatVolume, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { TrendingUp, TrendingDown, Activity, DollarSign, Wifi, WifiOff } from 'lucide-react'

/**
 * 市场概览 Widget（纯 WebSocket 模式）
 * 显示市场统计数据
 */
export function MarketOverview() {
  const language = useLanguage()
  const [isConnected, setIsConnected] = useState(false)
  const tickersRef = useRef<Map<string, TickerData>>(new Map())
  const [stats, setStats] = useState<{
    gainers: number
    losers: number
    totalVolume: number
    avgChange: number
    btc: TickerData | null
    eth: TickerData | null
    total: number
  } | null>(null)

  // 处理 ticker 消息
  const handleTickerMessage = useCallback((data: unknown) => {
    setIsConnected(true)

    // 全市场 ticker 返回数组
    const items = Array.isArray(data) ? data : [data]

    items.forEach((item) => {
      const ticker = item as WsTicker
      if (ticker.e === '24hrTicker' && ticker.s.endsWith('USDT')) {
        tickersRef.current.set(ticker.s, transformWsTicker(ticker))
      }
    })

    // 计算统计数据
    const allTickers = Array.from(tickersRef.current.values())
    if (allTickers.length > 0) {
      const gainers = allTickers.filter((t) => t.priceChangePercent > 0).length
      const losers = allTickers.filter((t) => t.priceChangePercent < 0).length
      const totalVolume = allTickers.reduce((sum, t) => sum + t.quoteVolume, 0)
      const avgChange =
        allTickers.reduce((sum, t) => sum + t.priceChangePercent, 0) / allTickers.length
      const btc = tickersRef.current.get('BTCUSDT') || null
      const eth = tickersRef.current.get('ETHUSDT') || null

      setStats({
        gainers,
        losers,
        totalVolume,
        avgChange,
        btc,
        eth,
        total: allTickers.length,
      })
    }
  }, [])

  // 订阅全市场 ticker
  useBinanceStream(['!ticker@arr'], handleTickerMessage, {
    enabled: true,
    market: 'spot',
  })

  if (!isConnected) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-2">
        <WifiOff className="h-6 w-6 text-yellow-500 animate-pulse" />
        <div className="text-muted-foreground text-sm">
          {language === 'zh' ? '正在连接...' : 'Connecting...'}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">
          {language === 'zh' ? '等待数据...' : 'Waiting for data...'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* 连接状态 */}
      <div className="flex items-center justify-end gap-1 text-xs text-green-500">
        <Wifi className="h-3 w-3" />
        <span>{language === 'zh' ? '实时' : 'Live'}</span>
      </div>

      {/* BTC & ETH */}
      <div className="grid grid-cols-2 gap-3">
        {stats.btc && (
          <div className="p-3 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">BTC</span>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  getPriceColorClass(stats.btc.priceChangePercent)
                )}
              >
                {formatPercent(stats.btc.priceChangePercent)}
              </span>
            </div>
            <div className="font-semibold tabular-nums">
              ${formatPrice(stats.btc.price)}
            </div>
          </div>
        )}
        {stats.eth && (
          <div className="p-3 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">ETH</span>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  getPriceColorClass(stats.eth.priceChangePercent)
                )}
              >
                {formatPercent(stats.eth.priceChangePercent)}
              </span>
            </div>
            <div className="font-semibold tabular-nums">
              ${formatPrice(stats.eth.price)}
            </div>
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-up/10 rounded-lg">
          <TrendingUp className="h-5 w-5 text-up" />
          <div>
            <div className="text-xs text-muted-foreground">
              {language === 'zh' ? '上涨' : 'Gainers'}
            </div>
            <div className="font-semibold text-up">{stats.gainers}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-down/10 rounded-lg">
          <TrendingDown className="h-5 w-5 text-down" />
          <div>
            <div className="text-xs text-muted-foreground">
              {language === 'zh' ? '下跌' : 'Losers'}
            </div>
            <div className="font-semibold text-down">{stats.losers}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">
              {language === 'zh' ? '24h 成交额' : '24h Volume'}
            </div>
            <div className="font-semibold">${formatVolume(stats.totalVolume)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">
              {language === 'zh' ? '交易对' : 'Pairs'}
            </div>
            <div className="font-semibold">{stats.total}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
