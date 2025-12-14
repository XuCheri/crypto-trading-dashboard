'use client'

import Link from 'next/link'
import { Menu, Moon, Sun, Globe, TrendingUp } from 'lucide-react'
import { useUIStore, useTheme, useLanguage } from '@/lib/store/ui'
import { cn } from '@/lib/utils'

export function Header() {
  const theme = useTheme()
  const language = useLanguage()
  const { setTheme, setLanguage, toggleSidebar } = useUIStore()

  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-50">
      {/* 左侧 */}
      <div className="flex items-center gap-4">
        {/* 菜单按钮 */}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Crypto Dashboard</span>
        </Link>
      </div>

      {/* 中间导航 */}
      <nav className="hidden md:flex items-center gap-1">
        <NavLink href="/" label={language === 'zh' ? '概览' : 'Overview'} />
        <NavLink href="/spot" label={language === 'zh' ? '现货' : 'Spot'} />
        <NavLink href="/futures" label={language === 'zh' ? '合约' : 'Futures'} />
        <NavLink href="/derivatives" label={language === 'zh' ? '指标' : 'Derivatives'} />
        <NavLink href="/activities" label={language === 'zh' ? '活动' : 'Activities'} />
      </nav>

      {/* 右侧工具 */}
      <div className="flex items-center gap-2">
        {/* 语言切换 */}
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="p-2 hover:bg-accent rounded-md transition-colors flex items-center gap-1"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{language.toUpperCase()}</span>
        </button>

        {/* 主题切换 */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  )
}

/** 导航链接组件 */
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-md transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {label}
    </Link>
  )
}
