'use client'

import { DraggableGrid, WidgetConfig } from '@/components/dashboard/DraggableGrid'
import {
  MarketOverview,
  TopGainers,
  TopLosers,
  TopVolume,
  FundingRateWidget,
} from '@/components/dashboard/widgets'
import { AnnouncementPanel } from '@/components/activities/AnnouncementPanel'
import { LaunchpadPanel } from '@/components/activities/LaunchpadPanel'
import { useLanguage } from '@/lib/store/ui'

/**
 * Dashboard 首页
 * 可定制的拖拽布局
 */
export default function Home() {
  const language = useLanguage()

  // Dashboard Widgets 配置
  const widgets: WidgetConfig[] = [
    {
      id: 'market-overview',
      title: { zh: '市场概览', en: 'Market Overview' },
      component: <MarketOverview />,
      defaultLayout: { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
      id: 'top-gainers',
      title: { zh: '涨幅榜', en: 'Top Gainers' },
      component: <TopGainers />,
      defaultLayout: { x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
      id: 'top-losers',
      title: { zh: '跌幅榜', en: 'Top Losers' },
      component: <TopLosers />,
      defaultLayout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
      id: 'top-volume',
      title: { zh: '成交额榜', en: 'Top Volume' },
      component: <TopVolume />,
      defaultLayout: { x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
      id: 'funding-rate',
      title: { zh: '资金费率', en: 'Funding Rate' },
      component: <FundingRateWidget />,
      defaultLayout: { x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
      id: 'announcements',
      title: { zh: 'Binance 公告', en: 'Announcements' },
      component: <AnnouncementPanel className="h-full border-0" />,
      defaultLayout: { x: 8, y: 4, w: 4, h: 5, minW: 3, minH: 4 },
    },
    {
      id: 'launchpad',
      title: { zh: 'Launchpad/Launchpool', en: 'Launchpad/Launchpool' },
      component: <LaunchpadPanel className="h-full border-0" />,
      defaultLayout: { x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
    },
  ]

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* 页面标题 */}
      <div className="p-4 border-b border-border bg-card">
        <h1 className="text-xl font-bold">
          {language === 'zh' ? '交易看板' : 'Trading Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === 'zh'
            ? '拖拽组件自定义您的看板布局'
            : 'Drag widgets to customize your dashboard layout'}
        </p>
      </div>

      {/* 可拖拽 Dashboard */}
      <div className="flex-1 overflow-y-auto p-4">
        <DraggableGrid
          widgets={widgets}
          storageKey="home-dashboard"
          cols={12}
          rowHeight={60}
        />
      </div>
    </div>
  )
}
