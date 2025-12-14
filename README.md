# Crypto Trading Dashboard

<p align="center">
  <strong>专业级加密货币交易看板</strong><br>
  基于 Binance API 构建，支持现货与合约市场实时数据展示
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术架构">技术架构</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

---

## 功能特性

### 现货市场 (Spot)

- 实时行情数据，WebSocket 推送
- 专业 K 线图表 (TradingView Lightweight Charts)
- 深度订单簿，支持聚合精度调节
- 实时成交历史

### USDT-M 永续合约

- 全部 USDT 永续合约行情
- 资金费率实时显示
- 标记价格与最新价格对比
- 衍生品指标面板（持仓量、多空比、大户持仓）

### COIN-M 币本位合约

- 币本位永续/交割合约
- 交割日期与合约信息
- 市场概览与分析

### 衍生品指标

- **资金费率排行**: 全市场资金费率排序，年化收益率计算
- **持仓量变化**: Open Interest 历史趋势图
- **多空比分析**: 全市场账户多空比例
- **大户持仓比**: Top Trader 持仓与账户比例

### 市场分析系统

- 基于多指标的智能分析算法
- 自动生成多空倾向判断
- 综合评分与置信度显示
- 支持中英文分析报告

### Dashboard

- 可拖拽调整的自定义布局
- 布局状态本地持久化
- BTC/ETH 实时价格卡片
- 涨跌榜、成交额排行组件

### 活动聚合

- Binance 官方公告聚合
- Launchpad/Launchpool 项目信息
- 新币上线、下架、维护通知

### 用户体验

- 中英双语切换
- 深色/浅色主题
- 响应式设计
- 实时数据更新

---

## 技术架构

### 技术栈

| 类别     | 技术                             |
| -------- | -------------------------------- |
| 框架     | Next.js 14 (App Router)          |
| 语言     | TypeScript                       |
| 样式     | Tailwind CSS                     |
| 状态管理 | Zustand + TanStack Query         |
| 图表     | Lightweight Charts (TradingView) |
| 布局     | react-grid-layout                |
| 部署     | Vercel / 静态导出                |

### 数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Pages      │────▶│  Components  │────▶│   Hooks      │    │
│  │  (App Router)│     │  (UI Layer)  │     │ (Data Layer) │    │
│  └──────────────┘     └──────────────┘     └──────┬───────┘    │
│                                                    │            │
│                              ┌─────────────────────┴──────┐     │
│                              │                            │     │
│                              ▼                            ▼     │
│                    ┌──────────────┐            ┌──────────────┐ │
│                    │ TanStack     │            │  WebSocket   │ │
│                    │ Query        │            │  Manager     │ │
│                    └──────┬───────┘            └──────┬───────┘ │
│                           │                          │          │
└───────────────────────────┼──────────────────────────┼──────────┘
                            │                          │
                            ▼                          ▼
              ┌─────────────────────────┐    ┌─────────────────────┐
              │  Next.js API Routes     │    │  Binance WebSocket  │
              │  (Proxy Layer)          │    │  (Direct Connect)   │
              └───────────┬─────────────┘    └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │  Binance REST API       │
              │  api.binance.com        │
              │  fapi.binance.com       │
              └─────────────────────────┘
