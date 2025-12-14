import { z } from 'zod'

// ============ 基础类型 ============

/**
 * REST API 基础 URL
 *
 * CORS 说明：
 * - 现货 API：data-api.binance.vision 支持 CORS，可在浏览器中直接访问
 * - 合约 API：fapi/dapi.binance.com 公开行情端点支持 CORS
 *
 * 如果遇到 CORS 问题，请尝试：
 * 1. 检查网络是否正常（某些地区需要代理）
 * 2. 开发环境可使用浏览器 CORS 扩展
 * 3. 生产环境可配置服务器代理（如 Vercel Rewrites）
 *
 * 参考：https://developers.binance.com/docs/binance-spot-api-docs/faqs/market_data_only
 */
export const API_ENDPOINTS = {
  /**
   * 现货 API - 使用 data-api.binance.vision
   * 支持 CORS，专为公共行情数据设计
   */
  SPOT: 'https://data-api.binance.vision',
  /**
   * USDT-M 合约 API
   * 公开行情端点支持 CORS（如 /fapi/v1/ticker, /fapi/v1/klines 等）
   */
  FUTURES_USDT: 'https://fapi.binance.com',
  /**
   * COIN-M 合约 API
   * 公开行情端点支持 CORS（如 /dapi/v1/ticker, /dapi/v1/klines 等）
   */
  FUTURES_COIN: 'https://dapi.binance.com',
} as const

/**
 * 合约数据统计 API（可能有额外的访问限制）
 * 用于获取持仓量历史、多空比等统计数据
 */
export const FUTURES_DATA_ENDPOINTS = {
  /** USDT-M 合约数据统计 */
  USDT: 'https://fapi.binance.com',
  /** COIN-M 合约数据统计 */
  COIN: 'https://dapi.binance.com',
} as const

/**
 * WebSocket 基础 URL
 * WebSocket 不受 CORS 限制，使用官方 WS 域名
 */
export const WS_ENDPOINTS = {
  SPOT: 'wss://stream.binance.com:9443/ws',
  SPOT_COMBINED: 'wss://stream.binance.com:9443/stream',
  FUTURES_USDT: 'wss://fstream.binance.com/ws',
  FUTURES_USDT_COMBINED: 'wss://fstream.binance.com/stream',
  FUTURES_COIN: 'wss://dstream.binance.com/ws',
  FUTURES_COIN_COMBINED: 'wss://dstream.binance.com/stream',
} as const

// ============ 现货 API 类型 ============

/** 24小时行情 Schema */
export const Ticker24hrSchema = z.object({
  symbol: z.string(),
  priceChange: z.string(),
  priceChangePercent: z.string(),
  weightedAvgPrice: z.string(),
  prevClosePrice: z.string(),
  lastPrice: z.string(),
  lastQty: z.string(),
  bidPrice: z.string(),
  bidQty: z.string(),
  askPrice: z.string(),
  askQty: z.string(),
  openPrice: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  volume: z.string(),
  quoteVolume: z.string(),
  openTime: z.number(),
  closeTime: z.number(),
  firstId: z.number(),
  lastId: z.number(),
  count: z.number(),
})

export type Ticker24hr = z.infer<typeof Ticker24hrSchema>

/** K 线数据 Schema（数组格式） */
export const KlineSchema = z.tuple([
  z.number(), // 开盘时间
  z.string(), // 开盘价
  z.string(), // 最高价
  z.string(), // 最低价
  z.string(), // 收盘价
  z.string(), // 成交量
  z.number(), // 收盘时间
  z.string(), // 成交额
  z.number(), // 成交笔数
  z.string(), // 主动买入成交量
  z.string(), // 主动买入成交额
  z.string(), // 忽略
])

export type Kline = z.infer<typeof KlineSchema>

/** K 线周期 */
export type KlineInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M'

