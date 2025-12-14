'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store/ui'
import { Rocket, Leaf, ExternalLink, Clock, Users, Coins } from 'lucide-react'

interface LaunchProject {
  id: string
  name: string
  symbol: string
  type: 'launchpad' | 'launchpool'
  status: 'upcoming' | 'ongoing' | 'ended'
  startTime: number
  endTime: number
  totalRaised?: string
  participants?: number
  apy?: string
  rewardToken?: string
  stakingTokens?: string[]
  url: string
}

// 状态标签颜色
const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-yellow-500/20 text-yellow-400',
  ongoing: 'bg-up/20 text-up',
  ended: 'bg-muted text-muted-foreground',
}

// 状态文本
const STATUS_TEXT: Record<string, { zh: string; en: string }> = {
  upcoming: { zh: '即将开始', en: 'Upcoming' },
  ongoing: { zh: '进行中', en: 'Ongoing' },
  ended: { zh: '已结束', en: 'Ended' },
}

/**
 * Launchpad/Launchpool 面板
 * 显示 Binance Launchpad 和 Launchpool 项目
 */
export function LaunchpadPanel({ className }: { className?: string }) {
  const language = useLanguage()
  const [activeTab, setActiveTab] = useState<'launchpad' | 'launchpool'>('launchpool')

  // 模拟获取项目数据
  const { data: projects, isLoading } = useQuery({
    queryKey: ['launchProjects'],
    queryFn: async (): Promise<LaunchProject[]> => {
      // 模拟数据 - 实际项目中需要从 Binance API 获取
      return [
        {
          id: '1',
          name: 'Example Token',
          symbol: 'EXT',
          type: 'launchpool',
          status: 'ongoing',
          startTime: Date.now() - 1000 * 60 * 60 * 24 * 2,
          endTime: Date.now() + 1000 * 60 * 60 * 24 * 5,
          apy: '125.5%',
          rewardToken: 'EXT',
          stakingTokens: ['BNB', 'FDUSD'],
          participants: 125000,
          url: 'https://launchpad.binance.com/en/launchpool',
        },
        {
          id: '2',
          name: 'Future Coin',
          symbol: 'FTC',
          type: 'launchpool',
          status: 'upcoming',
          startTime: Date.now() + 1000 * 60 * 60 * 24,
          endTime: Date.now() + 1000 * 60 * 60 * 24 * 10,
          apy: 'TBA',
          rewardToken: 'FTC',
          stakingTokens: ['BNB', 'FDUSD', 'TUSD'],
          url: 'https://launchpad.binance.com/en/launchpool',
        },
        {
          id: '3',
          name: 'Previous Project',
          symbol: 'PRV',
          type: 'launchpool',
          status: 'ended',
          startTime: Date.now() - 1000 * 60 * 60 * 24 * 15,
          endTime: Date.now() - 1000 * 60 * 60 * 24 * 5,
          apy: '89.2%',
          rewardToken: 'PRV',
          stakingTokens: ['BNB'],
          participants: 98000,
          url: 'https://launchpad.binance.com/en/launchpool',
        },
        {
          id: '4',
          name: 'New Token Sale',
          symbol: 'NTS',
          type: 'launchpad',
          status: 'ended',
          startTime: Date.now() - 1000 * 60 * 60 * 24 * 30,
          endTime: Date.now() - 1000 * 60 * 60 * 24 * 29,
          totalRaised: '$5,000,000',
          participants: 50000,
          url: 'https://launchpad.binance.com/en/launchpad',
        },
      ]
    },
    refetchInterval: 5 * 60 * 1000,
  })

  // 格式化剩余时间
  const formatRemainingTime = (timestamp: number) => {
    const now = Date.now()
    const diff = timestamp - now

    if (diff <= 0) return language === 'zh' ? '已结束' : 'Ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // 过滤项目
  const filteredProjects = projects?.filter((p) => p.type === activeTab) || []

  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg', className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {activeTab === 'launchpad' ? (
              <Rocket className="h-5 w-5 text-primary" />
            ) : (
              <Leaf className="h-5 w-5 text-up" />
            )}
            <h3 className="font-semibold">
              {activeTab === 'launchpad' ? 'Launchpad' : 'Launchpool'}
            </h3>
          </div>
          <a
            href={`https://launchpad.binance.com/en/${activeTab}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-1 p-1 bg-accent/50 rounded-lg">
          <button
            onClick={() => setActiveTab('launchpool')}
            className={cn(
              'flex-1 py-1.5 text-sm rounded transition-colors',
              activeTab === 'launchpool'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Leaf className="inline h-4 w-4 mr-1" />
            Launchpool
          </button>
          <button
            onClick={() => setActiveTab('launchpad')}
            className={cn(
              'flex-1 py-1.5 text-sm rounded transition-colors',
              activeTab === 'launchpad'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Rocket className="inline h-4 w-4 mr-1" />
            Launchpad
          </button>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {language === 'zh' ? '暂无项目' : 'No projects'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProjects.map((project) => (
              <a
                key={project.id}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-accent/50 transition-colors"
              >
                {/* 项目头部 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {project.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.symbol}</div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded',
                      STATUS_COLORS[project.status]
                    )}
                  >
                    {STATUS_TEXT[project.status][language]}
                  </span>
                </div>

                {/* 项目详情 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {project.type === 'launchpool' ? (
                    <>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{language === 'zh' ? '质押' : 'Stake'}:</span>
                        <span className="text-foreground">
                          {project.stakingTokens?.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>{language === 'zh' ? '预估APY' : 'Est. APY'}:</span>
                        <span className="text-up font-medium">{project.apy}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>{language === 'zh' ? '募集' : 'Raised'}:</span>
                        <span className="text-foreground">{project.totalRaised || 'TBA'}</span>
                      </div>
                    </>
                  )}
                  {project.participants && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{project.participants.toLocaleString()}</span>
                    </div>
                  )}
                  {project.status !== 'ended' && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {project.status === 'upcoming'
                          ? (language === 'zh' ? '开始于 ' : 'Starts in ')
                          : (language === 'zh' ? '剩余 ' : '')}
                        {formatRemainingTime(
                          project.status === 'upcoming' ? project.startTime : project.endTime
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
        {activeTab === 'launchpool'
          ? (language === 'zh'
              ? '质押 BNB/FDUSD 等代币获取新币奖励'
              : 'Stake BNB/FDUSD to earn new tokens')
          : (language === 'zh'
              ? '使用 BNB 参与新项目代币销售'
              : 'Use BNB to participate in token sales')}
      </div>
    </div>
  )
}
