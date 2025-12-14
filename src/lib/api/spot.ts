/**
 * Binance 现货 API 封装
 *
 * 包含:
 * - getExchangeInfo: 获取交易对信息
 * - getTicker24hr: 批量获取 24h 行情
 * - getKlines: 获取 K 线数据
 */

import { spotApi } from './client'
import {
  ExchangeInfo,
  ExchangeInfoSchema,
  Ticker24hr,
  Ticker24hrSchema,
  Kline,
  KlineSchema,
  KlineInterval,
  TickerData,
  CandlestickData,
} from './types'
import { z } from 'zod'

/**
 * 获取交易所信息（交易对、规则等）
 * 权重: 20
 */
export async function getExchangeInfo(): Promise<ExchangeInfo> {
  const data = await spotApi.get<unknown>('/api/v3/exchangeInfo', undefined, {
    weight: 20,
  })

  // 宽松解析，只提取需要的字段
  const result = ExchangeInfoSchema.safeParse(data)
  if (!result.success) {
    console.warn('ExchangeInfo validation warning:', result.error.message)
    // 返回原始数据，允许部分字段缺失
    return data as ExchangeInfo
  }

  return result.data
}

/**
 * 获取所有交易对的 24 小时行情
 * 权重: 40
 */
export async function getTicker24hr(): Promise<Ticker24hr[]> {
  const data = await spotApi.get<unknown[]>('/api/v3/ticker/24hr', undefined, {
    weight: 40,
  })

  // 批量验证
  const results: Ticker24hr[] = []
  for (const item of data) {
    const result = Ticker24hrSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取单个交易对的 24 小时行情
 * 权重: 1
 */
export async function getTickerBySymbol(symbol: string): Promise<Ticker24hr> {
  const data = await spotApi.get<unknown>(
    '/api/v3/ticker/24hr',
    { symbol },
    { weight: 1 }
  )

  const result = Ticker24hrSchema.parse(data)
  return result
}

/**
 * 获取 K 线数据
 * 权重: 5
 *
 * @param symbol - 交易对，如 BTCUSDT
 * @param interval - K 线周期
 * @param limit - 数量限制，默认 500，最大 1000
 * @param startTime - 开始时间戳（可选）
 * @param endTime - 结束时间戳（可选）
 */
export async function getKlines(
  symbol: string,
  interval: KlineInterval,
  limit: number = 500,
  startTime?: number,
  endTime?: number
): Promise<Kline[]> {
  const params: Record<string, string | number> = {
    symbol,
    interval,
    limit: Math.min(limit, 1000),
  }

  if (startTime) params.startTime = startTime
  if (endTime) params.endTime = endTime

  const data = await spotApi.get<unknown[]>('/api/v3/klines', params, {
    weight: 5,
  })

  // 验证 K 线数据
  const results: Kline[] = []
  for (const item of data) {
    const result = KlineSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

// ============ 数据转换工具函数 ============

/**
 * 将原始 Ticker24hr 转换为 UI 友好的格式
 * @deprecated REST API 不可用，使用 transformWsTicker 替代
 */
export function transformTicker(ticker: Ticker24hr): TickerData {
  return {
    symbol: ticker.symbol,
    price: parseFloat(ticker.lastPrice),
    priceChange: parseFloat(ticker.priceChange),
    priceChangePercent: parseFloat(ticker.priceChangePercent),
    high: parseFloat(ticker.highPrice),
    low: parseFloat(ticker.lowPrice),
    volume: parseFloat(ticker.volume),
    quoteVolume: parseFloat(ticker.quoteVolume),
    openPrice: parseFloat(ticker.openPrice),
    updatedAt: ticker.closeTime,
  }
}

/**
 * 批量转换 Ticker 数据
 */
export function transformTickers(tickers: Ticker24hr[]): TickerData[] {
  return tickers.map(transformTicker)
}

/**
 * 将原始 K 线数据转换为 Lightweight Charts 格式
 */
export function transformKline(kline: Kline): CandlestickData {
  return {
    time: Math.floor(kline[0] / 1000), // 转换为秒级时间戳
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5]),
  }
}

/**
 * 批量转换 K 线数据
 */
export function transformKlines(klines: Kline[]): CandlestickData[] {
  return klines.map(transformKline)
}

/**
 * 过滤 USDT 交易对
 */
export function filterUsdtPairs(tickers: TickerData[]): TickerData[] {
  return tickers.filter((t) => t.symbol.endsWith('USDT'))
}

/**
 * 按成交额排序
 */
export function sortByQuoteVolume(
  tickers: TickerData[],
  desc = true
): TickerData[] {
  return [...tickers].sort((a, b) =>
    desc ? b.quoteVolume - a.quoteVolume : a.quoteVolume - b.quoteVolume
  )
}

/**
 * 按涨跌幅排序
 */
export function sortByPriceChange(
  tickers: TickerData[],
  desc = true
): TickerData[] {
  return [...tickers].sort((a, b) =>
    desc
      ? b.priceChangePercent - a.priceChangePercent
      : a.priceChangePercent - b.priceChangePercent
  )
}