/** 交易对信息 Schema */
export const SymbolInfoSchema = z.object({
  symbol: z.string(),
  status: z.string(),
  baseAsset: z.string(),
  baseAssetPrecision: z.number(),
  quoteAsset: z.string(),
  quotePrecision: z.number(),
  quoteAssetPrecision: z.number(),
  orderTypes: z.array(z.string()),
  icebergAllowed: z.boolean(),
  ocoAllowed: z.boolean(),
  quoteOrderQtyMarketAllowed: z.boolean(),
  allowTrailingStop: z.boolean(),
  cancelReplaceAllowed: z.boolean(),
  isSpotTradingAllowed: z.boolean(),
  isMarginTradingAllowed: z.boolean(),
})

export type SymbolInfo = z.infer<typeof SymbolInfoSchema>

/** ExchangeInfo Schema */
export const ExchangeInfoSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  symbols: z.array(SymbolInfoSchema),
})

export type ExchangeInfo = z.infer<typeof ExchangeInfoSchema>

// ============ 合约 API 类型 ============

/** 资金费率 Schema */
export const FundingRateSchema = z.object({
  symbol: z.string(),
  fundingRate: z.string(),
  fundingTime: z.number(),
  markPrice: z.string().optional(),
})

export type FundingRate = z.infer<typeof FundingRateSchema>

/** 持仓量 Schema */
export const OpenInterestSchema = z.object({
  symbol: z.string(),
  openInterest: z.string(),
  time: z.number().optional(),
})

export type OpenInterest = z.infer<typeof OpenInterestSchema>

/** 持仓量历史 Schema */
export const OpenInterestHistSchema = z.object({
  symbol: z.string(),
  sumOpenInterest: z.string(),
  sumOpenInterestValue: z.string(),
  timestamp: z.number(),
})

export type OpenInterestHist = z.infer<typeof OpenInterestHistSchema>

/** 多空比 Schema */
export const LongShortRatioSchema = z.object({
  symbol: z.string(),
  longShortRatio: z.string(),
  longAccount: z.string(),
  shortAccount: z.string(),
  timestamp: z.number(),
})

export type LongShortRatio = z.infer<typeof LongShortRatioSchema>

/** 大户持仓比 Schema */
export const TopTraderRatioSchema = z.object({
  symbol: z.string(),
  longShortRatio: z.string(),
  longAccount: z.string(),
  shortAccount: z.string(),
  timestamp: z.number(),
})

export type TopTraderRatio = z.infer<typeof TopTraderRatioSchema>

/** 合约行情 Schema */
export const FuturesTickerSchema = z.object({
  symbol: z.string(),
  priceChange: z.string(),
  priceChangePercent: z.string(),
  weightedAvgPrice: z.string(),
  lastPrice: z.string(),
  lastQty: z.string(),
  openPrice: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  volume: z.string(),
  quoteVolume: z.string(),
  openTime: z.number(),
  closeTime: z.number(),
  firstId: z.number(),
  lastId: z.number(),
  count: z.number(),
})

export type FuturesTicker = z.infer<typeof FuturesTickerSchema>

/** 标记价格 Schema */
export const MarkPriceSchema = z.object({
  symbol: z.string(),
  markPrice: z.string(),
  indexPrice: z.string(),
  estimatedSettlePrice: z.string().optional(),
  lastFundingRate: z.string(),
  nextFundingTime: z.number(),
  interestRate: z.string().optional(),
  time: z.number(),
})

export type MarkPrice = z.infer<typeof MarkPriceSchema>

// ============ 转换后的类型（用于 UI） ============

/** 转换后的 Ticker 数据 */
export interface TickerData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
  openPrice: number
}

/** 转换后的 K 线数据（用于 Lightweight Charts） */
export interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/** 转换后的资金费率 */
export interface FundingRateData {
  symbol: string
  fundingRate: number
  fundingTime: number
  annualizedRate: number
}

/** 转换后的持仓量 */
export interface OpenInterestData {
  symbol: string
  openInterest: number
  openInterestValue?: number
  time: number
}
