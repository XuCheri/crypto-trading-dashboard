/**
 * Binance 合约 API 封装
 *
 * 包含:
 * - getFundingRates: 获取资金费率
 * - getOpenInterest: 获取持仓量
 * - getOpenInterestHist: 获取持仓量历史
 * - getLongShortRatio: 获取多空比
 * - getTopTraderRatio: 获取大户持仓比
 * - getFuturesTicker24hr: 获取合约 24h 行情
 * - getMarkPrice: 获取标记价格
 * - getFuturesKlines: 获取合约 K 线
 * - getCoinMTicker24hr: 获取 COIN-M 合约行情
 * - getCoinMMarkPrice: 获取 COIN-M 标记价格
 */

import { futuresUsdtApi, futuresCoinApi } from './client'
import { KlineInterval, CandlestickData } from './types'
import {
  FundingRate,
  FundingRateSchema,
  OpenInterest,
  OpenInterestSchema,
  OpenInterestHist,
  OpenInterestHistSchema,
  LongShortRatio,
  LongShortRatioSchema,
  TopTraderRatio,
  TopTraderRatioSchema,
  FuturesTicker,
  FuturesTickerSchema,
  MarkPrice,
  MarkPriceSchema,
  FundingRateData,
  OpenInterestData,
} from './types'

// ============ USDT-M 合约 API ============

/**
 * 获取所有交易对的资金费率
 * 权重: 1
 */
export async function getFundingRates(): Promise<FundingRate[]> {
  const data = await futuresUsdtApi.get<unknown[]>(
    '/fapi/v1/premiumIndex',
    undefined,
    { weight: 1 }
  )

  const results: FundingRate[] = []
  for (const item of data) {
    const result = MarkPriceSchema.safeParse(item)
    if (result.success) {
      results.push({
        symbol: result.data.symbol,
        fundingRate: result.data.lastFundingRate,
        fundingTime: result.data.nextFundingTime,
        markPrice: result.data.markPrice,
      })
    }
  }

  return results
}

/**
 * 获取单个交易对的持仓量
 * 权重: 1
 */
export async function getOpenInterest(symbol: string): Promise<OpenInterest> {
  const data = await futuresUsdtApi.get<unknown>(
    '/fapi/v1/openInterest',
    { symbol },
    { weight: 1 }
  )

  return OpenInterestSchema.parse(data)
}

/**
 * 获取持仓量历史
 * 权重: 1
 *
 * @param symbol - 交易对
 * @param period - 周期: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
 * @param limit - 数量限制，默认 30，最大 500
 */
