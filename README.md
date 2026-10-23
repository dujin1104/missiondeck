# 任务工作台 · Task Workbench
一款纯本地单机任务日历管理工具，数据完整存储于本机 SQLite 文件，**零网络请求、不上传任何数据、无需后端服务**，适配内网隔离办公场景，是内网环境办公首选任务管理工具。项目基于 Tauri 2 + Vue 3 + TypeScript 开发，可打包为 Windows、macOS 原生桌面应用，离线可用、数据自主可控。

- 应用标识：`com.missiondeck.taskbench`
- 版本：`1.0.1`

---

## 目录

- [技术栈](#技术栈)
- [功能模块](#功能模块)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [本地运行](#本地运行)
- [打包部署](#打包部署)
- [数据存储说明](#数据存储说明)

---

## 技术栈

| 分层 | 技术 | 说明 |
| --- | --- | --- |
| 桌面运行时 | **Tauri 2** | 轻量桌面壳，Rust 编写，体积远小于 Electron |
| 前端框架 | **Vue 3.5**（`script setup`） | 组合式 API 组织界面与逻辑 |
| 开发语言 | **TypeScript 5.7** + `vue-tsc` | 严格类型检查（`strict` 开启） |
| 构建工具 | **Vite 6** | 开发服务器 + 生产构建 |
| 本地数据库 | **SQLite**（`@tauri-apps/plugin-sql` / `tauri-plugin-sql`） | 单文件 `tasks.db`，进程内读写 |
| 状态管理 | Vue 组合式（composables） | 模块级单例响应式状态，多组件共享 |
| 打包 | `tauri-build` + Cargo | Rust 侧 `profile.release` 开启 `lto` / `strip` / `opt-level="s"` 以减小体积 |

### 脚本

```bash
npm run dev        # 仅启动前端（Vite，http://localhost:5173）
npm run build      # 类型检查(vue-tsc) + 生产构建(vite build) → dist/
npm run preview    # 预览生产构建产物
npm run tauri      # 透传 Tauri CLI（dev / build / icon 等）
```

---

## 功能模块

应用采用**三栏可拖拽布局**（左 / 中 / 右），可折叠任意栏：

```
┌──────────┬──────────────────────────┬──────────────┐
│ Sidebar  │  MainToolbar + 周/月视图  │  InfoPanel   │
│ 状态筛选  │  WeekView / MonthView    │  周期读数     │
│ 日期列表  │  TaskCard / 跨期任务      │  状态分布     │
└──────────┴──────────────────────────┴──────────────┘
```

- **周 / 月视图切换**：中间主区在 `WeekView` 与 `MonthView` 之间切换，展示周期内任务排布。
- **任务管理（CRUD）**：通过 `TaskDialog` 弹窗新增 / 编辑 / 删除任务，字段含标题、状态、优先级、起止日期、备注。
- **状态与优先级**：状态（`待开始 / 进行中 / 已完成 / 已延期`）、优先级（`低 / 中 / 高`）。
- **状态筛选**：左侧栏按状态过滤，支持「有效状态」（逾期自动归为「已延期」）匹配。
- **周期统计**：
  - 周期内任务（与周期有交集、按截止日排布）
  - 跨期任务（周期内已开始但截止日超出周期）
  - 今日在办、已逾期任务
  - 周期读数卡片（本周/本月截止、进行中、已完成、逾期）
  - 状态分布占比
- **本地持久化**：所有变更实时写入 SQLite；首次启动自动填充示例数据，便于快速体验。
- **纯本地安全**：无网络访问，CSP 默认关闭（本地应用），数据全部保存在用户应用数据目录。
- **设置模块**：主工具栏右侧「设置」图标进入，支持查看应用版本/标识/数据路径等关于信息，以及**数据迁移（导出 JSON 备份）**与**数据导入（合并 / 覆盖）**操作，便于换机或重装后恢复数据。

### 核心源码位置

| 模块 | 路径 |
| --- | --- |
| 数据访问层 | `src/db.ts` |
| 类型定义 | `src/types.ts` |
| 日期工具 | `src/utils/date.ts` |
| 任务派生逻辑（逾期/跨期/有效状态） | `src/utils/task.ts` |
| 工作台共享状态 | `src/composables/useWorkbench.ts` |
| 日历周期计算 | `src/composables/useCalendar.ts` |
| 任务数据 CRUD | `src/composables/useTasks.ts` |
| 顶层布局 | `src/App.vue` |

---

## 项目结构

```
MissionDeck/
├── src/                    # 前端（Vue 3 + TS）
│   ├── components/         # 10 个 Vue 组件（视图/卡片/弹窗/侧栏等）
│   ├── composables/        # 组合式状态逻辑
│   ├── utils/              # 日期与任务工具函数
│   ├── App.vue             # 三栏布局入口
│   ├── db.ts               # SQLite 访问层
│   ├── types.ts            # 类型与枚举
│   ├── main.ts / style.css
├── src-tauri/              # Rust 侧（Tauri 2 桌面壳）
│   ├── Cargo.toml          # Rust 依赖与 release profile
│   ├── tauri.conf.json     # 窗口、构建、打包、标识配置
│   └── src/                # Rust 入口
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 环境要求

### 前端

- **Node.js** ≥ 18（含 npm）
- **Rust 工具链**（cargo / rustc）：通过 [rustup](https://rustup.rs/) 安装

### 系统级依赖（Tauri 2）

Tauri 需匹配的系统 WebView 与编译依赖：

| 平台 | 依赖 |
| --- | --- |
| **macOS** | Xcode Command Line Tools（`xcode-select --install`） |
| **Windows** | Microsoft C++ Build Tools + WebView2 Runtime（通常已随系统） |
| **Linux** | `webkit2gtk-4.1`、`libsoup-3.0`、`libjavascriptcoregtk-4.1`、`build-essential`、`curl`、`wget`、`file`、`libssl-dev`、`rpm`、`patchelf` 等（详见 [Tauri 官方前置依赖](https://v2.tauri.app/start/prerequisites/)） |

> 仅运行纯前端（`npm run dev`）不需要 Rust/系统依赖，但 SQLite 插件依赖 Tauri 运行时，完整功能需在桌面壳内运行。

---

## 本地运行

```bash
# 1. 安装前端依赖
npm install

# 2. 启动开发模式（同时拉起 Vite 与 Tauri 桌面窗口）
npm run tauri dev
```

开发模式特性：

- Vite 固定在 `http://localhost:5173`，HMR 端口 `5174`；
- `src-tauri/**` 被排除在 Vite 监听之外（由 Cargo 负责）；
- 首次启动自动建表并填充示例任务；
- 窗口默认 `1440×900`（最小 `1024×680`），可在 `src-tauri/tauri.conf.json` 调整。

若只想预览界面（无数据库能力）：

```bash
npm run dev      # http://localhost:5173
```

---

## 打包部署

```bash
# 生成各平台安装包（targets: "all"）
npm run tauri build
```

构建流程：先执行 `npm run build`（vue-tsc 类型检查 + Vite 构建到 `dist/`），再由 Tauri 将前端嵌入 Rust 二进制，按 `bundle.targets: "all"` 产出对应平台安装包。

### 产物位置

```
src-tauri/target/release/bundle/
├── dmg/      # macOS 磁盘镜像
├── msi/      # Windows 安装包
├── appimage/ # Linux AppImage
└── ...       # 其他格式（deb / rpm 等，取决于平台支持）
```

### 体积优化

`src-tauri/Cargo.toml` 的 `profile.release` 已开启：

- `lto = true`（链接期优化）
- `strip = true`（去除调试符号）
- `opt-level = "s"`（以体积优先优化）
- `codegen-units = 1`、`panic = "abort"`

### 发布注意事项

- **macOS**：分发需 **Apple Developer 证书** 进行签名与公证（Notarization），否则用户会触发 Gatekeeper 拦截。
- **Windows**：建议配置代码签名证书，避免 SmartScreen 警告。
- 签名/图标等配置在 `src-tauri/tauri.conf.json` 的 `bundle` 段，图标位于 `src-tauri/icons/`。
- 更换应用标识、产品名须在 `tauri.conf.json`（`productName` / `identifier`）同步修改。

---

## 数据存储说明

- 数据库文件：`tasks.db`（SQLite 单文件）
- 默认路径：系统应用数据目录，例如
  - macOS：`~/Library/Application Support/com.missiondeck.taskbench/tasks.db`
- 表结构（`task`）：`id, title, status, priority, start_date, end_date, remark`
- 数据**完全本地**，不会上传任何服务器；卸载应用时数据目录可一并清理。

---

## License

本项目基于 **MIT License** 开源，详见 [LICENSE](./LICENSE)。

Copyright (c) 2026 渡江河
