/**
 * Binance WebSocket 管理器
 *
 * 功能:
 * - 单例模式（按市场类型分离连接）
 * - 动态订阅/取消订阅
 * - 指数退避重连（最多 5 次）
 * - 心跳保活（每 3 分钟）
 * - 消息分发（基于 stream 名称）
 */

import { WS_ENDPOINTS } from '../api/types'

/** 市场类型 */
export type MarketType = 'spot' | 'futures-usdt' | 'futures-coin'

/** 消息处理函数类型 */
export type MessageHandler = (data: unknown) => void

/** 连接状态 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

/** 连接配置 */
interface ConnectionConfig {
  endpoint: string
  market: MarketType
}

/** 内部连接状态 */
interface InternalConnection {
  ws: WebSocket | null
  state: ConnectionState
  subscriptions: Set<string>
  handlers: Map<string, Set<MessageHandler>>
  reconnectAttempts: number
  heartbeatInterval: ReturnType<typeof setInterval> | null
  reconnectTimeout: ReturnType<typeof setTimeout> | null
}

/**
 * WebSocket 管理器类
 */
class WebSocketManager {
  // 连接池
  private connections: Map<MarketType, InternalConnection> = new Map()

  // 配置常量
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private readonly BASE_RECONNECT_DELAY = 1000
  private readonly HEARTBEAT_INTERVAL = 3 * 60 * 1000 - 10000 // 2分50秒
  private readonly MAX_STREAMS_PER_MESSAGE = 200

  // 端点映射
  private readonly ENDPOINTS: Record<MarketType, string> = {
    spot: WS_ENDPOINTS.SPOT_COMBINED,
    'futures-usdt': WS_ENDPOINTS.FUTURES_USDT_COMBINED,
    'futures-coin': WS_ENDPOINTS.FUTURES_COIN_COMBINED,
  }

  // 状态变化回调
  private stateChangeCallbacks: Set<(market: MarketType, state: ConnectionState) => void> =
    new Set()

  constructor() {
    // 初始化连接状态
    const markets: MarketType[] = ['spot', 'futures-usdt', 'futures-coin']
    markets.forEach((market) => {
      this.connections.set(market, {
        ws: null,
        state: 'disconnected',
        subscriptions: new Set(),
        handlers: new Map(),
        reconnectAttempts: 0,
        heartbeatInterval: null,
        reconnectTimeout: null,
      })
    })
  }

