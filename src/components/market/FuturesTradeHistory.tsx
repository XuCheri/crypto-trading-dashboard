'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  useBinanceStream,
  TradeStreamData,
} from '@/hooks/useBinanceStream'
import { streamNames, MessageHandler } from '@/lib/websocket/manager'
import { formatPrice, formatNumber, formatTime, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

interface FuturesTradeHistoryProps {
  symbol: string
  marketType: 'usdt-m' | 'coin-m'
  maxTrades?: number
  className?: string
}

interface Trade {
  id: number
  price: number
  quantity: number
  time: number
  isBuy: boolean
}

/**
 * 合约成交历史组件
 * 实时显示最新成交记录
 */
export function FuturesTradeHistory({
  symbol,
  marketType,
  maxTrades = 50,
  className,
}: FuturesTradeHistoryProps) {
  const language = useLanguage()
  const [trades, setTrades] = useState<Trade[]>([])
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null)

  // 用于防止重复添加
  const lastTradeIdRef = useRef<number>(0)

  // 处理成交数据
  const handleTrade = useCallback(
    (data: TradeStreamData) => {
      const tradeId = data.t

      // 防止重复
      if (tradeId <= lastTradeIdRef.current) return
      lastTradeIdRef.current = tradeId

      const newTrade: Trade = {
        id: tradeId,
        price: parseFloat(data.p),
        quantity: parseFloat(data.q),
        time: data.T,
        isBuy: !data.m, // m 为 true 时是卖方主动成交
      }

      // 更新价格方向
      if (lastPrice !== null) {
        if (newTrade.price > lastPrice) {
          setPriceDirection('up')
        } else if (newTrade.price < lastPrice) {
          setPriceDirection('down')
        }
      }
      setLastPrice(newTrade.price)

      // 添加新成交，保持最大数量限制
      setTrades((prev) => [newTrade, ...prev].slice(0, maxTrades))
    },
    [lastPrice, maxTrades]
  )

  // 根据市场类型订阅不同的 WebSocket
  const market = marketType === 'usdt-m' ? 'futures-usdt' : 'futures-coin'
  const streams = symbol ? [streamNames.trade(symbol)] : []
  const { isConnected } = useBinanceStream(streams, handleTrade as MessageHandler, {
    enabled: !!symbol,
    market,
  })

  // symbol 变化时清空数据
  useEffect(() => {
    setTrades([])
    setLastPrice(null)
    lastTradeIdRef.current = 0
  }, [symbol])

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="font-semibold text-sm">
          {language === 'zh' ? '成交历史' : 'Trade History'}
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
        <div className="text-right">{language === 'zh' ? '时间' : 'Time'}</div>
      </div>

      {/* 成交列表 */}
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '等待成交数据...' : 'Waiting for trades...'}
          </div>
        ) : (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-3 px-3 py-0.5 text-xs hover:bg-accent/50 transition-colors"
            >
              <div
                className={cn(
                  'tabular-nums',
                  trade.isBuy ? 'text-up' : 'text-down'
                )}
              >
                {formatPrice(trade.price)}
              </div>
              <div className="text-right tabular-nums">
                {formatNumber(trade.quantity, 4)}
              </div>
              <div className="text-right tabular-nums text-muted-foreground">
                {formatTime(trade.time, 'time')}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 最新价格汇总 */}
      {lastPrice && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {language === 'zh' ? '最新' : 'Last'}:
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums transition-colors',
                priceDirection === 'up' && 'text-up',
                priceDirection === 'down' && 'text-down'
              )}
            >
              {formatPrice(lastPrice)}
            </span>
            {priceDirection && (
              <span
                className={cn(
                  'text-xs',
                  priceDirection === 'up' ? 'text-up' : 'text-down'
                )}
              >
                {priceDirection === 'up' ? '▲' : '▼'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
