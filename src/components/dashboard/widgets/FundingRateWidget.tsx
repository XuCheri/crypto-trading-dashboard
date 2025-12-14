'use client'

import { useState, useCallback, useRef } from 'react'
import { useMarkPriceStream, MarkPriceStreamData } from '@/hooks/useBinanceStream'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { Wifi, WifiOff } from 'lucide-react'

interface FundingRateItem {
  symbol: string
  fundingRate: number
}

/**
 * 资金费率 Widget（纯 WebSocket 模式）
 * 显示资金费率极值（高正/高负）
 */
export function FundingRateWidget() {
  const language = useLanguage()
  const [isConnected, setIsConnected] = useState(false)
  const dataRef = useRef<Map<string, FundingRateItem>>(new Map())
  const [highPositive, setHighPositive] = useState<FundingRateItem[]>([])
  const [highNegative, setHighNegative] = useState<FundingRateItem[]>([])

  // 处理标记价格消息
  const handleMarkPriceUpdate = useCallback((data: MarkPriceStreamData | MarkPriceStreamData[]) => {
    setIsConnected(true)
    const items = Array.isArray(data) ? data : [data]

    items.forEach((item) => {
      if (item.s.endsWith('USDT')) {
        dataRef.current.set(item.s, {
          symbol: item.s,
          fundingRate: parseFloat(item.r),
        })
      }
    })

    // 计算高正/高负费率
    const allRates = Array.from(dataRef.current.values())

    const positive = allRates
      .filter((r) => r.fundingRate > 0)
      .sort((a, b) => b.fundingRate - a.fundingRate)
      .slice(0, 5)

    const negative = allRates
      .filter((r) => r.fundingRate < 0)
      .sort((a, b) => a.fundingRate - b.fundingRate)
      .slice(0, 5)

    setHighPositive(positive)
    setHighNegative(negative)
  }, [])

  // 订阅全市场标记价格
  useMarkPriceStream(handleMarkPriceUpdate, { enabled: true })

  // 格式化资金费率
  const formatFundingRate = (rate: number) => {
    const percent = rate * 100
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(4)}%`
  }

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
      {/* 连接状态 */}
      <div className="flex items-center justify-end px-3 pt-2 gap-1 text-xs text-green-500">
        <Wifi className="h-3 w-3" />
        <span>{language === 'zh' ? '实时' : 'Live'}</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 p-3">
        {/* 高正费率 */}
        <div className="bg-up/5 rounded-lg p-2">
          <div className="text-xs text-up mb-2 font-medium">
            {language === 'zh' ? '高正费率' : 'High Positive'}
          </div>
          <div className="space-y-1">
            {highPositive.map((rate) => (
              <div
                key={rate.symbol}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium">{rate.symbol.replace('USDT', '')}</span>
                <span className="text-up tabular-nums">{formatFundingRate(rate.fundingRate)}</span>
              </div>
            ))}
            {highPositive.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                {language === 'zh' ? '等待数据' : 'Waiting'}
              </div>
            )}
          </div>
        </div>

        {/* 高负费率 */}
        <div className="bg-down/5 rounded-lg p-2">
          <div className="text-xs text-down mb-2 font-medium">
            {language === 'zh' ? '高负费率' : 'High Negative'}
          </div>
          <div className="space-y-1">
            {highNegative.map((rate) => (
              <div
                key={rate.symbol}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium">{rate.symbol.replace('USDT', '')}</span>
                <span className="text-down tabular-nums">{formatFundingRate(rate.fundingRate)}</span>
              </div>
            ))}
            {highNegative.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                {language === 'zh' ? '等待数据' : 'Waiting'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
        {language === 'zh' ? '正费率: 多付空 | 负费率: 空付多' : 'Positive: Long pays | Negative: Short pays'}
      </div>
    </div>
  )
}
