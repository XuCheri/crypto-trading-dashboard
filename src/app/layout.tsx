import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Crypto Trading Dashboard',
  description: '专业级加密货币交易看板 - Binance 现货与合约市场数据',
  keywords: ['crypto', 'trading', 'binance', 'dashboard', 'bitcoin', 'ethereum'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

// 主题初始化脚本 - 在页面渲染前执行，避免闪烁
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('crypto-dashboard-ui');
    if (stored) {
      var state = JSON.parse(stored).state;
      var theme = state && state.theme;
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else if (theme === 'system') {
        var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
      }
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
