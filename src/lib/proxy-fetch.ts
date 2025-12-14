/**
 * 支持代理的 fetch 工具
 *
 * 自动检测环境变量中的代理设置：
 * - HTTP_PROXY / http_proxy
 * - HTTPS_PROXY / https_proxy
 */

import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from 'undici'

// 获取代理 URL
function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  )
}

// 创建代理 agent
let proxyAgent: ProxyAgent | undefined

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = getProxyUrl()

  if (!proxyUrl) {
    return undefined
  }

  if (!proxyAgent) {
    console.log(`[Proxy] Using proxy: ${proxyUrl}`)
    proxyAgent = new ProxyAgent(proxyUrl)
  }

  return proxyAgent
}

interface ProxyFetchOptions {
  method?: string
  headers?: Record<string, string>
  timeout?: number
}

/**
 * 支持代理的 fetch
 */
export async function proxyFetch(
  url: string,
  options: ProxyFetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, method = 'GET', headers = {} } = options
  const agent = getProxyAgent()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const requestInit: UndiciRequestInit = {
      method,
      headers,
      signal: controller.signal,
    }

    if (agent) {
      requestInit.dispatcher = agent
    }

    const response = await undiciFetch(url, requestInit)

    clearTimeout(timeoutId)

    // 转换为标准 Response 格式
    return response as unknown as Response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
