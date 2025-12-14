'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getFundingRates,
  getOpenInterestHist,
  getLongShortRatio,
  getTopTraderPositionRatio,
  getMarkPrice,
} from '@/lib/api/futures'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Users,
  Wallet,
  RefreshCw,
} from 'lucide-react'

interface MarketAnalysisProps {
  symbol: string
  className?: string
}

interface IndicatorSignal {
  name: string
  nameZh: string
  value: string
  signal: 'bullish' | 'bearish' | 'neutral'
  weight: number
  description: string
  descriptionZh: string
}

/**
 * 市场分析组件
 * 根据多项指标综合分析走势
 */
export function MarketAnalysis({ symbol, className }: MarketAnalysisProps) {
  const language = useLanguage()

  // 获取资金费率
  const { data: fundingData } = useQuery({
    queryKey: ['fundingRate', symbol],
    queryFn: async () => {
      const data = await getMarkPrice(symbol)
      return data[0]
    },
    enabled: !!symbol,
    staleTime: 30000,
  })

  // 获取持仓量历史
  const { data: oiData } = useQuery({
    queryKey: ['openInterestHist', symbol],
    queryFn: () => getOpenInterestHist(symbol, '1h', 24),
    enabled: !!symbol,
    staleTime: 60000,
  })

  // 获取多空比
  const { data: lsRatioData } = useQuery({
    queryKey: ['longShortRatio', symbol],
    queryFn: () => getLongShortRatio(symbol, '1h', 24),
    enabled: !!symbol,
    staleTime: 60000,
  })

  // 获取大户持仓比
  const { data: topTraderData } = useQuery({
    queryKey: ['topTraderRatio', symbol],
    queryFn: () => getTopTraderPositionRatio(symbol, '1h', 24),
    enabled: !!symbol,
    staleTime: 60000,
  })

  // 分析各项指标
  const indicators = useMemo((): IndicatorSignal[] => {
    const signals: IndicatorSignal[] = []

    // 1. 资金费率分析
    if (fundingData) {
      const rate = parseFloat(fundingData.lastFundingRate)
      const ratePercent = rate * 100

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      let description = ''
      let descriptionZh = ''

      if (rate > 0.001) {
        // 高正费率（>0.1%）- 多头拥挤，可能回调
        signal = 'bearish'
        description = 'High positive funding rate indicates crowded longs, potential pullback'
        descriptionZh = '资金费率偏高，多头拥挤，可能面临回调压力'
      } else if (rate > 0.0001) {
        // 正常正费率 - 多头占优
        signal = 'bullish'
        description = 'Moderate positive funding rate, healthy long bias'
        descriptionZh = '资金费率正常偏多，市场情绪偏向看涨'
      } else if (rate < -0.001) {
        // 高负费率（<-0.1%）- 空头拥挤，可能反弹
        signal = 'bullish'
        description = 'High negative funding rate indicates crowded shorts, potential bounce'
        descriptionZh = '资金费率偏负，空头拥挤，可能迎来反弹'
      } else if (rate < -0.0001) {
        // 正常负费率 - 空头占优
        signal = 'bearish'
        description = 'Negative funding rate, bearish sentiment'
        descriptionZh = '资金费率为负，市场情绪偏向看跌'
      } else {
        signal = 'neutral'
        description = 'Neutral funding rate, balanced market'
        descriptionZh = '资金费率中性，多空平衡'
      }

      signals.push({
        name: 'Funding Rate',
        nameZh: '资金费率',
        value: `${ratePercent >= 0 ? '+' : ''}${ratePercent.toFixed(4)}%`,
        signal,
        weight: 0.25,
        description,
        descriptionZh,
      })
    }

    // 2. 持仓量变化分析
    if (oiData && oiData.length >= 2) {
      const latest = parseFloat(oiData[oiData.length - 1].sumOpenInterestValue)
      const earlier = parseFloat(oiData[0].sumOpenInterestValue)
      const change = ((latest - earlier) / earlier) * 100

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      let description = ''
      let descriptionZh = ''

      if (change > 5) {
        signal = 'bullish'
        description = 'Significant OI increase, strong market participation'
        descriptionZh = '持仓量显著增加，市场参与度高，趋势可能延续'
      } else if (change > 0) {
        signal = 'neutral'
        description = 'Slight OI increase, normal market activity'
        descriptionZh = '持仓量小幅增加，市场活跃度正常'
      } else if (change < -5) {
        signal = 'bearish'
        description = 'Significant OI decrease, positions being closed'
        descriptionZh = '持仓量显著减少，资金在离场'
      } else {
        signal = 'neutral'
        description = 'Slight OI decrease, normal fluctuation'
        descriptionZh = '持仓量小幅减少，正常波动'
      }

      signals.push({
        name: 'Open Interest',
        nameZh: '持仓量变化',
        value: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        signal,
        weight: 0.2,
        description,
        descriptionZh,
      })
    }

    // 3. 多空比分析（散户）
    if (lsRatioData && lsRatioData.length > 0) {
      const latest = lsRatioData[lsRatioData.length - 1]
      const ratio = parseFloat(latest.longShortRatio)

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      let description = ''
      let descriptionZh = ''

      // 散户多空比通常是反向指标
      if (ratio > 2) {
        signal = 'bearish'
        description = 'Extreme long bias in retail, contrarian bearish signal'
        descriptionZh = '散户极度看多，逆向指标显示可能下跌'
      } else if (ratio > 1.2) {
        signal = 'neutral'
        description = 'Retail leaning long, watch for reversal'
        descriptionZh = '散户偏向看多，需警惕反转'
      } else if (ratio < 0.5) {
        signal = 'bullish'
        description = 'Extreme short bias in retail, contrarian bullish signal'
        descriptionZh = '散户极度看空，逆向指标显示可能上涨'
      } else if (ratio < 0.8) {
        signal = 'neutral'
        description = 'Retail leaning short, watch for bounce'
        descriptionZh = '散户偏向看空，可能迎来反弹'
      } else {
        signal = 'neutral'
        description = 'Balanced retail sentiment'
        descriptionZh = '散户多空情绪均衡'
      }

      signals.push({
        name: 'Long/Short Ratio',
        nameZh: '多空比（散户）',
        value: ratio.toFixed(2),
        signal,
        weight: 0.2,
        description,
        descriptionZh,
      })
    }

    // 4. 大户持仓比分析
    if (topTraderData && topTraderData.length > 0) {
      const latest = topTraderData[topTraderData.length - 1]
      const ratio = parseFloat(latest.longShortRatio)

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      let description = ''
      let descriptionZh = ''

      // 大户通常有信息优势，跟随大户方向
      if (ratio > 1.5) {
        signal = 'bullish'
        description = 'Top traders heavily long, smart money bullish'
        descriptionZh = '大户重仓做多，聪明钱看涨'
      } else if (ratio > 1.1) {
        signal = 'bullish'
        description = 'Top traders leaning long'
        descriptionZh = '大户偏向做多'
      } else if (ratio < 0.7) {
        signal = 'bearish'
        description = 'Top traders heavily short, smart money bearish'
        descriptionZh = '大户重仓做空，聪明钱看跌'
      } else if (ratio < 0.9) {
        signal = 'bearish'
        description = 'Top traders leaning short'
        descriptionZh = '大户偏向做空'
      } else {
        signal = 'neutral'
        description = 'Top traders balanced'
        descriptionZh = '大户多空平衡'
      }

      signals.push({
        name: 'Top Trader Ratio',
        nameZh: '大户持仓比',
        value: ratio.toFixed(2),
        signal,
        weight: 0.35,
        description,
        descriptionZh,
      })
    }

    return signals
  }, [fundingData, oiData, lsRatioData, topTraderData])

  // 综合判断
  const overallAnalysis = useMemo(() => {
    if (indicators.length === 0) {
      return {
        signal: 'neutral' as const,
        score: 0,
        summary: language === 'zh' ? '数据加载中...' : 'Loading data...',
        confidence: 0,
      }
    }

    let bullishScore = 0
    let bearishScore = 0
    let totalWeight = 0

    indicators.forEach((ind) => {
      totalWeight += ind.weight
      if (ind.signal === 'bullish') {
        bullishScore += ind.weight
      } else if (ind.signal === 'bearish') {
        bearishScore += ind.weight
      }
    })

    const netScore = (bullishScore - bearishScore) / totalWeight
    const confidence = Math.abs(netScore) * 100

    let signal: 'bullish' | 'bearish' | 'neutral'
    let summary: string

    if (netScore > 0.15) {
      signal = 'bullish'
      summary = language === 'zh'
        ? `${symbol.replace('USDT', '')} 整体偏向看涨。大户持仓和资金费率显示市场情绪积极，但需注意风险管理。`
        : `${symbol.replace('USDT', '')} shows bullish bias. Top trader positions and funding rates indicate positive sentiment. Maintain proper risk management.`
    } else if (netScore < -0.15) {
      signal = 'bearish'
      summary = language === 'zh'
        ? `${symbol.replace('USDT', '')} 整体偏向看跌。多项指标显示市场承压，建议谨慎操作，注意止损。`
        : `${symbol.replace('USDT', '')} shows bearish bias. Multiple indicators suggest market pressure. Exercise caution and maintain stop losses.`
    } else {
      signal = 'neutral'
      summary = language === 'zh'
        ? `${symbol.replace('USDT', '')} 当前多空分歧较大，市场处于震荡整理阶段，建议观望或轻仓操作。`
        : `${symbol.replace('USDT', '')} shows mixed signals. Market is in consolidation phase. Consider waiting or taking smaller positions.`
    }

    return { signal, score: netScore, summary, confidence }
  }, [indicators, symbol, language])

  const getSignalIcon = (signal: 'bullish' | 'bearish' | 'neutral') => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-up" />
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-down" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSignalColor = (signal: 'bullish' | 'bearish' | 'neutral') => {
    switch (signal) {
      case 'bullish':
        return 'text-up'
      case 'bearish':
        return 'text-down'
      default:
        return 'text-muted-foreground'
    }
  }

  const getIndicatorIcon = (name: string) => {
    switch (name) {
      case 'Funding Rate':
        return <Wallet className="h-4 w-4" />
      case 'Open Interest':
        return <BarChart3 className="h-4 w-4" />
      case 'Long/Short Ratio':
        return <Users className="h-4 w-4" />
      case 'Top Trader Ratio':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg', className)}>
      {/* 头部 - 综合判断 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {language === 'zh' ? '走势分析' : 'Market Analysis'}
          </h3>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              overallAnalysis.signal === 'bullish' && 'bg-up/20 text-up',
              overallAnalysis.signal === 'bearish' && 'bg-down/20 text-down',
              overallAnalysis.signal === 'neutral' && 'bg-muted text-muted-foreground'
            )}
          >
            {overallAnalysis.signal === 'bullish' && (
              <>
                <TrendingUp className="h-4 w-4" />
                {language === 'zh' ? '偏多' : 'Bullish'}
              </>
            )}
            {overallAnalysis.signal === 'bearish' && (
              <>
                <TrendingDown className="h-4 w-4" />
                {language === 'zh' ? '偏空' : 'Bearish'}
              </>
            )}
            {overallAnalysis.signal === 'neutral' && (
              <>
                <Minus className="h-4 w-4" />
                {language === 'zh' ? '中性' : 'Neutral'}
              </>
            )}
          </div>
        </div>

        {/* 综合分析文字 */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {overallAnalysis.summary}
        </p>

        {/* 置信度进度条 */}
        {indicators.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {language === 'zh' ? '信号强度' : 'Signal Strength'}
              </span>
              <span className={getSignalColor(overallAnalysis.signal)}>
                {overallAnalysis.confidence.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overallAnalysis.signal === 'bullish' && 'bg-up',
                  overallAnalysis.signal === 'bearish' && 'bg-down',
                  overallAnalysis.signal === 'neutral' && 'bg-muted-foreground'
                )}
                style={{ width: `${Math.min(overallAnalysis.confidence, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 各项指标详情 */}
      <div className="p-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">
          {language === 'zh' ? '指标详情' : 'Indicator Details'}
        </h4>
        <div className="space-y-3">
          {indicators.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              {language === 'zh' ? '加载中...' : 'Loading...'}
            </div>
          ) : (
            indicators.map((ind) => (
              <div key={ind.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50">
                <div className="mt-0.5 text-muted-foreground">
                  {getIndicatorIcon(ind.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {language === 'zh' ? ind.nameZh : ind.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm tabular-nums', getSignalColor(ind.signal))}>
                        {ind.value}
                      </span>
                      {getSignalIcon(ind.signal)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'zh' ? ind.descriptionZh : ind.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 风险提示 */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {language === 'zh'
              ? '以上分析仅供参考，不构成投资建议。市场有风险，投资需谨慎。'
              : 'This analysis is for reference only and does not constitute investment advice. Markets are risky, invest wisely.'}
          </span>
        </div>
      </div>
    </div>
  )
}
