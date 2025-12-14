'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  useFuturesTickerStream,
  useCoinMTickerStream,
  useMarkPriceStream,
  TickerStreamData,
  MarkPriceStreamData,
} from '@/hooks/useBinanceStream'
import { formatPrice, formatPercent, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

interface FuturesTickerPriceProps {
  symbol: string
  marketType: 'usdt-m' | 'coin-m'
  showChange?: boolean
  showMarkPrice?: boolean
  showFundingRate?: boolean
  className?: string
}

/**
 * 合约实时价格显示组件
 * 显示最新价、标记价格、资金费率等
 */
export function FuturesTickerPrice({
  symbol,
  marketType,
  showChange = true,
  showMarkPrice = true,
  showFundingRate = true,
  className,
}: FuturesTickerPriceProps) {
  const language = useLanguage()

  const [ticker, setTicker] = useState<{
    price: number
    change: number
    changePercent: number
  } | null>(null)

  const [markPriceData, setMarkPriceData] = useState<{
    markPrice: number
    indexPrice: number
    fundingRate: number
    nextFundingTime: number
  } | null>(null)

  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  // 处理 Ticker WebSocket 消息
  const handleTickerMessage = useCallback(
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

  // 处理标记价格 WebSocket 消息
  const handleMarkPriceMessage = useCallback((data: MarkPriceStreamData) => {
    setMarkPriceData({
      markPrice: parseFloat(data.p),
      indexPrice: parseFloat(data.i),
      fundingRate: parseFloat(data.r),
      nextFundingTime: data.T,
    })
  }, [])

  // 根据市场类型选择不同的 hook
  const useTickerStream = marketType === 'usdt-m' ? useFuturesTickerStream : useCoinMTickerStream
  const { isConnected: tickerConnected } = useTickerStream(symbol, handleTickerMessage, {
    enabled: !!symbol,
  })

  // 订阅标记价格
  const { isConnected: markPriceConnected } = useMarkPriceStream(
    symbol,
    handleMarkPriceMessage,
    {
      enabled: !!symbol && (showMarkPrice || showFundingRate),
      market: marketType === 'usdt-m' ? 'futures-usdt' : 'futures-coin',
    }
  )

  // 计算距离下次资金费时间
  const getNextFundingTimeStr = () => {
    if (!markPriceData?.nextFundingTime) return '-'
    const now = Date.now()
    const diff = markPriceData.nextFundingTime - now
    if (diff <= 0) return 'Soon'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (!ticker) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-24" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* 主价格行 */}
      <div className="flex items-center gap-3">
        {/* 最新价格 */}
        <span
          className={cn(
            'text-xl font-bold tabular-nums transition-colors duration-300',
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
              'text-sm font-medium tabular-nums',
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
            tickerConnected && markPriceConnected ? 'bg-up animate-pulse' : 'bg-muted'
          )}
          title={tickerConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* 标记价格和资金费率 */}
      {(showMarkPrice || showFundingRate) && markPriceData && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {showMarkPrice && (
            <>
              <span>
                {language === 'zh' ? '标记' : 'Mark'}:{' '}
                <span className="text-foreground tabular-nums">
                  {formatPrice(markPriceData.markPrice)}
                </span>
              </span>
              <span>
                {language === 'zh' ? '指数' : 'Index'}:{' '}
                <span className="text-foreground tabular-nums">
                  {formatPrice(markPriceData.indexPrice)}
                </span>
              </span>
            </>
          )}
          {showFundingRate && (
            <span>
              {language === 'zh' ? '资金费率' : 'Funding'}:{' '}
              <span
                className={cn(
                  'tabular-nums',
                  markPriceData.fundingRate >= 0 ? 'text-up' : 'text-down'
                )}
              >
                {(markPriceData.fundingRate * 100).toFixed(4)}%
              </span>
              <span className="ml-1 text-muted-foreground">
                ({getNextFundingTimeStr()})
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
