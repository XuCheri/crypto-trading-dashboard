'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/store/ui'
import { FundingRatePanel } from '@/components/derivatives/FundingRatePanel'
import { OpenInterestChart } from '@/components/derivatives/OpenInterestChart'
import { LongShortRatioChart } from '@/components/derivatives/LongShortRatioChart'
import { TopTraderRatioChart } from '@/components/derivatives/TopTraderRatioChart'
import { Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 热门合约列表 */
const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
]

export default function DerivativesPage() {
  const language = useLanguage()
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            {language === 'zh' ? '衍生品指标' : 'Derivatives Analytics'}
          </h1>

          {/* 合约选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg hover:bg-accent/80"
            >
              <span className="font-semibold">{selectedSymbol}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showSymbolDropdown && 'rotate-180')} />
            </button>

            {showSymbolDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
                    {language === 'zh' ? '热门合约' : 'Popular'}
                  </div>
                  {POPULAR_SYMBOLS.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setSelectedSymbol(symbol)
                        setShowSymbolDropdown(false)
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors',
                        selectedSymbol === symbol && 'bg-accent text-primary'
                      )}
                    >
                      {symbol.replace('USDT', '')}
                      <span className="text-muted-foreground">/USDT</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {language === 'zh'
            ? '数据来源: Binance USDT-M 永续合约'
            : 'Data: Binance USDT-M Perpetual'}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* 资金费率排行 */}
          <div className="xl:col-span-1 xl:row-span-2">
            <FundingRatePanel maxItems={30} className="h-full" />
          </div>

          {/* 持仓量图表 */}
          <div className="xl:col-span-2">
            <OpenInterestChart symbol={selectedSymbol} height={280} />
          </div>

          {/* 多空比图表 */}
          <div>
            <LongShortRatioChart symbol={selectedSymbol} height={220} />
          </div>

          {/* 大户持仓比图表 */}
          <div>
            <TopTraderRatioChart symbol={selectedSymbol} height={220} />
          </div>
        </div>

        {/* 市场情绪总结 */}
        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-3">
            {language === 'zh' ? '指标说明' : 'Indicator Guide'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-primary mb-1">
                {language === 'zh' ? '资金费率' : 'Funding Rate'}
              </div>
              <p className="text-muted-foreground">
                {language === 'zh'
                  ? '正费率时，多头向空头支付费用；负费率时，空头向多头支付。极端费率可能预示价格反转。'
                  : 'Positive rate: longs pay shorts. Negative: shorts pay longs. Extreme rates may signal reversals.'}
              </p>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">
                {language === 'zh' ? '持仓量 (OI)' : 'Open Interest'}
              </div>
              <p className="text-muted-foreground">
                {language === 'zh'
                  ? '反映市场参与度。OI 上升伴随价格上涨通常看涨，OI 下降伴随价格下跌可能预示底部。'
                  : 'Measures market participation. Rising OI with price up is bullish. Falling OI with price down may signal bottom.'}
              </p>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">
                {language === 'zh' ? '多空比' : 'Long/Short Ratio'}
              </div>
              <p className="text-muted-foreground">
                {language === 'zh'
                  ? '散户情绪指标。极端多头偏向可能预示下跌，极端空头偏向可能预示上涨。'
                  : 'Retail sentiment indicator. Extreme long bias may signal drop, extreme short bias may signal rise.'}
              </p>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">
                {language === 'zh' ? '大户持仓比' : 'Top Trader Ratio'}
              </div>
              <p className="text-muted-foreground">
                {language === 'zh'
                  ? '大户（前 20%）的持仓方向。大户通常更有信息优势，其方向值得参考。'
                  : 'Position direction of top 20% traders. They usually have better information.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 点击外部关闭下拉框 */}
      {showSymbolDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSymbolDropdown(false)}
        />
      )}
    </div>
  )
}
