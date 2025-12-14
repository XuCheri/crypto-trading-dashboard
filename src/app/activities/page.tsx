'use client'

import { useLanguage } from '@/lib/store/ui'
import { AnnouncementPanel } from '@/components/activities/AnnouncementPanel'
import { LaunchpadPanel } from '@/components/activities/LaunchpadPanel'
import { Calendar, Sparkles, ExternalLink } from 'lucide-react'

/**
 * 活动聚合页面
 * 展示 Binance 公告、Launchpad、Launchpool 等活动信息
 */
export default function ActivitiesPage() {
  const language = useLanguage()

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">
              {language === 'zh' ? '活动聚合' : 'Activities Hub'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'zh'
                ? 'Binance 最新公告、Launchpad 与 Launchpool 活动'
                : 'Latest Binance announcements, Launchpad & Launchpool events'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.binance.com/en/support/announcement"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-accent rounded-lg hover:bg-accent/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {language === 'zh' ? 'Binance 公告中心' : 'Announcement Center'}
          </a>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 公告面板 */}
          <div className="lg:row-span-2">
            <AnnouncementPanel className="h-full min-h-[500px]" />
          </div>

          {/* Launchpad/Launchpool 面板 */}
          <div>
            <LaunchpadPanel className="h-full min-h-[400px]" />
          </div>

          {/* 日历提醒卡片 */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {language === 'zh' ? '重要日期' : 'Important Dates'}
              </h3>
            </div>
            <div className="space-y-3">
              <DateItem
                date={language === 'zh' ? '每8小时' : 'Every 8h'}
                event={language === 'zh' ? '资金费率结算' : 'Funding Rate Settlement'}
                times={['00:00', '08:00', '16:00']}
              />
              <DateItem
                date={language === 'zh' ? '每周一' : 'Weekly'}
                event={language === 'zh' ? '新币上线高峰' : 'New Listing Peak'}
              />
              <DateItem
                date={language === 'zh' ? '每月' : 'Monthly'}
                event={language === 'zh' ? 'Launchpool 新项目' : 'New Launchpool Projects'}
              />
            </div>

            {/* 提示 */}
            <div className="mt-4 p-3 bg-accent/50 rounded-lg text-xs text-muted-foreground">
              {language === 'zh'
                ? '提示：关注 Binance 官方公告获取最新活动信息，新上币通常伴随较大波动。'
                : 'Tip: Follow official Binance announcements for latest events. New listings often come with high volatility.'}
            </div>
          </div>
        </div>

        {/* 快捷链接 */}
        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-3">
            {language === 'zh' ? '快捷链接' : 'Quick Links'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <QuickLink
              href="https://www.binance.com/en/support/announcement/new-cryptocurrency-listing"
              label={language === 'zh' ? '新上币' : 'New Listings'}
            />
            <QuickLink
              href="https://launchpad.binance.com/en/launchpool"
              label="Launchpool"
            />
            <QuickLink
              href="https://launchpad.binance.com/en/launchpad"
              label="Launchpad"
            />
            <QuickLink
              href="https://www.binance.com/en/support/announcement/delisting"
              label={language === 'zh' ? '下架公告' : 'Delisting'}
            />
            <QuickLink
              href="https://www.binance.com/en/support/announcement/api-updates"
              label="API Updates"
            />
            <QuickLink
              href="https://www.binance.com/en/activity"
              label={language === 'zh' ? '活动中心' : 'Promotions'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 日期项组件 */
function DateItem({
  date,
  event,
  times,
}: {
  date: string
  event: string
  times?: string[]
}) {
  return (
    <div className="flex items-start justify-between p-2 bg-accent/30 rounded">
      <div>
        <div className="text-xs text-muted-foreground">{date}</div>
        <div className="text-sm font-medium">{event}</div>
      </div>
      {times && (
        <div className="flex gap-1">
          {times.map((time) => (
            <span
              key={time}
              className="px-1.5 py-0.5 text-xs bg-background rounded"
            >
              {time}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** 快捷链接组件 */
function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-accent rounded-lg hover:bg-accent/80 transition-colors text-center"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}
