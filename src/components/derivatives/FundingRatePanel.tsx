'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getFundingRates,
  transformFundingRates,
  sortByFundingRate,
  filterPositiveFunding,
  filterNegativeFunding,
} from '@/lib/api/futures'
import { FundingRateData } from '@/lib/api/types'
import { formatPrice, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { ArrowUpDown, TrendingUp, TrendingDown, Search } from 'lucide-react'

interface FundingRatePanelProps {
  className?: string
  maxItems?: number
}

type FilterMode = 'all' | 'positive' | 'negative'
type SortMode = 'rate' | 'annualized'

/**
 * 资金费率面板
 * 显示所有合约的资金费率排名
 */
export function FundingRatePanel({
  className,
  maxItems = 50,
}: FundingRatePanelProps) {
  const language = useLanguage()
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [sortDesc, setSortDesc] = useState(true)

  // 获取资金费率数据
  const { data: fundingRates, isLoading } = useQuery({
    queryKey: ['fundingRates'],
    queryFn: async () => {
      const raw = await getFundingRates()
      return transformFundingRates(raw)
    },
    refetchInterval: 60000, // 每分钟刷新
  })

  // 过滤和排序
  const filteredRates = useMemo(() => {
    if (!fundingRates) return []

    let filtered = fundingRates.filter((r) =>
      r.symbol.toLowerCase().includes(search.toLowerCase())
    )

    // 按正负过滤
    if (filterMode === 'positive') {
      filtered = filterPositiveFunding(filtered)
    } else if (filterMode === 'negative') {
      filtered = filterNegativeFunding(filtered)
    }

    // 排序
    return sortByFundingRate(filtered, sortDesc).slice(0, maxItems)
  }, [fundingRates, search, filterMode, sortDesc, maxItems])

  // 统计信息
  const stats = useMemo(() => {
    if (!fundingRates) return null

    const positive = fundingRates.filter((r) => r.fundingRate > 0).length
    const negative = fundingRates.filter((r) => r.fundingRate < 0).length
    const avgRate =
      fundingRates.reduce((sum, r) => sum + r.fundingRate, 0) / fundingRates.length

    return { positive, negative, avgRate, total: fundingRates.length }
  }, [fundingRates])

  // 格式化资金费率
  const formatFundingRate = (rate: number) => {
    const percent = rate * 100
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(4)}%`
  }

  // 格式化年化费率
  const formatAnnualized = (rate: number) => {
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
  }

  // 获取下次资金费时间
  const getNextFundingTime = (timestamp: number) => {
    const now = Date.now()
    const diff = timestamp - now
    if (diff <= 0) return language === 'zh' ? '即将' : 'Soon'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {language === 'zh' ? '资金费率排行' : 'Funding Rate Rankings'}
          </h3>
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-up">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                {stats.positive}
              </span>
              <span className="text-down">
                <TrendingDown className="inline h-3 w-3 mr-1" />
                {stats.negative}
              </span>
              <span className="text-muted-foreground">
                {language === 'zh' ? '平均' : 'Avg'}: {formatFundingRate(stats.avgRate)}
              </span>
            </div>
          )}
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={language === 'zh' ? '搜索合约...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                filterMode === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {language === 'zh' ? '全部' : 'All'}
            </button>
            <button
              onClick={() => setFilterMode('positive')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                filterMode === 'positive'
                  ? 'bg-up text-white'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {language === 'zh' ? '正' : '+'}
            </button>
            <button
              onClick={() => setFilterMode('negative')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                filterMode === 'negative'
                  ? 'bg-down text-white'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {language === 'zh' ? '负' : '-'}
            </button>
          </div>
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
            title={sortDesc ? 'Descending' : 'Ascending'}
          >
            <ArrowUpDown className={cn('h-4 w-4', !sortDesc && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <div>{language === 'zh' ? '合约' : 'Contract'}</div>
        <div className="text-right">{language === 'zh' ? '资金费率' : 'Funding'}</div>
        <div className="text-right">{language === 'zh' ? '年化' : 'APR'}</div>
        <div className="text-right">{language === 'zh' ? '结算' : 'Next'}</div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            {language === 'zh' ? '暂无数据' : 'No data'}
          </div>
        ) : (
          filteredRates.map((rate) => (
            <div
              key={rate.symbol}
              className="grid grid-cols-4 px-4 py-2 text-sm hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="font-medium">{rate.symbol.replace('USDT', '')}</div>
              <div
                className={cn(
                  'text-right tabular-nums font-medium',
                  rate.fundingRate >= 0 ? 'text-up' : 'text-down'
                )}
              >
                {formatFundingRate(rate.fundingRate)}
              </div>
              <div
                className={cn(
                  'text-right tabular-nums',
                  rate.annualizedRate >= 0 ? 'text-up' : 'text-down'
                )}
              >
                {formatAnnualized(rate.annualizedRate)}
              </div>
              <div className="text-right tabular-nums text-muted-foreground">
                {getNextFundingTime(rate.fundingTime)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部说明 */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {language === 'zh'
          ? '正资金费率：多头向空头支付 | 负资金费率：空头向多头支付'
          : 'Positive: Longs pay shorts | Negative: Shorts pay longs'}
      </div>
    </div>
  )
}
