/**
 * Binance WebSocket 订阅 Hook
 *
 * 功能:
 * - 自动订阅/取消订阅
 * - 组件卸载时自动清理
 * - 支持多个流
 * - 连接状态管理
 */

'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import {
  wsManager,
  MarketType,
  ConnectionState,
  MessageHandler,
  streamNames,
} from '@/lib/websocket/manager'

/** Hook 配置选项 */
interface UseBinanceStreamOptions {
  /** 是否启用（默认 true） */
  enabled?: boolean
  /** 市场类型（默认 spot） */
  market?: MarketType
}

/** Hook 返回值 */
interface UseBinanceStreamResult {
  /** 连接状态 */
  connectionState: ConnectionState
  /** 是否已连接 */
  isConnected: boolean
  /** 是否正在重连 */
  isReconnecting: boolean
}

/**
 * 订阅 Binance WebSocket 数据流
 *
 * @param streams - 流名称数组
 * @param onMessage - 消息处理函数
 * @param options - 配置选项
 *
 * @example
 * ```tsx
 * // 订阅 BTC/USDT ticker
 * useBinanceStream(
 *   ['btcusdt@ticker'],
 *   (data) => console.log(data),
 *   { market: 'spot' }
 * )
 *
 * // 使用 streamNames 工具
 * useBinanceStream(
 *   [streamNames.ticker('BTCUSDT'), streamNames.kline('BTCUSDT', '1h')],
 *   handleMessage
 * )
 * ```
 */
export function useBinanceStream(
  streams: string[],
  onMessage: MessageHandler,
  options: UseBinanceStreamOptions = {}
): UseBinanceStreamResult {
  const { enabled = true, market = 'spot' } = options

  // 连接状态
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    wsManager.getState(market)
  )

  // 使用 ref 保存最新的 onMessage，避免重复订阅
  const messageHandlerRef = useRef(onMessage)
  messageHandlerRef.current = onMessage

  // 稳定的消息处理函数
  const stableHandler = useCallback<MessageHandler>((data) => {
    messageHandlerRef.current(data)
  }, [])

  // 订阅/取消订阅
  useEffect(() => {
    if (!enabled || streams.length === 0) {
      return
    }

    // 订阅
    wsManager.subscribe(market, streams, stableHandler)

    // 清理函数
    return () => {
      wsManager.unsubscribe(market, streams, stableHandler)
    }
  }, [enabled, market, streams.join(','), stableHandler])

  // 监听连接状态变化
  useEffect(() => {
    const unsubscribe = wsManager.onStateChange((changedMarket, state) => {
      if (changedMarket === market) {
        setConnectionState(state)
      }
    })

    return unsubscribe
  }, [market])

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
  }
}

/**
 * 订阅单个交易对的 ticker
 */
