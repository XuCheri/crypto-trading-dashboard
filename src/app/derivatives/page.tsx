'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/store/ui'
import { FundingRatePanel } from '@/components/derivatives/FundingRatePanel'
import { OpenInterestChart } from '@/components/derivatives/OpenInterestChart'
import { LongShortRatioChart } from '@/components/derivatives/LongShortRatioChart'
import { TopTraderRatioChart } from '@/components/derivatives/TopTraderRatioChart'
import { Info, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']

export default function DerivativesPage() {
  const language = useLanguage()
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            {language === 'zh' ? '衍生品指标' : 'Derivatives Analytics'}
          </h1>

          {/* 交易对选择 */}
          <div className="flex items-center gap-1">
            {SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded transition-colors',
                  selectedSymbol === sym
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {sym.replace('USDT', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wifi className="h-4 w-4 text-green-500" />
          {language === 'zh' ? '数据来源: REST API + WebSocket' : 'Data: REST API + WebSocket'}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 资金费率排行 */}
          <div className="lg:col-span-1">
            <FundingRatePanel maxItems={30} className="h-[450px]" />
          </div>

          {/* 持仓量 */}
          <div className="lg:col-span-1">
            <OpenInterestChart symbol={selectedSymbol} height={350} />
          </div>

          {/* 多空比 */}
          <div className="lg:col-span-1">
            <LongShortRatioChart symbol={selectedSymbol} height={280} />
          </div>

          {/* 大户持仓比 */}
          <div className="lg:col-span-1">
            <TopTraderRatioChart symbol={selectedSymbol} height={280} />
          </div>
        </div>

        {/* 指标说明 */}
        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            {language === 'zh' ? '指标说明' : 'Indicator Guide'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                {language === 'zh' ? '持仓量' : 'Open Interest'}
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
    </div>
  )
}
