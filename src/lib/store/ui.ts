/**
 * UI 状态管理 (Zustand)
 *
 * 管理:
 * - 主题设置
 * - 语言设置
 * - 侧边栏状态
 * - 用户偏好
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** 支持的语言 */
export type Language = 'zh' | 'en'

/** 支持的主题 */
export type Theme = 'dark' | 'light' | 'system'

/** UI 状态接口 */
interface UIState {
  // ============ 状态 ============

  /** 当前主题 */
  theme: Theme

  /** 当前语言 */
  language: Language

  /** 侧边栏是否展开 */
  sidebarOpen: boolean

  /** 收藏的交易对 */
  favorites: string[]

  /** 最近查看的交易对 */
  recentSymbols: string[]

  // ============ Actions ============

  /** 设置主题 */
  setTheme: (theme: Theme) => void

  /** 设置语言 */
  setLanguage: (language: Language) => void

  /** 切换侧边栏 */
  toggleSidebar: () => void

  /** 设置侧边栏状态 */
  setSidebarOpen: (open: boolean) => void

  /** 添加收藏 */
  addFavorite: (symbol: string) => void

  /** 移除收藏 */
  removeFavorite: (symbol: string) => void

  /** 切换收藏状态 */
  toggleFavorite: (symbol: string) => void

  /** 是否已收藏 */
  isFavorite: (symbol: string) => boolean

  /** 添加到最近查看 */
  addRecentSymbol: (symbol: string) => void

  /** 清除最近查看 */
  clearRecentSymbols: () => void
}

/** 最近查看的最大数量 */
const MAX_RECENT_SYMBOLS = 10

/** 创建 UI 状态 Store（持久化到 localStorage） */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // 初始状态
      theme: 'dark',
      language: 'zh',
      sidebarOpen: true,
      favorites: ['BTCUSDT', 'ETHUSDT'],
      recentSymbols: [],

      // Actions
      setTheme: (theme) => {
        set({ theme })
        // 更新 HTML class
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          root.classList.remove('dark', 'light')
          if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.add(isDark ? 'dark' : 'light')
          } else {
            root.classList.add(theme)
          }
        }
      },

      setLanguage: (language) => set({ language }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addFavorite: (symbol) => {
        const favorites = get().favorites
        if (!favorites.includes(symbol)) {
          set({ favorites: [...favorites, symbol] })
        }
      },

      removeFavorite: (symbol) => {
        set({ favorites: get().favorites.filter((s) => s !== symbol) })
      },

      toggleFavorite: (symbol) => {
        const favorites = get().favorites
        if (favorites.includes(symbol)) {
          set({ favorites: favorites.filter((s) => s !== symbol) })
        } else {
          set({ favorites: [...favorites, symbol] })
        }
      },

      isFavorite: (symbol) => get().favorites.includes(symbol),

      addRecentSymbol: (symbol) => {
        const recent = get().recentSymbols.filter((s) => s !== symbol)
        set({
          recentSymbols: [symbol, ...recent].slice(0, MAX_RECENT_SYMBOLS),
        })
      },

      clearRecentSymbols: () => set({ recentSymbols: [] }),
    }),
    {
      name: 'crypto-dashboard-ui',
      storage: createJSONStorage(() => localStorage),
      // 只持久化部分状态
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        favorites: state.favorites,
        recentSymbols: state.recentSymbols,
      }),
    }
  )
)

// ============ 选择器 Hooks ============

/** 获取当前主题 */
export const useTheme = () => useUIStore((state) => state.theme)

/** 获取当前语言 */
export const useLanguage = () => useUIStore((state) => state.language)

/** 获取侧边栏状态 */
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)

/** 获取收藏列表 */
export const useFavorites = () => useUIStore((state) => state.favorites)

/** 获取最近查看 */
export const useRecentSymbols = () => useUIStore((state) => state.recentSymbols)