export function useTickerStream(
  symbol: string,
  onMessage: (data: TickerStreamData) => void,
  options: UseBinanceStreamOptions = {}
) {
  const streams = symbol ? [streamNames.ticker(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, options)
}

/**
 * 订阅 K 线数据
 */
export function useKlineStream(
  symbol: string,
  interval: string,
  onMessage: (data: KlineStreamData) => void,
  options: UseBinanceStreamOptions = {}
) {
  const streams = symbol ? [streamNames.kline(symbol, interval)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, options)
}

/**
 * 订阅深度数据
 */
export function useDepthStream(
  symbol: string,
  onMessage: (data: DepthStreamData) => void,
  options: UseBinanceStreamOptions = {}
) {
  const streams = symbol ? [streamNames.depth(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, options)
}

/**
 * 订阅成交数据
 */
export function useTradeStream(
  symbol: string,
  onMessage: (data: TradeStreamData) => void,
  options: UseBinanceStreamOptions = {}
) {
  const streams = symbol ? [streamNames.trade(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, options)
}

// ============ WebSocket 数据类型 ============

/** Ticker 流数据 */
export interface TickerStreamData {
  e: string // 事件类型
  E: number // 事件时间
  s: string // 交易对
  p: string // 价格变化
  P: string // 价格变化百分比
  w: string // 加权平均价
  c: string // 最新价格
  Q: string // 最新成交量
  o: string // 开盘价
  h: string // 最高价
  l: string // 最低价
  v: string // 成交量
  q: string // 成交额
  O: number // 统计开始时间
  C: number // 统计结束时间
  F: number // 首笔成交 ID
  L: number // 末笔成交 ID
  n: number // 成交笔数
}

/** K 线流数据 */
export interface KlineStreamData {
  e: string // 事件类型
  E: number // 事件时间
  s: string // 交易对
  k: {
    t: number // K线开始时间
    T: number // K线结束时间
    s: string // 交易对
    i: string // K线间隔
    f: number // 第一笔成交ID
    L: number // 最后一笔成交ID
    o: string // 开盘价
    c: string // 收盘价
    h: string // 最高价
    l: string // 最低价
    v: string // 成交量
    n: number // 成交笔数
    x: boolean // 是否完结
    q: string // 成交额
    V: string // 主动买入成交量
    Q: string // 主动买入成交额
  }
}

/** 深度流数据 */
export interface DepthStreamData {
  e: string // 事件类型
  E: number // 事件时间
  s: string // 交易对
  U: number // 第一个更新ID
  u: number // 最后一个更新ID
  b: [string, string][] // 买单 [价格, 数量]
  a: [string, string][] // 卖单 [价格, 数量]
}

/** 成交流数据 */
export interface TradeStreamData {
  e: string // 事件类型
  E: number // 事件时间
  s: string // 交易对
  t: number // 成交ID
  p: string // 成交价格
  q: string // 成交数量
  b: number // 买方订单ID
  a: number // 卖方订单ID
  T: number // 成交时间
  m: boolean // 是否是买方
}

/** 标记价格流数据 */
export interface MarkPriceStreamData {
  e: string // 事件类型
  E: number // 事件时间
  s: string // 交易对
  p: string // 标记价格
  i: string // 指数价格
  P: string // 预估结算价
  r: string // 资金费率
  T: number // 下次资金费时间
}

// ============ 合约专用 Hooks ============

/**
 * 订阅单个合约标记价格
 */
export function useSingleMarkPriceStream(
  symbol: string,
  onMessage: (data: MarkPriceStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> & { market?: 'futures-usdt' | 'futures-coin' } = {}
) {
  const { market = 'futures-usdt', ...rest } = options
  const streams = symbol ? [streamNames.markPrice(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...rest, market })
}

/**
 * 订阅全市场标记价格（包含资金费率）
 * 使用 !markPrice@arr 流获取所有合约的标记价格
 */
export function useMarkPriceStream(
  onMessage: (data: MarkPriceStreamData | MarkPriceStreamData[]) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> & { market?: 'futures-usdt' | 'futures-coin' } = {}
) {
  const { market = 'futures-usdt', ...rest } = options
  // 使用全市场标记价格流
  const streams = ['!markPrice@arr@1s']
  return useBinanceStream(streams, onMessage as MessageHandler, { ...rest, market })
}

/**
 * 订阅 USDT-M 合约 Ticker
 */
export function useFuturesTickerStream(
  symbol: string,
  onMessage: (data: TickerStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.ticker(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-usdt' })
}

/**
 * 订阅 USDT-M 合约 K 线
 */
export function useFuturesKlineStream(
  symbol: string,
  interval: string,
  onMessage: (data: KlineStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.kline(symbol, interval)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-usdt' })
}

/**
 * 订阅 USDT-M 合约深度
 */
export function useFuturesDepthStream(
  symbol: string,
  onMessage: (data: DepthStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.depth(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-usdt' })
}

/**
 * 订阅 USDT-M 合约成交
 */
export function useFuturesTradeStream(
  symbol: string,
  onMessage: (data: TradeStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.trade(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-usdt' })
}

/**
 * 订阅 COIN-M 合约 Ticker
 */
export function useCoinMTickerStream(
  symbol: string,
  onMessage: (data: TickerStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.ticker(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-coin' })
}

/**
 * 订阅 COIN-M 合约 K 线
 */
export function useCoinMKlineStream(
  symbol: string,
  interval: string,
  onMessage: (data: KlineStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.kline(symbol, interval)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-coin' })
}

/**
 * 订阅 COIN-M 合约深度
 */
export function useCoinMDepthStream(
  symbol: string,
  onMessage: (data: DepthStreamData) => void,
  options: Omit<UseBinanceStreamOptions, 'market'> = {}
) {
  const streams = symbol ? [streamNames.depth(symbol)] : []
  return useBinanceStream(streams, onMessage as MessageHandler, { ...options, market: 'futures-coin' })
}