```

### 代理架构

项目使用 Next.js API Routes 作为代理层解决浏览器 CORS 限制：

- **REST API**: 通过 `/api/binance/*` 代理到 Binance REST API
- **WebSocket**: 直接连接 Binance WebSocket (WebSocket 不受 CORS 限制)

```typescript
// API 代理示例 (src/app/api/binance/[...path]/route.ts)
export async function GET(request: NextRequest, { params }) {
  const binanceUrl = `https://api.binance.com/api/${params.path.join('/')}`
  const response = await fetch(binanceUrl)
  return new Response(response.body, { headers: corsHeaders })
}
```

### 市场分析算法

智能分析系统基于以下指标加权计算：

| 指标       | 权重 | 说明                   |
| ---------- | ---- | ---------------------- |
| 资金费率   | 25%  | 正费率看多，负费率看空 |
| 持仓量变化 | 20%  | 增仓配合涨跌方向       |
| 多空比     | 20%  | 账户多空比例倾向       |
| 大户持仓比 | 35%  | 专业交易者持仓方向     |

```typescript
// 计算综合评分 (-100 ~ +100)
const weightedScore =
  fundingScore * 0.25 +
  oiScore * 0.20 +
  lsRatioScore * 0.20 +
  topTraderScore * 0.35

// 生成交易信号
if (weightedScore > 30) signal = 'BULLISH'
else if (weightedScore < -30) signal = 'BEARISH'
else signal = 'NEUTRAL'
```

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/crypto-trading-dashboard.git
cd crypto-trading-dashboard

# 安装依赖
npm install
```

### 开发

```bash
npm run dev
```

访问 http://localhost:3000

### 构建

```bash
npm run build
```

构建产物在 `out` 目录（静态导出模式）或 `.next` 目录（Server 模式）。

### 类型检查

```bash
npm run typecheck
```

---

## 部署

### Vercel 部署 (推荐)

1. Fork 本仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动部署完成

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/crypto-trading-dashboard)

### 静态托管

```bash
npm run build
# 上传 out 目录到 Netlify / GitHub Pages / Cloudflare Pages
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 项目结构

```
src/
├── app/                          # Next.js App Router 页面
│   ├── page.tsx                  # Dashboard 首页
│   ├── layout.tsx                # 根布局
│   ├── spot/                     # 现货市场
│   │   └── page.tsx
│   ├── futures/                  # 合约市场
│   │   ├── usdt-m/page.tsx       # USDT-M 永续
│   │   └── coin-m/page.tsx       # COIN-M 币本位
│   ├── derivatives/              # 衍生品指标
│   │   └── page.tsx
│   ├── activities/               # 活动聚合
│   │   └── page.tsx
│   ├── settings/                 # 设置页面
│   │   └── page.tsx
│   └── api/                      # API 代理路由
│       ├── binance/              # 现货 API 代理
│       └── binance-futures/      # 合约 API 代理
│
├── components/
│   ├── charts/                   # 图表组件
│   │   ├── CandlestickChart.tsx  # K线图
│   │   └── FuturesCandlestickChart.tsx
│   ├── market/                   # 市场组件
│   │   ├── Orderbook.tsx         # 订单簿
│   │   ├── TradeHistory.tsx      # 成交历史
│   │   ├── TickerPrice.tsx       # 价格显示
│   │   └── FuturesOrderbook.tsx
│   ├── derivatives/              # 衍生品组件
│   │   ├── FundingRatePanel.tsx  # 资金费率
│   │   ├── OpenInterestChart.tsx # 持仓量图表
│   │   ├── LongShortRatioChart.tsx
│   │   ├── TopTraderRatioChart.tsx
│   │   ├── MarketAnalysis.tsx    # 市场分析
│   │   └── IndicatorsPanel.tsx   # 指标面板
│   ├── dashboard/                # Dashboard 组件
│   │   └── widgets/              # 小组件
│   └── layout/                   # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ThemeProvider.tsx
│
├── lib/
│   ├── api/                      # API 客户端
│   │   ├── spot.ts               # 现货 API
│   │   ├── futures.ts            # 合约 API
│   │   └── types.ts              # 类型定义
│   ├── websocket/                # WebSocket 管理
│   │   ├── manager.ts            # 连接管理器
│   │   └── streams.ts            # 数据流定义
│   ├── store/                    # 状态管理 (Zustand)
│   │   └── ui.ts                 # UI 状态
│   └── utils/                    # 工具函数
│       └── index.ts
│
└── hooks/                        # 自定义 Hooks
    ├── useBinanceStream.ts       # WebSocket Hook
    └── useLocalStorage.ts
```

---

## API 说明

本项目使用 Binance 公开 API，无需 API Key：

| API            | 端点                    | 说明            |
| -------------- | ----------------------- | --------------- |
| 现货 REST      | api.binance.com         | 现货市场数据    |
| 合约 REST      | fapi.binance.com        | USDT-M 合约数据 |
| 币本位 REST    | dapi.binance.com        | COIN-M 合约数据 |
| WebSocket      | stream.binance.com:9443 | 实时数据推送    |
| 合约 WebSocket | fstream.binance.com     | USDT-M 实时数据 |

### 主要接口

```typescript
// 现货行情
GET /api/v3/ticker/24hr

// K 线数据
GET /api/v3/klines?symbol=BTCUSDT&interval=1h

// 订单簿
GET /api/v3/depth?symbol=BTCUSDT&limit=20

// 资金费率
GET /fapi/v1/premiumIndex

// 持仓量
GET /futures/data/openInterestHist

// 多空比
GET /futures/data/globalLongShortAccountRatio
```

### 频率限制

- REST API: 1200 权重/分钟
- WebSocket: 5 条消息/秒

项目已内置频率限制处理，正常使用不会触发限制。

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发规范

- 使用 TypeScript 严格类型
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks
- 提交信息遵循 Conventional Commits

### 问题反馈

如果你发现 Bug 或有功能建议，请 [创建 Issue](https://github.com/your-username/crypto-trading-dashboard/issues)。

---

## 浏览器支持

| 浏览器  | 最低版本 |
| ------- | -------- |
| Chrome  | 90+      |
| Firefox | 88+      |
| Safari  | 14+      |
| Edge    | 90+      |

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

## 免责声明

本项目仅供学习和研究使用，不构成任何投资建议。加密货币交易存在高风险，请谨慎投资，风险自负。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/XuCheri">XuCheri</a>
</p>
