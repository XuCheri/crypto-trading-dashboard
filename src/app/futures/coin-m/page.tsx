'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getCoinMTicker24hr,
  getCoinMMarkPrice,
  transformFuturesTickers,
  filterCoinPerp,
  FuturesTickerData,
} from '@/lib/api/futures'
import { formatPrice, formatPercent, formatVolume, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { FuturesTickerPrice } from '@/components/market/FuturesTickerPrice'
import { FuturesCandlestickChart } from '@/components/charts/FuturesCandlestickChart'
import { FuturesOrderbook } from '@/components/market/FuturesOrderbook'
import { FuturesTradeHistory } from '@/components/market/FuturesTradeHistory'
import { FundingRatePanel } from '@/components/derivatives/FundingRatePanel'
import { Search, ChevronDown, Activity } from 'lucide-react'

type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'fundingRate'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'list' | 'chart'

export default function CoinMFuturesPage() {
  const language = useLanguage()

  // 选中的交易对
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSD_PERP')

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('chart')

  // 搜索和排序状态
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 获取合约行情数据
  const { data: tickersData, isLoading: tickersLoading } = useQuery({
    queryKey: ['futuresTickers', 'coin-m'],
    queryFn: async () => {
      const [tickers, markPrices] = await Promise.all([
        getCoinMTicker24hr(),
        getCoinMMarkPrice(),
      ])
      return transformFuturesTickers(tickers, markPrices)
    },
    refetchInterval: 30000,
  })

  // 过滤和排序
  const filteredTickers = useMemo(() => {
    if (!tickersData) return []
    return filterCoinPerp(tickersData)
      .filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let cmp = 0
        switch (sortField) {
          case 'symbol':
            cmp = a.symbol.localeCompare(b.symbol)
            break
          case 'price':
            cmp = a.price - b.price
            break
          case 'change':
            cmp = a.priceChangePercent - b.priceChangePercent
            break
          case 'volume':
            cmp = a.quoteVolume - b.quoteVolume
            break
          case 'fundingRate':
            cmp = (a.fundingRate || 0) - (b.fundingRate || 0)
            break
        }
        return sortOrder === 'desc' ? -cmp : cmp
      })
  }, [tickersData, search, sortField, sortOrder])

  // 切换排序
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // 当前选中的 ticker 信息
  const selectedTicker = useMemo(
    () => filteredTickers.find((t) => t.symbol === selectedSymbol),
    [filteredTickers, selectedSymbol]
  )

  // 格式化 COIN-M 交易对显示
  const formatCoinMSymbol = (symbol: string) => {
    // BTCUSD_PERP -> BTC
    return symbol.replace('USD_PERP', '')
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
        {/* 交易对选择器 */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg hover:bg-accent/80"
              onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
            >
              <span className="font-semibold">{selectedSymbol}</span>
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-yellow-500/20 rounded">
                COIN-M
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* 实时价格 */}
          {selectedSymbol && (
            <FuturesTickerPrice
              symbol={selectedSymbol}
              marketType="coin-m"
              showChange
              showMarkPrice
              showFundingRate
            />
          )}
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={cn(
              'px-3 py-1.5 text-sm rounded',
              viewMode === 'chart'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {language === 'zh' ? '图表' : 'Chart'}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-sm rounded',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {language === 'zh' ? '列表' : 'List'}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      {viewMode === 'chart' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：交易对列表 */}
          <div className="w-64 border-r border-border flex flex-col bg-card flex-shrink-0">
            {/* 搜索 */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={language === 'zh' ? '搜索...' : 'Search...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 表头 */}
            <div className="grid grid-cols-3 px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
              <div>{language === 'zh' ? '合约' : 'Contract'}</div>
              <div className="text-right">{language === 'zh' ? '价格' : 'Price'}</div>
              <div className="text-right">{language === 'zh' ? '费率' : 'Rate'}</div>
            </div>

            {/* 交易对列表 */}
            <div className="flex-1 overflow-y-auto">
              {filteredTickers.slice(0, 100).map((ticker) => (
                <div
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  className={cn(
                    'grid grid-cols-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
                    selectedSymbol === ticker.symbol && 'bg-accent'
                  )}
                >
                  <div className="font-medium text-sm">{formatCoinMSymbol(ticker.symbol)}</div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums">{formatPrice(ticker.price)}</div>
                    <div
                      className={cn(
                        'text-xs tabular-nums',
                        getPriceColorClass(ticker.priceChangePercent)
                      )}
                    >
                      {formatPercent(ticker.priceChangePercent)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-sm tabular-nums',
                        (ticker.fundingRate || 0) >= 0 ? 'text-up' : 'text-down'
                      )}
                    >
                      {ticker.fundingRate ? `${(ticker.fundingRate * 100).toFixed(4)}%` : '-'}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTickers.length === 0 && !tickersLoading && (
                <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                  {language === 'zh' ? '暂无数据' : 'No data'}
                </div>
              )}
            </div>
          </div>

          {/* 中间：图表和资金费率 */}
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {selectedSymbol ? (
              <>
                {/* K线图表 */}
                <div className="flex-shrink-0">
                  <FuturesCandlestickChart
                    symbol={selectedSymbol}
                    marketType="coin-m"
                    height={380}
                    showVolume
                  />
                </div>

                {/* 资金费率面板 (COIN-M 不支持其他衍生品指标 API) */}
                <div className="flex-1 overflow-y-auto p-4 border-t border-border">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4" />
                      <h3 className="font-semibold">
                        {language === 'zh' ? '市场概览' : 'Market Overview'}
                      </h3>
                    </div>

                    {selectedTicker && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'zh' ? '最新价格' : 'Last Price'}
                          </div>
                          <div className="text-lg font-semibold tabular-nums">
                            ${formatPrice(selectedTicker.price)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'zh' ? '24h 涨跌' : '24h Change'}
                          </div>
                          <div className={cn(
                            'text-lg font-semibold tabular-nums',
                            getPriceColorClass(selectedTicker.priceChangePercent)
                          )}>
                            {formatPercent(selectedTicker.priceChangePercent)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'zh' ? '资金费率' : 'Funding Rate'}
                          </div>
                          <div className={cn(
                            'text-lg font-semibold tabular-nums',
                            (selectedTicker.fundingRate || 0) >= 0 ? 'text-up' : 'text-down'
                          )}>
                            {selectedTicker.fundingRate
                              ? `${(selectedTicker.fundingRate * 100).toFixed(4)}%`
                              : '-'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'zh' ? '24h 成交额' : '24h Volume'}
                          </div>
                          <div className="text-lg font-semibold tabular-nums">
                            ${formatVolume(selectedTicker.quoteVolume)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      {language === 'zh'
                        ? 'COIN-M 合约使用加密货币作为保证金，适合长期持有现货的用户进行套保。正资金费率时做空可获得费率收益。'
                        : 'COIN-M contracts use cryptocurrency as margin, suitable for hedging spot holdings. Going short during positive funding rates earns funding.'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {language === 'zh' ? '请选择合约' : 'Select a contract'}
              </div>
            )}
          </div>

          {/* 右侧：订单簿和成交 */}
          <div className="w-64 border-l border-border flex flex-col bg-card flex-shrink-0">
            {selectedSymbol ? (
              <>
                <FuturesOrderbook
                  symbol={selectedSymbol}
                  marketType="coin-m"
                  rows={10}
                  className="flex-1"
                />
                <FuturesTradeHistory
                  symbol={selectedSymbol}
                  marketType="coin-m"
                  maxTrades={20}
                  className="h-48 border-t border-border"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {language === 'zh' ? '请选择合约' : 'Select a contract'}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 列表视图 */
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium">
                    <button
                      onClick={() => toggleSort('symbol')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {language === 'zh' ? '合约' : 'Contract'}
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('price')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      {language === 'zh' ? '价格' : 'Price'}
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('change')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      24h %
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    {language === 'zh' ? '标记价格' : 'Mark Price'}
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('fundingRate')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      {language === 'zh' ? '资金费率' : 'Funding'}
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('volume')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      {language === 'zh' ? '成交额' : 'Volume'}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickersLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {language === 'zh' ? '加载中...' : 'Loading...'}
                    </td>
                  </tr>
                ) : (
                  filteredTickers.slice(0, 100).map((ticker) => (
                    <tr
                      key={ticker.symbol}
                      onClick={() => {
                        setSelectedSymbol(ticker.symbol)
                        setViewMode('chart')
                      }}
                      className={cn(
                        'border-b border-border hover:bg-accent cursor-pointer transition-colors',
                        selectedSymbol === ticker.symbol && 'bg-accent'
                      )}
                    >
                      <td className="p-4">
                        <span className="font-medium">{formatCoinMSymbol(ticker.symbol)}</span>
                        <span className="text-xs text-muted-foreground ml-1">USD</span>
                      </td>
                      <td className="p-4 text-right tabular-nums">{formatPrice(ticker.price)}</td>
                      <td
                        className={cn(
                          'p-4 text-right tabular-nums',
                          getPriceColorClass(ticker.priceChangePercent)
                        )}
                      >
                        {formatPercent(ticker.priceChangePercent)}
                      </td>
                      <td className="p-4 text-right tabular-nums text-muted-foreground">
                        {ticker.markPrice ? formatPrice(ticker.markPrice) : '-'}
                      </td>
                      <td
                        className={cn(
                          'p-4 text-right tabular-nums',
                          (ticker.fundingRate || 0) >= 0 ? 'text-up' : 'text-down'
                        )}
                      >
                        {ticker.fundingRate ? `${(ticker.fundingRate * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className="p-4 text-right tabular-nums">${formatVolume(ticker.quoteVolume)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
