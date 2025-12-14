'use client'

import { useLanguage } from '@/lib/store/ui'
import { Calendar, Sparkles, ExternalLink, AlertTriangle, Globe } from 'lucide-react'

/**
 * 活动聚合页面
 *
 * 限制说明：
 * - Binance 没有公开的公告 API
 * - REST API 被 CORS 阻止，无法获取活动数据
 * - 本页面提供外部链接作为替代方案
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
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {language === 'zh' ? 'Binance 公告中心' : 'Announcement Center'}
          </a>
        </div>
      </div>

      {/* 数据限制提示 */}
      <div className="mx-4 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-500 mb-1">
              {language === 'zh' ? '纯前端模式数据限制' : 'Frontend-Only Mode Limitations'}
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'zh'
                ? 'Binance 没有公开的公告 API，且 REST API 被 CORS 阻止。本页面提供外部链接，请直接访问 Binance 官网获取最新活动信息。'
                : 'Binance does not provide a public announcement API, and REST API is blocked by CORS. This page provides external links. Please visit Binance website directly for latest activity information.'}
            </p>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 公告类别 */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {language === 'zh' ? 'Binance 公告' : 'Binance Announcements'}
              </h3>
            </div>
            <div className="space-y-2">
              <ExternalLinkCard
                href="https://www.binance.com/en/support/announcement/new-cryptocurrency-listing"
                title={language === 'zh' ? '新上币公告' : 'New Listings'}
                description={
                  language === 'zh'
                    ? '最新上线的加密货币'
                    : 'Latest cryptocurrency listings'
                }
              />
              <ExternalLinkCard
                href="https://www.binance.com/en/support/announcement/delisting"
                title={language === 'zh' ? '下架公告' : 'Delisting'}
                description={
                  language === 'zh'
                    ? '即将下架的交易对'
                    : 'Trading pairs to be delisted'
                }
              />
              <ExternalLinkCard
                href="https://www.binance.com/en/support/announcement/api-updates"
                title="API Updates"
                description={
                  language === 'zh'
                    ? 'API 更新和变更通知'
                    : 'API updates and change notifications'
                }
              />
              <ExternalLinkCard
                href="https://www.binance.com/en/support/announcement/futures"
                title={language === 'zh' ? '合约公告' : 'Futures Announcements'}
                description={
                  language === 'zh'
                    ? '合约相关公告和更新'
                    : 'Futures related announcements'
                }
              />
            </div>
          </div>

          {/* Launchpad/Launchpool */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Launchpad & Launchpool</h3>
            </div>
            <div className="space-y-2">
              <ExternalLinkCard
                href="https://launchpad.binance.com/en/launchpool"
                title="Launchpool"
                description={
                  language === 'zh'
                    ? '质押 BNB/FDUSD 免费获取新币'
                    : 'Stake BNB/FDUSD to earn new tokens for free'
                }
              />
              <ExternalLinkCard
                href="https://launchpad.binance.com/en/launchpad"
                title="Launchpad"
                description={
                  language === 'zh'
                    ? '使用 BNB 参与新项目 IEO'
                    : 'Participate in new project IEOs with BNB'
                }
              />
              <ExternalLinkCard
                href="https://www.binance.com/en/activity"
                title={language === 'zh' ? '活动中心' : 'Promotions'}
                description={
                  language === 'zh'
                    ? '交易活动、空投和奖励'
                    : 'Trading promotions, airdrops and rewards'
                }
              />
            </div>
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

          {/* 社交媒体 */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {language === 'zh' ? '官方渠道' : 'Official Channels'}
              </h3>
            </div>
            <div className="space-y-2">
              <ExternalLinkCard
                href="https://twitter.com/binance"
                title="Twitter / X"
                description="@binance"
              />
              <ExternalLinkCard
                href="https://t.me/binanceexchange"
                title="Telegram"
                description={language === 'zh' ? 'Binance 官方群' : 'Official Binance Group'}
              />
              <ExternalLinkCard
                href="https://www.binance.com/en/blog"
                title="Binance Blog"
                description={
                  language === 'zh'
                    ? '深度文章和行业分析'
                    : 'In-depth articles and industry analysis'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 外部链接卡片 */
function ExternalLinkCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div>
        <div className="font-medium text-sm group-hover:text-primary transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
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
