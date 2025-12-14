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

/** 调试模式 */
const DEBUG = true
const log = (...args: unknown[]) => DEBUG && console.log('[WS]', ...args)
const logError = (...args: unknown[]) => console.error('[WS]', ...args)

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

  // 端点映射（只使用官方确认的端点）
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

    log(`subscribe called: market=${market}, streams=`, streams)

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

    log(`current subscriptions for ${market}:`, Array.from(conn.subscriptions))
    log(`current handlers for ${market}:`, Array.from(conn.handlers.keys()))

    // 如果有新流需要订阅
    if (newStreams.length > 0) {
      log(`new streams to subscribe:`, newStreams)
      // 确保连接已建立
      if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) {
        log(`ws not connected, connecting...`)
        this.connect(market)
      } else {
        log(`ws already connected, sending subscribe`)
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

    log(`unsubscribe called: market=${market}, streams=`, streams)

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

    log(`after unsubscribe, subscriptions for ${market}:`, Array.from(conn.subscriptions))

    // 发送取消订阅消息
    if (streamsToUnsubscribe.length > 0 && conn.ws?.readyState === WebSocket.OPEN) {
      this.sendUnsubscribe(market, streamsToUnsubscribe)
    }

    // 如果没有任何订阅了，延迟关闭连接（避免 React StrictMode 导致的问题）
    if (conn.subscriptions.size === 0 && conn.ws) {
      log(`${market} no subscriptions left, will close connection in 2s`)
      setTimeout(() => {
        // 再次检查是否仍然没有订阅
        const currentConn = this.connections.get(market)!
        if (currentConn.subscriptions.size === 0 && currentConn.ws) {
          log(`${market} still no subscriptions, closing connection`)
          this.disconnect(market)
        } else {
          log(`${market} has new subscriptions, keeping connection`)
        }
      }, 2000)
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

    // 清理旧连接
    if (conn.ws) {
      try {
        conn.ws.close()
      } catch (e) {
        // 忽略关闭错误
      }
      conn.ws = null
    }

    this.updateState(market, 'connecting')

    const endpoint = this.ENDPOINTS[market]
    console.log(`[WS] ${market} connecting to ${endpoint}`)
    const ws = new WebSocket(endpoint)

    ws.onopen = () => {
      log(`${market} connected to ${endpoint}`)
      conn.reconnectAttempts = 0
      this.updateState(market, 'connected')

      // 订阅所有流
      if (conn.subscriptions.size > 0) {
        log(`${market} sending subscriptions:`, Array.from(conn.subscriptions))
        this.sendSubscribe(market, Array.from(conn.subscriptions))
      } else {
        log(`${market} no subscriptions to send`)
      }

      // 启动心跳
      this.startHeartbeat(market)
    }

    ws.onmessage = (event) => {
      this.handleMessage(market, event.data)
    }

    ws.onclose = (event) => {
      log(`${market} closed: code=${event.code}, reason=${event.reason || 'none'}`)
      this.handleDisconnect(market)
    }

    ws.onerror = (error) => {
      logError(`${market} error:`, error)
      // onerror 后会触发 onclose，在 onclose 中处理重连
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
    if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) {
      log(`${market} cannot send subscribe, ws not open`)
      return
    }

    // 分批发送（每批最多 200 个流）
    for (let i = 0; i < streams.length; i += this.MAX_STREAMS_PER_MESSAGE) {
      const batch = streams.slice(i, i + this.MAX_STREAMS_PER_MESSAGE)
      const message = {
        method: 'SUBSCRIBE',
        params: batch,
        id: Date.now() + i,
      }
      log(`${market} sending subscribe message:`, message)
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

      // 订阅确认消息
      if (data.result === null && data.id) {
        log(`${market} subscription confirmed, id: ${data.id}`)
        return
      }

      // 错误消息
      if (data.error) {
        logError(`${market} error response:`, data.error)
        return
      }

      // Combined stream 格式: { stream: "btcusdt@ticker", data: {...} }
      if (data.stream && data.data !== undefined) {
        const streamName = data.stream.toLowerCase()
        log(`${market} received stream: ${streamName}, handlers:`, Array.from(conn.handlers.keys()))

        const handlers = conn.handlers.get(streamName)

        if (handlers && handlers.size > 0) {
          log(`${market} found ${handlers.size} handlers for ${streamName}`)
          handlers.forEach((handler) => {
            try {
              handler(data.data)
            } catch (error) {
              logError(`Handler error for ${streamName}:`, error)
            }
          })
        } else {
          log(`${market} no direct handler for ${streamName}, trying pattern match`)
          // 尝试匹配通配符流（如 !ticker@arr）
          let matched = false
          conn.handlers.forEach((handlerSet, registeredStream) => {
            if (streamName === registeredStream ||
                streamName.includes(registeredStream) ||
                registeredStream.includes(streamName)) {
              log(`${market} pattern matched: ${registeredStream}`)
              matched = true
              handlerSet.forEach((handler) => {
                try {
                  handler(data.data)
                } catch (error) {
                  logError(`Handler error for ${registeredStream}:`, error)
                }
              })
            }
          })
          if (!matched) {
            log(`${market} no handler matched for stream: ${streamName}`)
          }
        }
        return
      }

      // 单流格式（直接是数据对象，带 e 字段表示事件类型）
      if (data.e) {
        const eventType = data.e
        log(`${market} received event: ${eventType}, symbol: ${data.s || 'N/A'}`)

        // 根据事件类型分发
        let streamPattern = ''

        if (eventType === '24hrTicker') {
          streamPattern = data.s ? `${data.s.toLowerCase()}@ticker` : '!ticker@arr'
        } else if (eventType === 'kline') {
          streamPattern = data.s ? `${data.s.toLowerCase()}@kline_${data.k?.i}` : ''
        } else if (eventType === 'depthUpdate') {
          streamPattern = data.s ? `${data.s.toLowerCase()}@depth` : ''
        } else if (eventType === 'trade' || eventType === 'aggTrade') {
          streamPattern = data.s ? `${data.s.toLowerCase()}@trade` : ''
        } else if (eventType === 'markPriceUpdate') {
          streamPattern = data.s ? `${data.s.toLowerCase()}@markprice` : '!markprice@arr@1s'
        }

        log(`${market} stream pattern: ${streamPattern}`)

        // 分发到所有匹配的处理器
        let matched = false
        conn.handlers.forEach((handlerSet, registeredStream) => {
          const normalizedRegistered = registeredStream.toLowerCase()
          if (normalizedRegistered === streamPattern ||
              normalizedRegistered.includes('!ticker@arr') ||
              normalizedRegistered.includes('!markprice@arr')) {
            log(`${market} event matched handler: ${registeredStream}`)
            matched = true
            handlerSet.forEach((handler) => {
              try {
                handler(data)
              } catch (error) {
                logError(`Handler error:`, error)
              }
            })
          }
        })
        if (!matched) {
          log(`${market} no handler matched for event: ${eventType}`)
        }
      }
    } catch (error) {
      logError(`Message parse error:`, error, rawData.substring(0, 200))
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
