import { z } from 'zod'

// ============ 数据获取方案说明 ============
/**
 * 数据获取架构：
 *
 * 1. REST API 通过 Next.js API Routes 代理访问（解决 CORS 问题）
 *    - /api/binance/spot/* -> https://api.binance.com/*
 *    - /api/binance/futures-usdt/* -> https://fapi.binance.com/*
 *    - /api/binance/futures-coin/* -> https://dapi.binance.com/*
 *
 * 2. WebSocket 直连 Binance（WebSocket 不受 CORS 限制）
 *
 * 数据可用性：
 * ✅ REST API（通过代理）：历史K线、交易对列表、资金费率历史、持仓量等
 * ✅ WebSocket（直连）：实时行情、实时K线、订单簿、成交、标记价格等
 */

// ============ WebSocket 端点 ============

/**
 * WebSocket 基础 URL
 * WebSocket 不受 CORS 限制，是纯前端项目唯一可靠的数据源
 *
 * 注意：
 * - 中国大陆用户可能需要 VPN 才能访问 binance.com 域名
 * - 备用端点可能在某些网络环境下更稳定
 */
export const WS_ENDPOINTS = {
  /** 现货 WebSocket */
  SPOT: 'wss://stream.binance.com:9443/ws',
  /** 现货组合流 */
  SPOT_COMBINED: 'wss://stream.binance.com:9443/stream',
  /** USDT-M 合约 WebSocket */
  FUTURES_USDT: 'wss://fstream.binance.com/ws',
  /** USDT-M 合约组合流 */
  FUTURES_USDT_COMBINED: 'wss://fstream.binance.com/stream',
  /** COIN-M 合约 WebSocket */
  FUTURES_COIN: 'wss://dstream.binance.com/ws',
  /** COIN-M 合约组合流 */
  FUTURES_COIN_COMBINED: 'wss://dstream.binance.com/stream',
} as const

/**
 * 备用 WebSocket 端点（某些网络环境可能更稳定）
 */
export const WS_ENDPOINTS_ALT = {
  /** 现货 WebSocket（备用端点 1） */
  SPOT: 'wss://stream1.binance.com:9443/ws',
  /** 现货组合流（备用端点 1） */
  SPOT_COMBINED: 'wss://stream1.binance.com:9443/stream',
  /** 现货 WebSocket（备用端点 2） */
  SPOT_2: 'wss://stream2.binance.com:9443/ws',
  /** 现货组合流（备用端点 2） */
  SPOT_COMBINED_2: 'wss://stream2.binance.com:9443/stream',
  /** 现货 WebSocket（备用端点 3） */
  SPOT_3: 'wss://stream3.binance.com:9443/ws',
  /** 现货组合流（备用端点 3） */
  SPOT_COMBINED_3: 'wss://stream3.binance.com:9443/stream',
} as const

// ============ 预设交易对列表 ============
/**
 * 由于无法通过 REST API 获取 exchangeInfo，预设主流交易对
 * 实际交易对会通过 WebSocket ticker 数据动态发现
 */
export const PRESET_SPOT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
  'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT',
  'XLMUSDT', 'BCHUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT',
] as const

export const PRESET_FUTURES_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
  'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT',
  'APTUSDT', 'ARBUSDT', 'OPUSDT', 'LDOUSDT', 'SUIUSDT',
] as const

// ============ K 线周期 ============

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

// ============ WebSocket 消息类型 ============

