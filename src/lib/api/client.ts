/**
 * Binance API 客户端
 *
 * 功能:
 * - 封装 fetch 请求
 * - 请求权重追踪（读取 X-MBX-USED-WEIGHT 响应头）
 * - 频率限制处理（权重超限时延迟）
 * - 错误处理与重试
 */

import { API_ENDPOINTS } from './types'

/** API 错误类型 */
export class BinanceApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public endpoint: string
  ) {
    super(message)
    this.name = 'BinanceApiError'
  }
}

/** 频率限制状态 */
interface RateLimitState {
  usedWeight: number
  resetTime: number
  limit: number
}

/** 请求配置 */
interface RequestConfig {
  weight?: number // 请求权重，默认 1
  retries?: number // 重试次数，默认 3
}

/** API 客户端类 */
class BinanceClient {
  private rateLimits: Map<string, RateLimitState> = new Map()

  // 不同 API 的权重限制（每分钟）
  private readonly WEIGHT_LIMITS: Record<string, number> = {
    [API_ENDPOINTS.SPOT]: 1200,
    [API_ENDPOINTS.FUTURES_USDT]: 2400,
    [API_ENDPOINTS.FUTURES_COIN]: 2400,
  }

  constructor() {
    // 初始化频率限制状态
    Object.keys(this.WEIGHT_LIMITS).forEach((baseUrl) => {
      this.rateLimits.set(baseUrl, {
        usedWeight: 0,
        resetTime: Date.now() + 60000,
        limit: this.WEIGHT_LIMITS[baseUrl],
      })
    })
  }

  /**
   * 发起 GET 请求
   */
  async get<T>(
    baseUrl: string,
    endpoint: string,
    params?: Record<string, string | number>,
    config?: RequestConfig
  ): Promise<T> {
    const { weight = 1, retries = 3 } = config || {}
    const url = this.buildUrl(baseUrl, endpoint, params)

    // 检查并等待频率限制
    await this.checkRateLimit(baseUrl, weight)

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // 更新频率限制状态
        this.updateRateLimitFromHeaders(baseUrl, response.headers)

        // 处理错误响应
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new BinanceApiError(
            errorData.msg || `HTTP ${response.status}`,
            errorData.code || response.status,
            endpoint
          )
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error

        // 如果是频率限制错误（429），等待后重试
        if (error instanceof BinanceApiError && error.code === 429) {
          const waitTime = this.getWaitTime(baseUrl)
          console.warn(`Rate limit hit, waiting ${waitTime}ms before retry...`)
          await this.delay(waitTime)
          continue
        }

        // 其他错误，如果还有重试次数，使用指数退避
        if (attempt < retries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000)
          await this.delay(backoffTime)
          continue
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  /**
   * 构建完整 URL
   */
  private buildUrl(
    baseUrl: string,
    endpoint: string,
    params?: Record<string, string | number>
  ): string {
    const url = new URL(endpoint, baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return url.toString()
  }

  /**
   * 检查频率限制，必要时等待
   */
  private async checkRateLimit(baseUrl: string, weight: number): Promise<void> {
    const state = this.rateLimits.get(baseUrl)
    if (!state) return

    const now = Date.now()

    // 如果已过重置时间，重置权重
    if (now >= state.resetTime) {
      state.usedWeight = 0
      state.resetTime = now + 60000
    }

    // 如果即将超限，等待
    if (state.usedWeight + weight > state.limit * 0.9) {
      const waitTime = state.resetTime - now
      if (waitTime > 0) {
        console.warn(`Approaching rate limit, waiting ${waitTime}ms...`)
        await this.delay(waitTime)
        state.usedWeight = 0
        state.resetTime = Date.now() + 60000
      }
    }

    // 预增加权重
    state.usedWeight += weight
  }

  /**
   * 从响应头更新频率限制状态
   */
  private updateRateLimitFromHeaders(baseUrl: string, headers: Headers): void {
    const state = this.rateLimits.get(baseUrl)
    if (!state) return

    // 现货 API
    const spotWeight = headers.get('X-MBX-USED-WEIGHT-1M')
    if (spotWeight) {
      state.usedWeight = parseInt(spotWeight, 10)
    }

    // 合约 API
    const futuresWeight = headers.get('X-MBX-USED-WEIGHT-1M')
    if (futuresWeight) {
      state.usedWeight = parseInt(futuresWeight, 10)
    }
  }

  /**
   * 获取需要等待的时间
   */
  private getWaitTime(baseUrl: string): number {
    const state = this.rateLimits.get(baseUrl)
    if (!state) return 60000

    const waitTime = state.resetTime - Date.now()
    return waitTime > 0 ? waitTime : 60000
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 获取当前频率限制状态（用于调试）
   */
  getRateLimitStatus(baseUrl: string): RateLimitState | undefined {
    return this.rateLimits.get(baseUrl)
  }
}

// 导出单例实例
export const binanceClient = new BinanceClient()

// 便捷方法
export const spotApi = {
  get: <T>(endpoint: string, params?: Record<string, string | number>, config?: RequestConfig) =>
    binanceClient.get<T>(API_ENDPOINTS.SPOT, endpoint, params, config),
}

export const futuresUsdtApi = {
  get: <T>(endpoint: string, params?: Record<string, string | number>, config?: RequestConfig) =>
    binanceClient.get<T>(API_ENDPOINTS.FUTURES_USDT, endpoint, params, config),
}

export const futuresCoinApi = {
  get: <T>(endpoint: string, params?: Record<string, string | number>, config?: RequestConfig) =>
    binanceClient.get<T>(API_ENDPOINTS.FUTURES_COIN, endpoint, params, config),
}
