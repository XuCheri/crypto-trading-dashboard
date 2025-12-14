'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { Bell, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  type: string
  releaseDate: number
  url: string
}

// 公告类型标签颜色
const TYPE_COLORS: Record<string, string> = {
  new_listing: 'bg-up/20 text-up',
  delisting: 'bg-down/20 text-down',
  airdrop: 'bg-purple-500/20 text-purple-400',
  maintenance: 'bg-yellow-500/20 text-yellow-400',
  default: 'bg-accent text-muted-foreground',
}

// 公告类型文本
const TYPE_TEXT: Record<string, { zh: string; en: string }> = {
  new_listing: { zh: '新上币', en: 'New Listing' },
  delisting: { zh: '下架', en: 'Delisting' },
  airdrop: { zh: '空投', en: 'Airdrop' },
  maintenance: { zh: '维护', en: 'Maintenance' },
  default: { zh: '公告', en: 'Notice' },
}

/**
 * Binance 公告面板
 * 显示最新的 Binance 公告
 */
export function AnnouncementPanel({ className }: { className?: string }) {
  const language = useLanguage()
  const [showAll, setShowAll] = useState(false)

  // 模拟获取公告数据
  // 注意：Binance 公告 API 有 CORS 限制，实际使用需要后端代理
  const { data: announcements, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['binanceAnnouncements'],
    queryFn: async (): Promise<Announcement[]> => {
      // 由于 CORS 限制，这里返回模拟数据
      // 实际项目中可以通过后端代理获取真实数据
      return [
        {
          id: '1',
          title: language === 'zh'
            ? 'Binance 将上线 XXX (XXX) 新币'
            : 'Binance Will List XXX (XXX)',
          type: 'new_listing',
          releaseDate: Date.now() - 1000 * 60 * 30,
          url: 'https://www.binance.com/en/support/announcement',
        },
        {
          id: '2',
          title: language === 'zh'
            ? 'Binance 合约平台维护公告'
            : 'Binance Futures Platform Maintenance',
          type: 'maintenance',
          releaseDate: Date.now() - 1000 * 60 * 60 * 2,
          url: 'https://www.binance.com/en/support/announcement',
        },
        {
          id: '3',
          title: language === 'zh'
            ? 'Binance 完成 XXX 空投分发'
            : 'Binance Completes XXX Airdrop Distribution',
          type: 'airdrop',
          releaseDate: Date.now() - 1000 * 60 * 60 * 5,
          url: 'https://www.binance.com/en/support/announcement',
        },
        {
          id: '4',
          title: language === 'zh'
            ? 'Binance 将下架 YYY/USDT 交易对'
            : 'Binance Will Delist YYY/USDT Trading Pair',
          type: 'delisting',
          releaseDate: Date.now() - 1000 * 60 * 60 * 12,
          url: 'https://www.binance.com/en/support/announcement',
        },
        {
          id: '5',
          title: language === 'zh'
            ? '关于调整部分交易对最小交易量的公告'
            : 'Notice on Adjusting Minimum Trade Amount for Some Pairs',
          type: 'default',
          releaseDate: Date.now() - 1000 * 60 * 60 * 24,
          url: 'https://www.binance.com/en/support/announcement',
        },
      ]
    },
    refetchInterval: 5 * 60 * 1000, // 5分钟刷新
  })

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return language === 'zh' ? `${minutes} 分钟前` : `${minutes}m ago`
    } else if (hours < 24) {
      return language === 'zh' ? `${hours} 小时前` : `${hours}h ago`
    } else {
      return language === 'zh' ? `${days} 天前` : `${days}d ago`
    }
  }

  const displayAnnouncements = showAll ? announcements : announcements?.slice(0, 5)

  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {language === 'zh' ? 'Binance 公告' : 'Binance Announcements'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
          </button>
          <a
            href="https://www.binance.com/en/support/announcement"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* 公告列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        ) : !displayAnnouncements || displayAnnouncements.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {language === 'zh' ? '暂无公告' : 'No announcements'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayAnnouncements.map((announcement) => (
              <a
                key={announcement.id}
                href={announcement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-xs rounded',
                          TYPE_COLORS[announcement.type] || TYPE_COLORS.default
                        )}
                      >
                        {TYPE_TEXT[announcement.type]?.[language] || TYPE_TEXT.default[language]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(announcement.releaseDate)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {announcement.title}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      {announcements && announcements.length > 5 && (
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm text-primary hover:bg-accent rounded transition-colors"
          >
            {showAll
              ? (language === 'zh' ? '收起' : 'Show less')
              : (language === 'zh' ? `查看全部 (${announcements.length})` : `View all (${announcements.length})`)}
          </button>
        </div>
      )}

      {/* 底部说明 */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
        {language === 'zh'
          ? '点击公告跳转至 Binance 官网查看详情'
          : 'Click to view details on Binance'}
      </div>
    </div>
  )
}