export async function getOpenInterestHist(
  symbol: string,
  period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' = '1h',
  limit: number = 30
): Promise<OpenInterestHist[]> {
  const data = await futuresUsdtApi.get<unknown[]>(
    '/futures/data/openInterestHist',
    { symbol, period, limit: Math.min(limit, 500) },
    { weight: 1 }
  )

  const results: OpenInterestHist[] = []
  for (const item of data) {
    const result = OpenInterestHistSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取全局多空比（账户数）
 * 权重: 1
 *
 * @param symbol - 交易对
 * @param period - 周期: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
 * @param limit - 数量限制，默认 30，最大 500
 */
export async function getLongShortRatio(
  symbol: string,
  period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' = '1h',
  limit: number = 30
): Promise<LongShortRatio[]> {
  const data = await futuresUsdtApi.get<unknown[]>(
    '/futures/data/globalLongShortAccountRatio',
    { symbol, period, limit: Math.min(limit, 500) },
    { weight: 1 }
  )

  const results: LongShortRatio[] = []
  for (const item of data) {
    const result = LongShortRatioSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取大户持仓比（持仓量）
 * 权重: 1
 */
export async function getTopTraderPositionRatio(
  symbol: string,
  period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' = '1h',
  limit: number = 30
): Promise<TopTraderRatio[]> {
  const data = await futuresUsdtApi.get<unknown[]>(
    '/futures/data/topLongShortPositionRatio',
    { symbol, period, limit: Math.min(limit, 500) },
    { weight: 1 }
  )

  const results: TopTraderRatio[] = []
  for (const item of data) {
    const result = TopTraderRatioSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取大户持仓比（账户数）
 * 权重: 1
 */
export async function getTopTraderAccountRatio(
  symbol: string,
  period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' = '1h',
  limit: number = 30
): Promise<TopTraderRatio[]> {
  const data = await futuresUsdtApi.get<unknown[]>(
    '/futures/data/topLongShortAccountRatio',
    { symbol, period, limit: Math.min(limit, 500) },
    { weight: 1 }
  )

  const results: TopTraderRatio[] = []
  for (const item of data) {
    const result = TopTraderRatioSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取合约 24h 行情
 * 权重: 40 (全部) / 1 (单个)
 */
export async function getFuturesTicker24hr(
  symbol?: string
): Promise<FuturesTicker[]> {
  const params = symbol ? { symbol } : undefined
  const weight = symbol ? 1 : 40

  const data = await futuresUsdtApi.get<unknown | unknown[]>(
    '/fapi/v1/ticker/24hr',
    params,
    { weight }
  )

  // 单个交易对返回对象，全部返回数组
  const items = Array.isArray(data) ? data : [data]

  const results: FuturesTicker[] = []
  for (const item of items) {
    const result = FuturesTickerSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取标记价格
 * 权重: 1 (单个) / 10 (全部)
 */
export async function getMarkPrice(symbol?: string): Promise<MarkPrice[]> {
  const params = symbol ? { symbol } : undefined
  const weight = symbol ? 1 : 10

  const data = await futuresUsdtApi.get<unknown | unknown[]>(
    '/fapi/v1/premiumIndex',
    params,
    { weight }
  )

  const items = Array.isArray(data) ? data : [data]

  const results: MarkPrice[] = []
  for (const item of items) {
    const result = MarkPriceSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

// ============ 数据转换工具函数 ============

/**
 * 转换资金费率数据
 */
export function transformFundingRate(rate: FundingRate): FundingRateData {
  const fundingRate = parseFloat(rate.fundingRate)
  return {
    symbol: rate.symbol,
    fundingRate,
    fundingTime: rate.fundingTime,
    // 年化费率 = 资金费率 * 3 * 365 (每 8 小时收取一次)
    annualizedRate: fundingRate * 3 * 365 * 100,
  }
}

/**
 * 批量转换资金费率
 */
export function transformFundingRates(rates: FundingRate[]): FundingRateData[] {
  return rates.map(transformFundingRate)
}

/**
 * 转换持仓量数据
 */
export function transformOpenInterest(oi: OpenInterest): OpenInterestData {
  return {
    symbol: oi.symbol,
    openInterest: parseFloat(oi.openInterest),
    time: oi.time || Date.now(),
  }
}

/**
 * 转换持仓量历史
 */
export function transformOpenInterestHist(
  oi: OpenInterestHist
): OpenInterestData {
  return {
    symbol: oi.symbol,
    openInterest: parseFloat(oi.sumOpenInterest),
    openInterestValue: parseFloat(oi.sumOpenInterestValue),
    time: oi.timestamp,
  }
}

/**
 * 按资金费率排序（绝对值）
 */
export function sortByFundingRate(
  rates: FundingRateData[],
  desc = true
): FundingRateData[] {
  return [...rates].sort((a, b) =>
    desc
      ? Math.abs(b.fundingRate) - Math.abs(a.fundingRate)
      : Math.abs(a.fundingRate) - Math.abs(b.fundingRate)
  )
}

/**
 * 筛选正/负资金费率
 */
export function filterPositiveFunding(
  rates: FundingRateData[]
): FundingRateData[] {
  return rates.filter((r) => r.fundingRate > 0)
}

export function filterNegativeFunding(
  rates: FundingRateData[]
): FundingRateData[] {
  return rates.filter((r) => r.fundingRate < 0)
}

// ============ K 线数据 ============

/**
 * 获取 USDT-M 合约 K 线
 * 权重: 5
 */
export async function getFuturesKlines(
  symbol: string,
  interval: KlineInterval,
  limit: number = 500
): Promise<unknown[]> {
  return futuresUsdtApi.get<unknown[]>(
    '/fapi/v1/klines',
    { symbol, interval, limit: Math.min(limit, 1500) },
    { weight: 5 }
  )
}

/**
 * 获取 COIN-M 合约 K 线
 * 权重: 5
 */
export async function getCoinMKlines(
  symbol: string,
  interval: KlineInterval,
  limit: number = 500
): Promise<unknown[]> {
  return futuresCoinApi.get<unknown[]>(
    '/dapi/v1/klines',
    { symbol, interval, limit: Math.min(limit, 1500) },
    { weight: 5 }
  )
}

/**
 * 转换 K 线数据为图表格式
 */
export function transformFuturesKlines(klines: unknown[]): CandlestickData[] {
  return klines.map((k) => {
    const arr = k as [number, string, string, string, string, string, ...unknown[]]
    return {
      time: Math.floor(arr[0] / 1000),
      open: parseFloat(arr[1]),
      high: parseFloat(arr[2]),
      low: parseFloat(arr[3]),
      close: parseFloat(arr[4]),
      volume: parseFloat(arr[5]),
    }
  })
}

// ============ COIN-M 合约 API ============

/**
 * 获取 COIN-M 合约 24h 行情
 * 权重: 40 (全部) / 1 (单个)
 */
export async function getCoinMTicker24hr(
  symbol?: string
): Promise<FuturesTicker[]> {
  const params = symbol ? { symbol } : undefined
  const weight = symbol ? 1 : 40

  const data = await futuresCoinApi.get<unknown | unknown[]>(
    '/dapi/v1/ticker/24hr',
    params,
    { weight }
  )

  const items = Array.isArray(data) ? data : [data]

  const results: FuturesTicker[] = []
  for (const item of items) {
    const result = FuturesTickerSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取 COIN-M 标记价格
 * 权重: 1 (单个) / 10 (全部)
 */
export async function getCoinMMarkPrice(symbol?: string): Promise<MarkPrice[]> {
  const params = symbol ? { symbol } : undefined
  const weight = symbol ? 1 : 10

  const data = await futuresCoinApi.get<unknown | unknown[]>(
    '/dapi/v1/premiumIndex',
    params,
    { weight }
  )

  const items = Array.isArray(data) ? data : [data]

  const results: MarkPrice[] = []
  for (const item of items) {
    const result = MarkPriceSchema.safeParse(item)
    if (result.success) {
      results.push(result.data)
    }
  }

  return results
}

/**
 * 获取 COIN-M 资金费率
 */
export async function getCoinMFundingRates(): Promise<FundingRate[]> {
  const data = await futuresCoinApi.get<unknown[]>(
    '/dapi/v1/premiumIndex',
    undefined,
    { weight: 10 }
  )

  const results: FundingRate[] = []
  for (const item of data) {
    const result = MarkPriceSchema.safeParse(item)
    if (result.success) {
      results.push({
        symbol: result.data.symbol,
        fundingRate: result.data.lastFundingRate,
        fundingTime: result.data.nextFundingTime,
        markPrice: result.data.markPrice,
      })
    }
  }

  return results
}

// ============ 转换后的合约 Ticker 类型 ============

export interface FuturesTickerData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
  openPrice: number
  markPrice?: number
  indexPrice?: number
  fundingRate?: number
  nextFundingTime?: number
}

/**
 * 转换合约 Ticker 数据
 */
export function transformFuturesTicker(
  ticker: FuturesTicker,
  markPriceData?: MarkPrice
): FuturesTickerData {
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
    markPrice: markPriceData ? parseFloat(markPriceData.markPrice) : undefined,
    indexPrice: markPriceData ? parseFloat(markPriceData.indexPrice) : undefined,
    fundingRate: markPriceData ? parseFloat(markPriceData.lastFundingRate) : undefined,
    nextFundingTime: markPriceData?.nextFundingTime,
  }
}

/**
 * 批量转换合约 Ticker
 */
export function transformFuturesTickers(
  tickers: FuturesTicker[],
  markPrices?: MarkPrice[]
): FuturesTickerData[] {
  const markPriceMap = new Map<string, MarkPrice>()
  if (markPrices) {
    markPrices.forEach((mp) => markPriceMap.set(mp.symbol, mp))
  }

  return tickers.map((ticker) =>
    transformFuturesTicker(ticker, markPriceMap.get(ticker.symbol))
  )
}

/**
 * 过滤 USDT 永续合约
 */
export function filterUsdtPerp(tickers: FuturesTickerData[]): FuturesTickerData[] {
  return tickers.filter((t) => t.symbol.endsWith('USDT'))
}

/**
 * 过滤 COIN-M 永续合约
 */
export function filterCoinPerp(tickers: FuturesTickerData[]): FuturesTickerData[] {
  return tickers.filter((t) => t.symbol.includes('_PERP'))
}
