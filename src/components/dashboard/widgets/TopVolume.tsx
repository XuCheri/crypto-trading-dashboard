'use client'

import { useQuery } from '@tanstack/react-query'
import { getTicker24hr, transformTickers, filterUsdtPairs } from '@/lib/api/spot'
import { formatPrice, formatVolume, formatPercent, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

/**
 * 成交额排行 Widget
 * 显示成交额最大的交易对
 */
export function TopVolume() {
  const language = useLanguage()

  const { data: tickers, isLoading } = useQuery({
    queryKey: ['spotTickers'],
    queryFn: async () => {
      const raw = await getTicker24hr()
      return transformTickers(raw)
    },
    refetchInterval: 30000,
  })

  // 获取成交额前10
  const topVolume = tickers
    ? filterUsdtPairs(tickers)
        .sort((a, b) => b.quoteVolume - a.quoteVolume)
        .slice(0, 10)
    : []

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 表头 */}
      <div className="grid grid-cols-3 px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <div>{language === 'zh' ? '交易对' : 'Pair'}</div>
        <div className="text-right">{language === 'zh' ? '成交额' : 'Volume'}</div>
        <div className="text-right">{language === 'zh' ? '涨跌' : 'Change'}</div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {topVolume.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '暂无数据' : 'No data'}
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
