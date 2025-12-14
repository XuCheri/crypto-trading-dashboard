'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  Time,
  LineSeries,
  AreaSeries,
} from 'lightweight-charts'
import { useQuery } from '@tanstack/react-query'
import { getOpenInterestHist, transformOpenInterestHist } from '@/lib/api/futures'
import { formatVolume, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

interface OpenInterestChartProps {
  symbol: string
  className?: string
  height?: number
}

type Period = '5m' | '15m' | '30m' | '1h' | '4h' | '1d'

const PERIODS: { value: Period; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
]

const CHART_COLORS = {
  background: 'transparent',
  textColor: 'rgba(156, 163, 175, 0.9)',
  gridColor: 'rgba(42, 46, 57, 0.5)',
  borderColor: 'rgba(42, 46, 57, 0.8)',
  lineColor: '#3b82f6',
  areaTopColor: 'rgba(59, 130, 246, 0.4)',
  areaBottomColor: 'rgba(59, 130, 246, 0.05)',
}

/**
 * 持仓量图表组件
 * 显示历史持仓量趋势
 */
export function OpenInterestChart({
  symbol,
  className,
  height = 300,
}: OpenInterestChartProps) {
  const language = useLanguage()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  const [period, setPeriod] = useState<Period>('1h')

  // 获取持仓量历史数据
  const { data: oiData, isLoading } = useQuery({
    queryKey: ['openInterestHist', symbol, period],
    queryFn: async () => {
      const raw = await getOpenInterestHist(symbol, period, 100)
      return raw.map(transformOpenInterestHist)
    },
    enabled: !!symbol,
    refetchInterval: 60000,
  })

  // 创建图表
  useEffect(() => {
    if (!chartContainerRef.current) return

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
        vertLine: { labelBackgroundColor: '#363A45' },
        horzLine: { labelBackgroundColor: '#363A45' },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.borderColor,
      },
      timeScale: {
        borderColor: CHART_COLORS.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    })

    // 创建面积图系列 (v5 API)
    const series = chart.addSeries(AreaSeries, {
      lineColor: CHART_COLORS.lineColor,
      topColor: CHART_COLORS.areaTopColor,
      bottomColor: CHART_COLORS.areaBottomColor,
      lineWidth: 2,
    })

    chartRef.current = chart
    seriesRef.current = series

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // 更新图表数据
  useEffect(() => {
    if (!oiData || !seriesRef.current) return

    const chartData = oiData.map((item) => ({
      time: Math.floor(item.time / 1000) as Time,
      value: item.openInterestValue || item.openInterest,
    }))

    seriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()
  }, [oiData])

  // 计算统计信息
  const stats = oiData && oiData.length > 0 ? {
    current: oiData[oiData.length - 1].openInterestValue || oiData[oiData.length - 1].openInterest,
    change: oiData.length > 1
      ? ((oiData[oiData.length - 1].openInterestValue || oiData[oiData.length - 1].openInterest) -
         (oiData[0].openInterestValue || oiData[0].openInterest)) /
        (oiData[0].openInterestValue || oiData[0].openInterest) * 100
      : 0,
  } : null

  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">
              {language === 'zh' ? '持仓量' : 'Open Interest'}
            </h3>
            <div className="text-xs text-muted-foreground mt-0.5">
              {symbol}
            </div>
          </div>
          {stats && (
            <div className="text-right">
              <div className="font-semibold tabular-nums">
                ${formatVolume(stats.current)}
              </div>
              <div
                className={cn(
                  'text-xs tabular-nums',
                  stats.change >= 0 ? 'text-up' : 'text-down'
                )}
              >
                {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {/* 周期选择器 */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
