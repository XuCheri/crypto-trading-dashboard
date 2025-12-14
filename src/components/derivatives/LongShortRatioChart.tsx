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
} from 'lightweight-charts'
import { useQuery } from '@tanstack/react-query'
import { getLongShortRatio } from '@/lib/api/futures'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'

interface LongShortRatioChartProps {
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
  lineColor: '#f59e0b',
  neutralLine: '#64748b',
}

/**
 * 多空比图表组件
 * 显示全局多空账户比例
 */
export function LongShortRatioChart({
  symbol,
  className,
  height = 250,
}: LongShortRatioChartProps) {
  const language = useLanguage()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const [period, setPeriod] = useState<Period>('1h')

  // 获取多空比数据
  const { data: lsrData, isLoading } = useQuery({
    queryKey: ['longShortRatio', symbol, period],
    queryFn: async () => {
      const raw = await getLongShortRatio(symbol, period, 100)
      return raw.map((item) => ({
        time: item.timestamp,
        ratio: parseFloat(item.longShortRatio),
        longAccount: parseFloat(item.longAccount),
        shortAccount: parseFloat(item.shortAccount),
      }))
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

    // 创建线图系列 (v5 API)
    const series = chart.addSeries(LineSeries, {
      color: CHART_COLORS.lineColor,
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
    if (!lsrData || !seriesRef.current) return

    const chartData = lsrData.map((item) => ({
      time: Math.floor(item.time / 1000) as Time,
      value: item.ratio,
    }))

    seriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()
  }, [lsrData])

  // 计算当前数据
  const currentData = lsrData && lsrData.length > 0 ? lsrData[lsrData.length - 1] : null

  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">
              {language === 'zh' ? '多空比' : 'Long/Short Ratio'}
            </h3>
            <div className="text-xs text-muted-foreground mt-0.5">
              {symbol} - {language === 'zh' ? '账户数' : 'Accounts'}
            </div>
          </div>
          {currentData && (
            <div className="text-right">
              <div
                className={cn(
                  'font-semibold tabular-nums text-lg',
                  currentData.ratio > 1 ? 'text-up' : currentData.ratio < 1 ? 'text-down' : ''
                )}
              >
                {currentData.ratio.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* 多空占比条 */}
        {currentData && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-up">
                {language === 'zh' ? '多' : 'Long'}: {(currentData.longAccount * 100).toFixed(1)}%
              </span>
              <span className="text-down">
                {language === 'zh' ? '空' : 'Short'}: {(currentData.shortAccount * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-up transition-all"
                style={{ width: `${currentData.longAccount * 100}%` }}
              />
              <div
                className="bg-down transition-all"
                style={{ width: `${currentData.shortAccount * 100}%` }}
              />
            </div>
          </div>
        )}

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

      {/* 说明 */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {language === 'zh'
          ? '比值 > 1：多头账户占优 | 比值 < 1：空头账户占优'
          : 'Ratio > 1: More longs | Ratio < 1: More shorts'}
      </div>
    </div>
  )
}
