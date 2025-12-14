'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { OpenInterestChart } from './OpenInterestChart'
import { LongShortRatioChart } from './LongShortRatioChart'
import { TopTraderRatioChart } from './TopTraderRatioChart'
import { MarketAnalysis } from './MarketAnalysis'
import { FundingRatePanel } from './FundingRatePanel'
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, Activity, Wallet, Users } from 'lucide-react'

interface IndicatorsPanelProps {
  symbol: string
  className?: string
}

type TabType = 'analysis' | 'oi' | 'lsRatio' | 'topTrader' | 'funding'

/**
 * 衍生品指标面板
 * 整合所有指标图表和走势分析
 */
export function IndicatorsPanel({ symbol, className }: IndicatorsPanelProps) {
  const language = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('analysis')
  const [isExpanded, setIsExpanded] = useState(true)

  const tabs: { id: TabType; label: string; labelZh: string; icon: React.ReactNode }[] = [
    { id: 'analysis', label: 'Analysis', labelZh: '走势分析', icon: <Activity className="h-4 w-4" /> },
    { id: 'oi', label: 'Open Interest', labelZh: '持仓量', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'lsRatio', label: 'L/S Ratio', labelZh: '多空比', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'topTrader', label: 'Top Traders', labelZh: '大户持仓', icon: <Users className="h-4 w-4" /> },
    { id: 'funding', label: 'Funding', labelZh: '资金费率', icon: <Wallet className="h-4 w-4" /> },
  ]

  return (
    <div className={cn('bg-card border border-border rounded-lg', className)}>
      {/* 头部 - 标签栏 */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setIsExpanded(true)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">
                {language === 'zh' ? tab.labelZh : tab.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 内容区 */}
      {isExpanded && (
        <div className="p-4">
          {activeTab === 'analysis' && (
            <MarketAnalysis symbol={symbol} />
          )}

          {activeTab === 'oi' && (
            <OpenInterestChart symbol={symbol} height={250} />
          )}

          {activeTab === 'lsRatio' && (
            <LongShortRatioChart symbol={symbol} height={250} />
          )}

          {activeTab === 'topTrader' && (
            <TopTraderRatioChart symbol={symbol} height={250} />
          )}

          {activeTab === 'funding' && (
            <FundingRatePanel maxItems={20} className="max-h-[350px]" />
          )}
        </div>
      )}
    </div>
  )
}
