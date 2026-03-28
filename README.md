# 交易日志

加密货币交易记录与分析工具，数据本地存储，无需后端。

## 功能特性

- **交易记录**：新增开仓 / 平仓 / 编辑，支持多/空方向，记录策略、情绪、市场标签
- **数据导入**：支持 CSV / XLSX 文件，自动识别表头，兼容主流交易所导出格式
- **数据导出**：CSV 导出、JSON 备份与恢复
- **概览仪表盘**：胜率、盈亏比、最大回撤、平均持仓规模、权益曲线图
- **多维分析**：按策略 / 市场 / 情绪 / 标的 / 方向分组统计，月度盈亏柱状图
- **本地持久化**：基于 IndexedDB，数据保存在浏览器本地，刷新不丢失

## 技术栈

- **React 19** + **Vite 8** — 前端框架与构建工具
- **idb** — IndexedDB 封装
- **xlsx (SheetJS)** — CSV/XLSX 解析
- **recharts** — 权益曲线折线图、月度盈亏柱状图
- 纯内联样式，无 CSS 框架

## 快速开始

```bash
npm install
npm run dev      # 开发服务器（localhost:5173，支持 HMR）
npm run build    # 生产构建，输出到 /dist
npm run preview  # 本地预览生产构建
npm run lint     # ESLint 检查
```

## 项目结构

```
src/
├── App.jsx              # 根组件：页面状态、数据加载/保存
├── db.js                # IndexedDB 读写封装
├── constants/           # 示例数据、导入关键词
├── styles/index.js      # 全局样式对象与颜色常量
├── utils/               # 统计计算、导入解析等工具函数
├── components/          # 通用组件（弹窗、下拉、图标等）
└── pages/               # Dashboard / Trades / Analysis 三个视图
```

## 数据说明

所有数据存储在浏览器 IndexedDB（数据库名 `tradejournal`），不上传任何服务器。清除浏览器数据会导致记录丢失，建议定期使用"备份 JSON"功能导出备份。
