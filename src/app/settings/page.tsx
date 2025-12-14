'use client'

import { useUIStore, useTheme, useLanguage, Theme, Language } from '@/lib/store/ui'
import { cn } from '@/lib/utils'
import { Settings, Moon, Sun, Monitor, Globe, Trash2, RotateCcw } from 'lucide-react'

/**
 * 设置页面
 * 用户偏好配置
 */
export default function SettingsPage() {
  const language = useLanguage()
  const theme = useTheme()
  const { setTheme, setLanguage, favorites, recentSymbols, clearRecentSymbols } = useUIStore()

  // 主题选项
  const themeOptions: { value: Theme; label: { zh: string; en: string }; icon: React.ElementType }[] = [
    { value: 'dark', label: { zh: '深色', en: 'Dark' }, icon: Moon },
    { value: 'light', label: { zh: '浅色', en: 'Light' }, icon: Sun },
    { value: 'system', label: { zh: '跟随系统', en: 'System' }, icon: Monitor },
  ]

  // 语言选项
  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'zh', label: '中文', flag: '🇨🇳' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ]

  // 清除所有本地数据
  const clearAllData = () => {
    if (confirm(language === 'zh' ? '确定要清除所有本地数据吗？' : 'Clear all local data?')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  // 重置 Dashboard 布局
  const resetDashboardLayout = () => {
    localStorage.removeItem('home-dashboard-layout')
    localStorage.removeItem('home-dashboard-removed')
    if (confirm(language === 'zh' ? '已重置 Dashboard 布局，是否刷新页面？' : 'Dashboard layout reset. Refresh page?')) {
      window.location.href = '/'
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">
              {language === 'zh' ? '设置' : 'Settings'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'zh' ? '自定义您的交易看板' : 'Customize your trading dashboard'}
            </p>
          </div>
        </div>

        {/* 外观设置 */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Moon className="h-4 w-4" />
            {language === 'zh' ? '外观' : 'Appearance'}
          </h2>

          {/* 主题选择 */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              {language === 'zh' ? '主题' : 'Theme'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                      theme === option.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label[language]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 语言选择 */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {language === 'zh' ? '语言' : 'Language'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLanguage(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                    language === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  )}
                >
                  <span>{option.flag}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 数据统计 */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {language === 'zh' ? '数据' : 'Data'}
          </h2>

          <div className="space-y-3">
            {/* 收藏数量 */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                {language === 'zh' ? '收藏的交易对' : 'Favorite Pairs'}
              </span>
              <span className="text-sm font-medium">{favorites.length}</span>
            </div>

            {/* 最近查看 */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                {language === 'zh' ? '最近查看' : 'Recent Symbols'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{recentSymbols.length}</span>
                {recentSymbols.length > 0 && (
                  <button
                    onClick={clearRecentSymbols}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {language === 'zh' ? '清除' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {/* Dashboard 布局 */}
            <div className="flex items-center justify-between py-2 border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                {language === 'zh' ? 'Dashboard 布局' : 'Dashboard Layout'}
              </span>
              <button
                onClick={resetDashboardLayout}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                {language === 'zh' ? '重置' : 'Reset'}
              </button>
            </div>
          </div>
        </section>

        {/* 危险区域 */}
        <section className="bg-card border border-down/30 rounded-lg p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-down">
            <Trash2 className="h-4 w-4" />
            {language === 'zh' ? '危险区域' : 'Danger Zone'}
          </h2>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {language === 'zh'
                ? '清除所有本地存储的数据，包括设置、收藏、布局等。此操作不可撤销。'
                : 'Clear all locally stored data including settings, favorites, layouts. This action cannot be undone.'}
            </p>
            <button
              onClick={clearAllData}
              className="px-4 py-2 text-sm bg-down/10 text-down border border-down/30 rounded-lg hover:bg-down/20 transition-colors"
            >
              {language === 'zh' ? '清除所有数据' : 'Clear All Data'}
            </button>
          </div>
        </section>

        {/* 关于 */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-4">
            {language === 'zh' ? '关于' : 'About'}
          </h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Crypto Trading Dashboard</span>
              {' '}v1.0.0
            </p>
            <p>
              {language === 'zh'
                ? '专业级加密货币交易看板，基于 Binance API 构建。'
                : 'Professional crypto trading dashboard built on Binance API.'}
            </p>
            <p className="text-xs">
              {language === 'zh'
                ? '数据来源: Binance 公开 API (无需 API Key)'
                : 'Data source: Binance Public API (No API Key required)'}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