/** WebSocket Ticker 消息（24hr） */
export interface WsTicker {
  e: '24hrTicker' // 事件类型
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

/** WebSocket Mini Ticker 消息 */
export interface WsMiniTicker {
  e: '24hrMiniTicker'
  E: number
  s: string
  c: string // 最新价格
  o: string // 开盘价
  h: string // 最高价
  l: string // 最低价
  v: string // 成交量
  q: string // 成交额
}

/** WebSocket K 线消息 */
export interface WsKline {
  e: 'kline'
  E: number // 事件时间
  s: string // 交易对
  k: {
    t: number // K线开始时间
    T: number // K线结束时间
    s: string // 交易对
    i: string // K线间隔
    f: number // 首笔成交ID
    L: number // 末笔成交ID
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

/** WebSocket 深度消息 */
export interface WsDepth {
  e: 'depthUpdate'
  E: number
  s: string
  U: number // 首次更新ID
  u: number // 末次更新ID
  b: [string, string][] // 买单 [价格, 数量]
  a: [string, string][] // 卖单 [价格, 数量]
}

/** WebSocket 成交消息 */
export interface WsTrade {
  e: 'trade'
  E: number
  s: string
  t: number // 成交ID
  p: string // 价格
  q: string // 数量
  b: number // 买方订单ID
  a: number // 卖方订单ID
  T: number // 成交时间
  m: boolean // 是否是买方做市
}

/** WebSocket 归集成交消息 */
export interface WsAggTrade {
  e: 'aggTrade'
  E: number
  s: string
  a: number // 归集成交ID
  p: string // 价格
  q: string // 数量
  f: number // 首笔成交ID
  l: number // 末笔成交ID
  T: number // 成交时间
  m: boolean // 是否是买方做市
}

/** WebSocket 标记价格消息（合约） */
export interface WsMarkPrice {
  e: 'markPriceUpdate'
  E: number // 事件时间
  s: string // 交易对
  p: string // 标记价格
  i: string // 指数价格
  P: string // 预估结算价
  r: string // 资金费率
  T: number // 下次资金费时间
}

/** WebSocket 强平订单消息（合约） */
export interface WsForceOrder {
  e: 'forceOrder'
  E: number
  o: {
    s: string // 交易对
    S: 'BUY' | 'SELL' // 方向
    o: string // 订单类型
    f: string // 有效方式
    q: string // 数量
    p: string // 价格
    ap: string // 平均价格
    X: string // 订单状态
    l: string // 最近成交量
    z: string // 累计成交量
    T: number // 成交时间
  }
}

// ============ UI 数据类型 ============

/** 转换后的 Ticker 数据（用于 UI） */
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
  updatedAt: number
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

/** 深度数据（用于 UI） */
export interface OrderbookData {
  bids: { price: number; quantity: number }[]
  asks: { price: number; quantity: number }[]
  lastUpdateId: number
}

/** 成交数据（用于 UI） */
export interface TradeData {
  id: number
  price: number
  quantity: number
  time: number
  isBuyerMaker: boolean
}

/** 标记价格数据（用于 UI） */
export interface MarkPriceData {
  symbol: string
  markPrice: number
  indexPrice: number
  fundingRate: number
  nextFundingTime: number
  updatedAt: number
}

/** 强平订单数据（用于 UI） */
export interface LiquidationData {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  time: number
}

// ============ 数据转换函数 ============

/** 转换 WebSocket Ticker 为 UI 数据 */
export function transformWsTicker(ws: WsTicker): TickerData {
  return {
    symbol: ws.s,
    price: parseFloat(ws.c),
    priceChange: parseFloat(ws.p),
    priceChangePercent: parseFloat(ws.P),
    high: parseFloat(ws.h),
    low: parseFloat(ws.l),
    volume: parseFloat(ws.v),
    quoteVolume: parseFloat(ws.q),
    openPrice: parseFloat(ws.o),
    updatedAt: ws.E,
  }
}

/** 转换 WebSocket Mini Ticker 为 UI 数据 */
export function transformWsMiniTicker(ws: WsMiniTicker): Partial<TickerData> {
  return {
    symbol: ws.s,
    price: parseFloat(ws.c),
    high: parseFloat(ws.h),
    low: parseFloat(ws.l),
    volume: parseFloat(ws.v),
    quoteVolume: parseFloat(ws.q),
    openPrice: parseFloat(ws.o),
    updatedAt: ws.E,
  }
}

/** 转换 WebSocket K 线为 UI 数据 */
export function transformWsKline(ws: WsKline): CandlestickData {
  return {
    time: Math.floor(ws.k.t / 1000),
    open: parseFloat(ws.k.o),
    high: parseFloat(ws.k.h),
    low: parseFloat(ws.k.l),
    close: parseFloat(ws.k.c),
    volume: parseFloat(ws.k.v),
  }
}

/** 转换 WebSocket 成交为 UI 数据 */
export function transformWsTrade(ws: WsTrade | WsAggTrade): TradeData {
  return {
    id: 't' in ws ? ws.t : ws.a,
    price: parseFloat(ws.p),
    quantity: parseFloat(ws.q),
    time: ws.T,
    isBuyerMaker: ws.m,
  }
}

/** 转换 WebSocket 标记价格为 UI 数据 */
export function transformWsMarkPrice(ws: WsMarkPrice): MarkPriceData {
  return {
    symbol: ws.s,
    markPrice: parseFloat(ws.p),
    indexPrice: parseFloat(ws.i),
    fundingRate: parseFloat(ws.r),
    nextFundingTime: ws.T,
    updatedAt: ws.E,
  }
}

/** 转换 WebSocket 强平订单为 UI 数据 */
export function transformWsForceOrder(ws: WsForceOrder): LiquidationData {
  return {
    symbol: ws.o.s,
    side: ws.o.S,
    quantity: parseFloat(ws.o.q),
    price: parseFloat(ws.o.p),
    time: ws.o.T,
  }
}

// ============ REST API 类型定义 ============

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

/** 资金费率数据（用于 UI） */
export interface FundingRateData {
  symbol: string
  fundingRate: number
  fundingTime: number
  annualizedRate: number
}

/** 持仓量数据（用于 UI） */
export interface OpenInterestData {
  symbol: string
  openInterest: number
  openInterestValue?: number
  time: number
}

// ============ REST API 端点（通过 Next.js 代理） ============

/**
 * REST API 端点
 * 通过 Next.js API Routes 代理访问 Binance API
 */
export const API_ENDPOINTS = {
  SPOT: '/api/binance/spot',
  FUTURES_USDT: '/api/binance/futures-usdt',
  FUTURES_COIN: '/api/binance/futures-coin',
} as const

/** 交易所信息 Schema */
export const ExchangeInfoSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  rateLimits: z.array(z.unknown()),
  symbols: z.array(z.object({
    symbol: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    baseAssetPrecision: z.number(),
    quotePrecision: z.number(),
    quoteAssetPrecision: z.number(),
    filters: z.array(z.unknown()),
  })),
})

export type ExchangeInfo = z.infer<typeof ExchangeInfoSchema>

/** K 线数据 Schema */
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

/** 资金费率 Schema */
export const FundingRateSchema = z.object({
  symbol: z.string(),
  fundingRate: z.string(),
  fundingTime: z.number(),
})

export type FundingRate = z.infer<typeof FundingRateSchema> & { markPrice?: string }

/** 标记价格 Schema */
export const MarkPriceSchema = z.object({
  symbol: z.string(),
  markPrice: z.string(),
  indexPrice: z.string(),
  estimatedSettlePrice: z.string().optional(),
  lastFundingRate: z.string(),
  nextFundingTime: z.number(),
  interestRate: z.string().optional(),
  time: z.number().optional(),
})

export type MarkPrice = z.infer<typeof MarkPriceSchema>

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
