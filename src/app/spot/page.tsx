'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTicker24hr, transformTickers, filterUsdtPairs } from '@/lib/api/spot'
import { formatPrice, formatPercent, formatVolume, getPriceColorClass, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { useMarketStore } from '@/lib/store/market'
import { TickerPrice } from '@/components/market/TickerPrice'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { Orderbook } from '@/components/market/Orderbook'
import { TradeHistory } from '@/components/market/TradeHistory'
import { Search, ArrowUpDown, Star, X, ChevronDown } from 'lucide-react'

type SortField = 'symbol' | 'price' | 'change' | 'volume'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'list' | 'chart'

export default function SpotPage() {
  const language = useLanguage()
  const { selectedSymbol, setSelectedSymbol } = useMarketStore()

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('chart')

  // 搜索和排序状态
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 获取行情数据
  const { data: tickers, isLoading } = useQuery({
    queryKey: ['spotTickers'],
    queryFn: async () => {
      const raw = await getTicker24hr()
      return transformTickers(raw)
    },
    refetchInterval: 30000,
  })

  // 过滤和排序
  const filteredTickers = useMemo(() => {
    if (!tickers) return []
    return filterUsdtPairs(tickers)
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
        }
        return sortOrder === 'desc' ? -cmp : cmp
      })
  }, [tickers, search, sortField, sortOrder])

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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        {/* 交易对选择器 */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg hover:bg-accent/80"
              onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
            >
              <span className="font-semibold">{selectedSymbol || 'BTCUSDT'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* 实时价格 */}
          {selectedSymbol && (
            <div className="flex items-center gap-4">
              <TickerPrice symbol={selectedSymbol} showChange />
              {selectedTicker && (
                <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    24h H: <span className="text-foreground">{formatPrice(selectedTicker.high)}</span>
                  </span>
                  <span>
                    24h L: <span className="text-foreground">{formatPrice(selectedTicker.low)}</span>
                  </span>
                  <span>
                    Vol: <span className="text-foreground">${formatVolume(selectedTicker.quoteVolume)}</span>
                  </span>
                </div>
              )}
            </div>
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
          <div className="w-64 border-r border-border flex flex-col bg-card">
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

            {/* 交易对列表 */}
            <div className="flex-1 overflow-y-auto">
              {filteredTickers.slice(0, 100).map((ticker) => (
                <div
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
                    selectedSymbol === ticker.symbol && 'bg-accent'
                  )}
                >
                  <div className="font-medium text-sm">{ticker.symbol}</div>
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
                </div>
              ))}
            </div>
          </div>

          {/* 中间：图表 */}
          <div className="flex-1 flex flex-col bg-background">
            {selectedSymbol ? (
              <CandlestickChart
                symbol={selectedSymbol}
                height={500}
                showVolume
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {language === 'zh' ? '请选择交易对' : 'Select a trading pair'}
              </div>
            )}
          </div>

          {/* 右侧：订单簿和成交 */}
          <div className="w-72 border-l border-border flex flex-col bg-card">
            {selectedSymbol ? (
              <>
                <Orderbook symbol={selectedSymbol} rows={12} className="flex-1" />
                <TradeHistory symbol={selectedSymbol} maxTrades={30} className="h-64 border-t border-border" />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {language === 'zh' ? '请选择交易对' : 'Select a pair'}
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
                      {language === 'zh' ? '交易对' : 'Pair'}
                      <SortIcon field="symbol" current={sortField} order={sortOrder} />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('price')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      {language === 'zh' ? '价格' : 'Price'}
                      <SortIcon field="price" current={sortField} order={sortOrder} />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('change')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      24h %
                      <SortIcon field="change" current={sortField} order={sortOrder} />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium hidden sm:table-cell">24h High / Low</th>
                  <th className="text-right p-4 font-medium">
                    <button
                      onClick={() => toggleSort('volume')}
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                    >
                      {language === 'zh' ? '成交额' : 'Volume'}
                      <SortIcon field="volume" current={sortField} order={sortOrder} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
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
                        <span className="font-medium">{ticker.symbol}</span>
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
                      <td className="p-4 text-right tabular-nums text-sm text-muted-foreground hidden sm:table-cell">
                        {formatPrice(ticker.high)} / {formatPrice(ticker.low)}
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

/** 排序图标 */
function SortIcon({
  field,
  current,
  order,
}: {
  field: SortField
  current: SortField
  order: SortOrder
}) {
  if (field !== current) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
  }
  return <ArrowUpDown className={cn('h-3 w-3', order === 'asc' ? 'rotate-180' : '')} />
}
