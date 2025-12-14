'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  ColorType,
  CrosshairMode,
  Time,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { useQuery } from '@tanstack/react-query'
import { getKlines, transformKlines } from '@/lib/api/spot'
import { useKlineStream, KlineStreamData } from '@/hooks/useBinanceStream'
import { KlineInterval, CandlestickData as KlineData } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/** 图表配置 */
const CHART_COLORS = {
  background: 'transparent',
  textColor: 'rgba(156, 163, 175, 0.9)',
  gridColor: 'rgba(42, 46, 57, 0.5)',
  borderColor: 'rgba(42, 46, 57, 0.8)',
  upColor: '#22c55e',
  downColor: '#ef4444',
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
  volumeUpColor: 'rgba(34, 197, 94, 0.3)',
  volumeDownColor: 'rgba(239, 68, 68, 0.3)',
}

/** K 线周期选项 */
export const KLINE_INTERVALS: { value: KlineInterval; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
]

interface CandlestickChartProps {
  symbol: string
  interval?: KlineInterval
  height?: number
  showVolume?: boolean
  onIntervalChange?: (interval: KlineInterval) => void
  className?: string
}

/**
 * K 线图表组件
 * 使用 Lightweight Charts 渲染，支持实时 WebSocket 更新
 */
export function CandlestickChart({
  symbol,
  interval = '1h',
  height = 400,
  showVolume = true,
  onIntervalChange,
  className,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  // 当前选中的周期
  const [currentInterval, setCurrentInterval] = useState<KlineInterval>(interval)

  // 最后一根 K 线数据（用于实时更新）
  const lastBarRef = useRef<KlineData | null>(null)

  // 获取历史 K 线数据
  const { data: klineData, isLoading } = useQuery({
    queryKey: ['klines', symbol, currentInterval],
    queryFn: async () => {
      const raw = await getKlines(symbol, currentInterval, 500)
      return transformKlines(raw)
    },
    enabled: !!symbol,
    staleTime: 60000,
  })

  // 创建图表
  useEffect(() => {
    if (!chartContainerRef.current) return

    // 创建图表实例
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.textColor,
      },
      grid: {
        vertLines: { color: CHART_COLORS.gridColor },
        horzLines: { color: CHART_COLORS.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: '#363A45',
        },
        horzLine: {
          labelBackgroundColor: '#363A45',
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    // 创建 K 线系列 (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      wickUpColor: CHART_COLORS.wickUpColor,
      wickDownColor: CHART_COLORS.wickDownColor,
      borderVisible: false,
    })

    // 创建成交量系列 (v5 API)
    let volumeSeries: ISeriesApi<'Histogram'> | null = null
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      })

      // 设置成交量价格轴
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      })
    }

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [showVolume])

  // 更新图表数据
  useEffect(() => {
    if (!klineData || !candlestickSeriesRef.current) return

    // 格式化 K 线数据
    const candleData: CandlestickData[] = klineData.map((k) => ({
      time: k.time as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }))

    // 设置 K 线数据
    candlestickSeriesRef.current.setData(candleData)

    // 设置成交量数据
    if (volumeSeriesRef.current && showVolume) {
      const volumeData: HistogramData[] = klineData.map((k) => ({
        time: k.time as Time,
        value: k.volume || 0,
        color: k.close >= k.open ? CHART_COLORS.volumeUpColor : CHART_COLORS.volumeDownColor,
      }))
      volumeSeriesRef.current.setData(volumeData)
    }

    // 记录最后一根 K 线
    if (klineData.length > 0) {
      lastBarRef.current = klineData[klineData.length - 1]
    }

    // 自适应显示
    chartRef.current?.timeScale().fitContent()
  }, [klineData, showVolume])

  // 处理 WebSocket 实时 K 线更新
  const handleKlineUpdate = useCallback(
    (data: KlineStreamData) => {
      if (!candlestickSeriesRef.current) return

      const kline = data.k
      const newBar: CandlestickData = {
        time: Math.floor(kline.t / 1000) as Time,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
      }

      // 更新 K 线
      candlestickSeriesRef.current.update(newBar)

      // 更新成交量
      if (volumeSeriesRef.current && showVolume) {
        const volumeBar: HistogramData = {
          time: Math.floor(kline.t / 1000) as Time,
          value: parseFloat(kline.v),
          color:
            newBar.close >= newBar.open
              ? CHART_COLORS.volumeUpColor
              : CHART_COLORS.volumeDownColor,
        }
        volumeSeriesRef.current.update(volumeBar)
      }

      // 更新最后一根 K 线引用
      lastBarRef.current = {
        time: Math.floor(kline.t / 1000),
        open: newBar.open,
        high: newBar.high,
        low: newBar.low,
        close: newBar.close,
        volume: parseFloat(kline.v),
      }
    },
    [showVolume]
  )

  // 订阅 WebSocket K 线更新
  useKlineStream(symbol, currentInterval, handleKlineUpdate, {
    enabled: !!symbol && !!klineData,
  })

  // 切换周期
  const handleIntervalChange = (newInterval: KlineInterval) => {
    setCurrentInterval(newInterval)
    onIntervalChange?.(newInterval)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 周期选择器 */}
      <div className="flex items-center gap-1 mb-2 px-2">
        {KLINE_INTERVALS.map((item) => (
          <button
            key={item.value}
            onClick={() => handleIntervalChange(item.value)}
            className={cn(
              'px-3 py-1 text-sm rounded transition-colors',
              currentInterval === item.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 图表容器 */}
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
