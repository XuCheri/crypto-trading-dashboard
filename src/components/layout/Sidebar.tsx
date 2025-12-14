'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Coins,
  LineChart,
  BarChart3,
  Calendar,
  Settings,
  Star,
  Clock,
  ChevronLeft,
  X,
} from 'lucide-react'
import { useSidebarOpen, useFavorites, useRecentSymbols, useLanguage, useUIStore } from '@/lib/store/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

/** 导航项目类型 */
interface NavItem {
  href: string
  icon: React.ElementType
  label: { zh: string; en: string }
}

/** 导航项目（带子项） */
interface NavItemWithChildren extends NavItem {
  children?: NavItem[]
}

/** 主导航项目 */
const NAV_ITEMS: NavItemWithChildren[] = [
  {
    href: '/',
    icon: LayoutDashboard,
    label: { zh: '概览', en: 'Overview' },
  },
  {
    href: '/spot',
    icon: Coins,
    label: { zh: '现货市场', en: 'Spot Market' },
  },
  {
    href: '/futures',
    icon: LineChart,
    label: { zh: '合约市场', en: 'Futures' },
    children: [
      {
        href: '/futures/usdt-m',
        icon: LineChart,
        label: { zh: 'USDT 永续', en: 'USDT-M' },
      },
      {
        href: '/futures/coin-m',
        icon: LineChart,
        label: { zh: '币本位', en: 'COIN-M' },
      },
    ],
  },
  {
    href: '/derivatives',
    icon: BarChart3,
    label: { zh: '衍生品指标', en: 'Derivatives' },
  },
  {
    href: '/activities',
    icon: Calendar,
    label: { zh: '活动聚合', en: 'Activities' },
  },
  {
    href: '/settings',
    icon: Settings,
    label: { zh: '设置', en: 'Settings' },
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const isOpen = useSidebarOpen()
  const language = useLanguage()
  const favorites = useFavorites()
  const recentSymbols = useRecentSymbols()
  const { setSidebarOpen } = useUIStore()
  const isMobile = useIsMobile()

  // 移动端路由变化时自动关闭侧边栏
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile, setSidebarOpen])

  // 移动端初始化时关闭侧边栏
  useEffect(() => {
    if (isMobile && isOpen) {
      setSidebarOpen(false)
    }
  }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  // 桌面端：固定侧边栏
  // 移动端：overlay 模式
  const sidebarContent = (
    <aside
      className={cn(
        'h-[calc(100vh-3.5rem)] bg-card border-r border-border flex flex-col',
        // 桌面端样式
        !isMobile && 'transition-all duration-300',
        !isMobile && (isOpen ? 'w-64' : 'w-16'),
        // 移动端样式
        isMobile && 'fixed left-0 top-14 z-40 w-64 transform transition-transform duration-300',
        isMobile && (isOpen ? 'translate-x-0' : '-translate-x-full')
      )}
    >
      {/* 移动端关闭按钮 */}
      {isMobile && isOpen && (
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-semibold">
            {language === 'zh' ? '菜单' : 'Menu'}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* 主导航 */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.href}>
              <Link
                href={hasChildren ? item.children![0].href : item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                title={!isOpen && !isMobile ? item.label[language] : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(isOpen || isMobile) && (
                  <span className="text-sm font-medium truncate">
                    {item.label[language]}
                  </span>
                )}
              </Link>
              {/* 子导航 */}
              {hasChildren && (isOpen || isMobile) && isActive && (
                <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                          isChildActive
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {child.label[language]}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* 分隔线 */}
        {(isOpen || isMobile) && <div className="h-px bg-border my-4" />}

        {/* 收藏 */}
        {(isOpen || isMobile) && favorites.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Star className="h-3 w-3" />
              {language === 'zh' ? '收藏' : 'Favorites'}
            </div>
            {favorites.slice(0, 5).map((symbol) => (
              <Link
                key={symbol}
                href={`/spot?symbol=${symbol}`}
                onClick={() => isMobile && setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <span className="w-5 text-center text-xs">●</span>
                {symbol}
              </Link>
            ))}
          </div>
        )}

        {/* 最近查看 */}
        {(isOpen || isMobile) && recentSymbols.length > 0 && (
          <div className="space-y-1 mt-4">
            <div className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              {language === 'zh' ? '最近' : 'Recent'}
            </div>
            {recentSymbols.slice(0, 5).map((symbol) => (
              <Link
                key={symbol}
                href={`/spot?symbol=${symbol}`}
                onClick={() => isMobile && setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <span className="w-5 text-center text-xs">○</span>
                {symbol}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* 底部折叠按钮 - 仅桌面端显示 */}
      {!isMobile && (
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setSidebarOpen(!isOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                !isOpen && 'rotate-180'
              )}
            />
            {isOpen && (language === 'zh' ? '收起' : 'Collapse')}
          </button>
        </div>
      )}
    </aside>
  )

  return (
    <>
      {sidebarContent}
      {/* 移动端遮罩 */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 top-14 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