  /**
   * 订阅数据流
   *
   * @param market - 市场类型
   * @param streams - 流名称数组，如 ['btcusdt@ticker', 'ethusdt@ticker']
   * @param handler - 消息处理函数
   */
  subscribe(market: MarketType, streams: string[], handler: MessageHandler): void {
    const conn = this.connections.get(market)!
    const newStreams: string[] = []

    // 注册处理函数
    streams.forEach((stream) => {
      const normalizedStream = stream.toLowerCase()

      // 添加到 handlers
      if (!conn.handlers.has(normalizedStream)) {
        conn.handlers.set(normalizedStream, new Set())
      }
      conn.handlers.get(normalizedStream)!.add(handler)

      // 检查是否需要订阅
      if (!conn.subscriptions.has(normalizedStream)) {
        conn.subscriptions.add(normalizedStream)
        newStreams.push(normalizedStream)
      }
    })

    // 如果有新流需要订阅
    if (newStreams.length > 0) {
      // 确保连接已建立
      if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) {
        this.connect(market)
      } else {
        this.sendSubscribe(market, newStreams)
      }
    }
  }

  /**
   * 取消订阅数据流
   */
  unsubscribe(market: MarketType, streams: string[], handler: MessageHandler): void {
    const conn = this.connections.get(market)!
    const streamsToUnsubscribe: string[] = []

    streams.forEach((stream) => {
      const normalizedStream = stream.toLowerCase()

      // 移除处理函数
      const handlers = conn.handlers.get(normalizedStream)
      if (handlers) {
        handlers.delete(handler)

        // 如果没有处理函数了，取消订阅
        if (handlers.size === 0) {
          conn.handlers.delete(normalizedStream)
          conn.subscriptions.delete(normalizedStream)
          streamsToUnsubscribe.push(normalizedStream)
        }
      }
    })

    // 发送取消订阅消息
    if (streamsToUnsubscribe.length > 0 && conn.ws?.readyState === WebSocket.OPEN) {
      this.sendUnsubscribe(market, streamsToUnsubscribe)
    }

    // 如果没有任何订阅了，关闭连接
    if (conn.subscriptions.size === 0 && conn.ws) {
      this.disconnect(market)
    }
  }

  /**
   * 建立 WebSocket 连接
   */
  private connect(market: MarketType): void {
    const conn = this.connections.get(market)!

    // 避免重复连接
    if (conn.ws && (conn.state === 'connecting' || conn.state === 'connected')) {
      return
    }

    this.updateState(market, 'connecting')

    const endpoint = this.ENDPOINTS[market]
    const ws = new WebSocket(endpoint)

    ws.onopen = () => {
      console.log(`[WS] ${market} connected`)
      conn.reconnectAttempts = 0
      this.updateState(market, 'connected')

      // 订阅所有流
      if (conn.subscriptions.size > 0) {
        this.sendSubscribe(market, Array.from(conn.subscriptions))
      }

      // 启动心跳
      this.startHeartbeat(market)
    }

    ws.onmessage = (event) => {
      this.handleMessage(market, event.data)
    }

    ws.onclose = (event) => {
      console.log(`[WS] ${market} closed: ${event.code}`)
      this.handleDisconnect(market)
    }

    ws.onerror = (error) => {
      console.error(`[WS] ${market} error:`, error)
    }

    conn.ws = ws
  }

  /**
   * 断开连接
   */
  disconnect(market: MarketType): void {
    const conn = this.connections.get(market)!

    // 清除定时器
    if (conn.heartbeatInterval) {
      clearInterval(conn.heartbeatInterval)
      conn.heartbeatInterval = null
    }
    if (conn.reconnectTimeout) {
      clearTimeout(conn.reconnectTimeout)
      conn.reconnectTimeout = null
    }

    // 关闭连接
    if (conn.ws) {
      conn.ws.close(1000, 'Client disconnect')
      conn.ws = null
    }

    this.updateState(market, 'disconnected')
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {
    const markets: MarketType[] = ['spot', 'futures-usdt', 'futures-coin']
    markets.forEach((market) => this.disconnect(market))
  }

  /**
   * 发送订阅消息
   */
  private sendSubscribe(market: MarketType, streams: string[]): void {
    const conn = this.connections.get(market)!
    if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) return

    // 分批发送（每批最多 200 个流）
    for (let i = 0; i < streams.length; i += this.MAX_STREAMS_PER_MESSAGE) {
      const batch = streams.slice(i, i + this.MAX_STREAMS_PER_MESSAGE)
      const message = {
        method: 'SUBSCRIBE',
        params: batch,
        id: Date.now() + i,
      }
      conn.ws.send(JSON.stringify(message))
    }
  }

  /**
   * 发送取消订阅消息
   */
  private sendUnsubscribe(market: MarketType, streams: string[]): void {
    const conn = this.connections.get(market)!
    if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) return

    const message = {
      method: 'UNSUBSCRIBE',
      params: streams,
      id: Date.now(),
    }
    conn.ws.send(JSON.stringify(message))
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(market: MarketType, rawData: string): void {
    const conn = this.connections.get(market)!

    try {
      const data = JSON.parse(rawData)

      // Combined stream 格式: { stream: "btcusdt@ticker", data: {...} }
      if (data.stream && data.data) {
        const handlers = conn.handlers.get(data.stream)
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(data.data)
            } catch (error) {
              console.error(`[WS] Handler error for ${data.stream}:`, error)
            }
          })
        }
      }

      // 订阅确认消息
      if (data.result === null && data.id) {
        // 订阅成功
      }
    } catch (error) {
      console.error(`[WS] Message parse error:`, error)
    }
  }

  /**
   * 处理断线
   */
  private handleDisconnect(market: MarketType): void {
    const conn = this.connections.get(market)!

    // 清除心跳
    if (conn.heartbeatInterval) {
      clearInterval(conn.heartbeatInterval)
      conn.heartbeatInterval = null
    }

    // 如果没有订阅，不需要重连
    if (conn.subscriptions.size === 0) {
      this.updateState(market, 'disconnected')
      return
    }

    // 尝试重连
    if (conn.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.updateState(market, 'reconnecting')

      // 指数退避
      const delay = this.BASE_RECONNECT_DELAY * Math.pow(2, conn.reconnectAttempts)
      console.log(`[WS] ${market} reconnecting in ${delay}ms (attempt ${conn.reconnectAttempts + 1})`)

      conn.reconnectTimeout = setTimeout(() => {
        conn.reconnectAttempts++
        conn.ws = null
        this.connect(market)
      }, delay)
    } else {
      console.error(`[WS] ${market} max reconnect attempts reached`)
      this.updateState(market, 'disconnected')
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(market: MarketType): void {
    const conn = this.connections.get(market)!

    // 清除旧的心跳
    if (conn.heartbeatInterval) {
      clearInterval(conn.heartbeatInterval)
    }

    conn.heartbeatInterval = setInterval(() => {
      if (conn.ws?.readyState === WebSocket.OPEN) {
        // 发送 ping 或列表订阅来保持连接
        const message = {
          method: 'LIST_SUBSCRIPTIONS',
          id: Date.now(),
        }
        conn.ws.send(JSON.stringify(message))
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * 更新连接状态
   */
  private updateState(market: MarketType, state: ConnectionState): void {
    const conn = this.connections.get(market)!
    conn.state = state

    // 通知状态变化
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(market, state)
      } catch (error) {
        console.error('[WS] State change callback error:', error)
      }
    })
  }

  /**
   * 监听连接状态变化
   */
  onStateChange(callback: (market: MarketType, state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback)
    return () => this.stateChangeCallbacks.delete(callback)
  }

  /**
   * 获取连接状态
   */
  getState(market: MarketType): ConnectionState {
    return this.connections.get(market)!.state
  }

  /**
   * 获取订阅列表
   */
  getSubscriptions(market: MarketType): string[] {
    return Array.from(this.connections.get(market)!.subscriptions)
  }
}

// 导出单例实例
export const wsManager = new WebSocketManager()

// 便捷订阅函数
export function subscribeSpot(streams: string[], handler: MessageHandler): () => void {
  wsManager.subscribe('spot', streams, handler)
  return () => wsManager.unsubscribe('spot', streams, handler)
}

export function subscribeFuturesUsdt(streams: string[], handler: MessageHandler): () => void {
  wsManager.subscribe('futures-usdt', streams, handler)
  return () => wsManager.unsubscribe('futures-usdt', streams, handler)
}

export function subscribeFuturesCoin(streams: string[], handler: MessageHandler): () => void {
  wsManager.subscribe('futures-coin', streams, handler)
  return () => wsManager.unsubscribe('futures-coin', streams, handler)
}

// 流名称生成工具
export const streamNames = {
  /** 单个交易对 ticker */
  ticker: (symbol: string) => `${symbol.toLowerCase()}@ticker`,

  /** K 线 */
  kline: (symbol: string, interval: string) =>
    `${symbol.toLowerCase()}@kline_${interval}`,

  /** 深度 */
  depth: (symbol: string, levels: number = 20) =>
    `${symbol.toLowerCase()}@depth${levels}@100ms`,

  /** 成交 */
  trade: (symbol: string) => `${symbol.toLowerCase()}@trade`,

  /** 标记价格 */
  markPrice: (symbol: string) => `${symbol.toLowerCase()}@markPrice`,

  /** 全市场 mini ticker (谨慎使用) */
  allMiniTickers: () => '!miniTicker@arr',
}
