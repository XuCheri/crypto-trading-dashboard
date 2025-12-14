/**
 * 市场状态管理 (Zustand)
 *
 * 管理:
 * - 当前选中的交易对
 * - 行情数据缓存
 * - K 线周期设置
 */

import { create } from 'zustand'
import { TickerData, CandlestickData, KlineInterval } from '../api/types'

/** 市场状态接口 */
interface MarketState {
  // ============ 状态 ============

  /** 当前选中的交易对 */
  selectedSymbol: string

  /** 当前市场类型 */
  marketType: 'spot' | 'futures'

  /** 当前 K 线周期 */
  klineInterval: KlineInterval

  /** 行情数据缓存 (symbol -> TickerData) */
  tickers: Map<string, TickerData>

  /** 最后更新时间 */
  lastTickerUpdate: number

  // ============ Actions ============

  /** 设置选中的交易对 */
  setSelectedSymbol: (symbol: string) => void

  /** 设置市场类型 */
  setMarketType: (type: 'spot' | 'futures') => void

  /** 设置 K 线周期 */
  setKlineInterval: (interval: KlineInterval) => void

  /** 更新单个行情 */
  updateTicker: (symbol: string, data: Partial<TickerData>) => void

  /** 批量更新行情 */
  updateTickers: (tickers: TickerData[]) => void

  /** 获取行情数据 */
  getTicker: (symbol: string) => TickerData | undefined

  /** 获取所有行情 */
  getAllTickers: () => TickerData[]

  /** 清除行情缓存 */
  clearTickers: () => void
}

/** 创建市场状态 Store */
export const useMarketStore = create<MarketState>((set, get) => ({
  // 初始状态
  selectedSymbol: 'BTCUSDT',
  marketType: 'spot',
  klineInterval: '1h',
  tickers: new Map(),
  lastTickerUpdate: 0,

  // Actions
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  setMarketType: (type) => set({ marketType: type }),

  setKlineInterval: (interval) => set({ klineInterval: interval }),

  updateTicker: (symbol, data) => {
    const tickers = new Map(get().tickers)
    const existing = tickers.get(symbol)
    tickers.set(symbol, { ...existing, ...data } as TickerData)
    set({ tickers, lastTickerUpdate: Date.now() })
  },

  updateTickers: (newTickers) => {
    const tickers = new Map(get().tickers)
    newTickers.forEach((ticker) => {
      tickers.set(ticker.symbol, ticker)
    })
    set({ tickers, lastTickerUpdate: Date.now() })
  },

  getTicker: (symbol) => get().tickers.get(symbol),

  getAllTickers: () => Array.from(get().tickers.values()),

  clearTickers: () => set({ tickers: new Map() }),
}))

// ============ 选择器 Hooks ============

/** 获取当前选中的交易对 */
export const useSelectedSymbol = () => useMarketStore((state) => state.selectedSymbol)

/** 获取当前市场类型 */
export const useMarketType = () => useMarketStore((state) => state.marketType)

/** 获取当前 K 线周期 */
export const useKlineInterval = () => useMarketStore((state) => state.klineInterval)

/** 获取指定交易对的行情 */
export const useTicker = (symbol: string) =>
  useMarketStore((state) => state.tickers.get(symbol))

/** 获取当前选中交易对的行情 */
export const useSelectedTicker = () =>
  useMarketStore((state) => state.tickers.get(state.selectedSymbol))

/** 获取所有行情数据 */
export const useAllTickers = () =>
  useMarketStore((state) => Array.from(state.tickers.values()))

/** 获取 USDT 交易对行情 */
export const useUsdtTickers = () =>
  useMarketStore((state) =>
    Array.from(state.tickers.values()).filter((t) => t.symbol.endsWith('USDT'))
  )
