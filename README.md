# Crypto Trading Dashboard

专业级加密货币交易看板，基于 Binance API 构建，支持现货与合约市场实时数据展示。

## 功能特性

### 市场数据
- **现货市场**: 实时行情、K线图表、订单簿、成交历史
- **合约市场**: USDT-M 永续合约、COIN-M 币本位合约
- **衍生品指标**: 资金费率、持仓量、多空比、大户持仓比

### Dashboard
- **可定制布局**: 拖拽调整组件位置和大小
- **布局持久化**: 自动保存到本地存储
- **市场概览**: BTC/ETH 价格、涨跌榜、成交额排行

### 活动聚合
- **Binance 公告**: 新上币、下架、维护等公告
- **Launchpad/Launchpool**: 最新项目信息

### 用户体验
- **中英双语**: 支持中文和英文切换
- **深色/浅色主题**: 可切换主题，跟随系统
- **响应式设计**: 支持桌面和移动设备
- **实时更新**: WebSocket 实时推送数据

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand + TanStack Query
- **图表**: Lightweight Charts (TradingView)
- **布局**: react-grid-layout
- **部署**: Vercel (静态导出)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

构建产物在 `out` 目录，可部署到任何静态托管服务。

## 部署

### Vercel 部署 (推荐)

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 自动部署完成

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/crypto-trading-dashboard)

### 其他静态托管

```bash
npm run build
# 上传 out 目录到 Netlify/GitHub Pages/Cloudflare Pages
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # Dashboard 首页
│   ├── spot/               # 现货市场
│   ├── futures/            # 合约市场
│   ├── derivatives/        # 衍生品指标
│   ├── activities/         # 活动聚合
│   └── settings/           # 设置页面
├── components/
│   ├── charts/             # 图表组件
│   ├── market/             # 市场组件
│   ├── derivatives/        # 衍生品组件
│   ├── dashboard/          # Dashboard 组件
│   └── layout/             # 布局组件
├── lib/
│   ├── api/                # API 客户端
│   ├── websocket/          # WebSocket 管理
│   ├── store/              # 状态管理
│   └── utils/              # 工具函数
└── hooks/                  # 自定义 Hooks
```

## API 说明

本项目使用 Binance 公开 API，无需 API Key：

- **现货 API**: https://api.binance.com
- **合约 API**: https://fapi.binance.com
- **WebSocket**: wss://stream.binance.com:9443

### 频率限制

- REST API: 1200 权重/分钟
- WebSocket: 5 条消息/秒

项目已内置频率限制处理，正常使用不会触发限制。

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License

## 免责声明

本项目仅供学习和研究使用，不构成投资建议。加密货币交易存在高风险，请谨慎投资。
