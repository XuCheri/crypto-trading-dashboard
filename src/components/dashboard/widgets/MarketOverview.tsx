'use client'

import { useQuery } from '@tanstack/react-query'
import { getTicker24hr, transformTickers, filterUsdtPairs } from '@/lib/api/spot'
import { formatPrice, formatPercent, formatVolume, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

/**
 * 市场概览 Widget
 * 显示市场统计数据
 */
export function MarketOverview() {
  const language = useLanguage()

  const { data: tickers, isLoading } = useQuery({
    queryKey: ['spotTickers'],
    queryFn: async () => {
      const raw = await getTicker24hr()
      return transformTickers(raw)
    },
    refetchInterval: 30000,
  })

  // 计算统计数据
  const stats = tickers
    ? (() => {
        const usdtPairs = filterUsdtPairs(tickers)
        const gainers = usdtPairs.filter((t) => t.priceChangePercent > 0).length
        const losers = usdtPairs.filter((t) => t.priceChangePercent < 0).length
        const totalVolume = usdtPairs.reduce((sum, t) => sum + t.quoteVolume, 0)
        const avgChange =
          usdtPairs.reduce((sum, t) => sum + t.priceChangePercent, 0) / usdtPairs.length

        // BTC 和 ETH 数据
        const btc = tickers.find((t) => t.symbol === 'BTCUSDT')
        const eth = tickers.find((t) => t.symbol === 'ETHUSDT')

        return { gainers, losers, totalVolume, avgChange, btc, eth, total: usdtPairs.length }
      })()
    : null

  if (isLoading || !stats) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
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
