'use client'

import { useQuery } from '@tanstack/react-query'
import { getFundingRates, transformFundingRates, sortByFundingRate } from '@/lib/api/futures'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

/**
 * 资金费率 Widget
 * 显示资金费率极值（高正/高负）
 */
export function FundingRateWidget() {
  const language = useLanguage()

  const { data: fundingRates, isLoading } = useQuery({
    queryKey: ['fundingRates'],
    queryFn: async () => {
      const raw = await getFundingRates()
      return transformFundingRates(raw)
    },
    refetchInterval: 60000,
  })

  // 最高正费率和最高负费率各5个
  const highPositive = fundingRates
    ? sortByFundingRate(fundingRates.filter((r) => r.fundingRate > 0), true).slice(0, 5)
    : []

  const highNegative = fundingRates
    ? sortByFundingRate(fundingRates.filter((r) => r.fundingRate < 0), false).slice(0, 5)
    : []

  // 格式化资金费率
  const formatFundingRate = (rate: number) => {
    const percent = rate * 100
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(4)}%`
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
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
                {language === 'zh' ? '暂无' : 'None'}
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
                {language === 'zh' ? '暂无' : 'None'}
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
