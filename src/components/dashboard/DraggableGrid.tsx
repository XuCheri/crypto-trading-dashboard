'use client'

import { useState, useCallback, useEffect } from 'react'
import RGL from 'react-grid-layout'
import { useLanguage } from '@/lib/store/ui'
import { cn } from '@/lib/utils'
import { GripVertical, X } from 'lucide-react'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// 类型断言绕过 react-grid-layout 2.0 的类型不兼容问题
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = RGL as any

/** Layout 项目类型 */
interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface WidgetConfig {
  id: string
  title: { zh: string; en: string }
  component: React.ReactNode
  defaultLayout: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
}

interface DraggableGridProps {
  widgets: WidgetConfig[]
  storageKey: string
  cols?: number
  rowHeight?: number
  className?: string
  onLayoutChange?: (layout: LayoutItem[]) => void
}

/**
 * 可拖拽网格 Dashboard
 * 支持拖拽、调整大小、布局持久化
 */
export function DraggableGrid({
  widgets,
  storageKey,
  cols = 12,
  rowHeight = 80,
  className,
  onLayoutChange,
}: DraggableGridProps) {
  const language = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [layout, setLayout] = useState<LayoutItem[]>([])
  const [removedWidgets, setRemovedWidgets] = useState<Set<string>>(new Set())

  // 创建默认布局的辅助函数
  const createDefaultLayout = useCallback((): LayoutItem[] => {
    return widgets.map((w) => ({
      i: w.id,
      x: w.defaultLayout.x,
      y: w.defaultLayout.y,
      w: w.defaultLayout.w,
      h: w.defaultLayout.h,
      minW: w.defaultLayout.minW,
      minH: w.defaultLayout.minH,
      maxW: w.defaultLayout.maxW,
      maxH: w.defaultLayout.maxH,
    }))
  }, [widgets])

  // 从 localStorage 加载布局
  useEffect(() => {
    setMounted(true)

    // 获取容器宽度
    const updateWidth = () => {
      const container = document.getElementById('dashboard-container')
      if (container) {
        setContainerWidth(container.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)

    // 加载保存的布局
    try {
      const savedLayout = localStorage.getItem(`${storageKey}-layout`)
      const savedRemoved = localStorage.getItem(`${storageKey}-removed`)

      if (savedLayout) {
        setLayout(JSON.parse(savedLayout))
      } else {
        setLayout(createDefaultLayout())
      }

      if (savedRemoved) {
        setRemovedWidgets(new Set(JSON.parse(savedRemoved)))
      }
    } catch (e) {
      console.error('Failed to load layout:', e)
      setLayout(createDefaultLayout())
    }

    return () => window.removeEventListener('resize', updateWidth)
  }, [storageKey, createDefaultLayout])

  // 保存布局到 localStorage
  const saveLayout = useCallback(
    (newLayout: LayoutItem[]) => {
      try {
        localStorage.setItem(`${storageKey}-layout`, JSON.stringify(newLayout))
      } catch (e) {
        console.error('Failed to save layout:', e)
      }
    },
    [storageKey]
  )

  // 保存已移除的组件
  const saveRemovedWidgets = useCallback(
    (removed: Set<string>) => {
      try {
        localStorage.setItem(`${storageKey}-removed`, JSON.stringify(Array.from(removed)))
      } catch (e) {
        console.error('Failed to save removed widgets:', e)
      }
    },
    [storageKey]
  )

  // 处理布局变化
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback(
    (newLayout: any) => {
      const typedLayout = newLayout as LayoutItem[]
      setLayout(typedLayout)
      saveLayout(typedLayout)
      onLayoutChange?.(typedLayout)
    },
    [saveLayout, onLayoutChange]
  )

  // 移除组件
  const removeWidget = useCallback(
    (id: string) => {
      const newRemoved = new Set(removedWidgets)
      newRemoved.add(id)
      setRemovedWidgets(newRemoved)
      saveRemovedWidgets(newRemoved)
    },
    [removedWidgets, saveRemovedWidgets]
  )

  // 恢复组件
  const restoreWidget = useCallback(
    (id: string) => {
      const newRemoved = new Set(removedWidgets)
      newRemoved.delete(id)
      setRemovedWidgets(newRemoved)
      saveRemovedWidgets(newRemoved)
    },
    [removedWidgets, saveRemovedWidgets]
  )

  // 重置布局
  const resetLayout = useCallback(() => {
    setLayout(createDefaultLayout())
    setRemovedWidgets(new Set())
    localStorage.removeItem(`${storageKey}-layout`)
    localStorage.removeItem(`${storageKey}-removed`)
  }, [storageKey, createDefaultLayout])

  // 可见的组件
  const visibleWidgets = widgets.filter((w) => !removedWidgets.has(w.id))
  const hiddenWidgets = widgets.filter((w) => removedWidgets.has(w.id))

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {hiddenWidgets.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-1">
                {language === 'zh' ? '已隐藏:' : 'Hidden:'}
              </span>
              {hiddenWidgets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => restoreWidget(w.id)}
                  className="px-2 py-1 text-xs bg-accent rounded hover:bg-accent/80 transition-colors"
                >
                  + {w.title[language]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={resetLayout}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
        >
          {language === 'zh' ? '重置布局' : 'Reset Layout'}
        </button>
      </div>

      {/* 网格容器 */}
      <div id="dashboard-container" className="w-full">
        <GridLayout
          className="layout"
          layout={layout.filter((l) => !removedWidgets.has(l.i))}
          cols={cols}
          rowHeight={rowHeight}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          isResizable
          isDraggable
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {visibleWidgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-card border border-border rounded-lg overflow-hidden flex flex-col"
            >
              {/* Widget 头部 */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="widget-drag-handle cursor-move p-1 hover:bg-accent rounded">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm">{widget.title[language]}</span>
                </div>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                  title={language === 'zh' ? '隐藏' : 'Hide'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Widget 内容 */}
              <div className="flex-1 overflow-auto">{widget.component}</div>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  )
}
