/**
 * Binance COIN-M 合约 API 代理
 *
 * 将请求转发到 https://dapi.binance.com
 * 支持通过 HTTP_PROXY/HTTPS_PROXY 环境变量设置代理
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyFetch } from '@/lib/proxy-fetch'

const BINANCE_FUTURES_COIN_API = 'https://dapi.binance.com'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now()

  try {
    const { path } = await params
    const pathname = '/' + path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BINANCE_FUTURES_COIN_API}${pathname}${searchParams ? `?${searchParams}` : ''}`

    console.log(`[Futures COIN Proxy] Fetching: ${url}`)

    const response = await proxyFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    console.log(`[Futures COIN Proxy] Success: ${pathname} (${duration}ms)`)

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Access-Control-Allow-Origin', '*')

    const usedWeight = response.headers.get('X-MBX-USED-WEIGHT-1M')
    if (usedWeight) {
      headers.set('X-MBX-USED-WEIGHT-1M', usedWeight)
    }

    return NextResponse.json(data, {
      status: response.status,
      headers,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[Futures COIN Proxy Error] ${errorMessage} (${duration}ms)`)

    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout', message: '请求超时，请检查网络或代理设置' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Proxy request failed', message: errorMessage },
      { status: 500 }
    )
  }
}
