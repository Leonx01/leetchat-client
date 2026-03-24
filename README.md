# LeetChat 即时通讯应用

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4+-green.svg" alt="Vue 3.4+">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript 5.0+">
  <img src="https://img.shields.io/badge/Vite-5.0+-646CFF.svg" alt="Vite 5.0+">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License MIT">
</p>

LeetChat 是一个基于 Vue 3 + TypeScript 开发的现代化即时通讯 Web 应用，支持文字聊天、实时音视频通话、文件传输等功能。

## ✨ 功能特性

- 💬 **即时消息**：支持一对一私聊，消息实时送达
- 📹 **音视频通话**：基于 WebRTC 的高清音视频通话
- 📎 **文件传输**：支持图片、视频、音频、文档等多种文件类型
- 🎨 **个性化设置**：自定义头像、主题颜色、个人资料
- 🔔 **消息通知**：新消息弹窗提醒，未读消息计数
- 🌙 **深色模式**：适配系统主题，支持亮色/深色模式切换
- 📱 **响应式设计**：支持桌面端和移动端访问

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3.4+ (Composition API) |
| 开发语言 | TypeScript 5.0+ |
| 构建工具 | Vite 5.0+ |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia |
| 路由管理 | Vue Router 4 |
| 原子样式 | UnoCSS |
| 实时通信 | WebSocket + WebRTC |
| HTTP 客户端 | Axios |
| 代码规范 | ESLint + Stylelint |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (项目强制使用 pnpm 作为包管理器)

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd leetchat-user-frontend

# 安装依赖（必须使用 pnpm）
pnpm install
```

### 开发环境运行

```bash
# 启动开发服务器
pnpm dev
```

开发服务器默认运行在 http://localhost:9000

### 生产环境构建

```bash
# 生产环境打包
pnpm build

# 测试环境打包
pnpm build:test
```

## ⚙️ 环境变量配置

项目使用 `.env` 文件管理环境变量，主要配置项如下：

### 开发环境 (.env.development)

```env
# 应用标题
VITE_APP_TITLE=LeetChat

# 后端 API 地址
VITE_APP_API_BASEURL=http://127.0.0.1:8080/

# WebSocket 地址
VITE_APP_BASE_WS_URL=ws://127.0.0.1:8080

# 是否开启代理（开发环境建议开启）
VITE_OPEN_PROXY=true

# 调试工具（可选值：eruda / vconsole / 留空）
VITE_APP_DEBUG_TOOL=
```

### 生产环境 (.env.production)

```env
# 应用标题
VITE_APP_TITLE=LeetChat

# 后端 API 地址（生产环境使用相对路径或生产域名）
VITE_APP_API_BASEURL=/

# 调试工具（生产环境建议留空）
VITE_APP_DEBUG_TOOL=

# 是否启用 Mock（生产环境设为 false）
VITE_BUILD_MOCK=false

# 是否生成 sourcemap（生产环境建议设为 false）
VITE_BUILD_SOURCEMAP=false

# 打包压缩格式（gzip / brotli / 逗号分隔多个）
VITE_BUILD_COMPRESS=gzip,brotli
```

## 📁 项目结构

```
leetchat-user-frontend/
├── public/                 # 静态资源（不经过构建）
├── src/
│   ├── api/               # API 接口封装
│   │   ├── index.ts       # Axios 实例配置
│   │   └── modules/       # 业务 API 模块
│   ├── assets/            # 静态资源（图片、样式等）
│   │   ├── icons/         # SVG 图标
│   │   ├── images/        # 图片文件
│   │   └── styles/        # 全局样式
│   ├── components/        # 全局公共组件
│   │   ├── ChatRoom/      # 聊天室组件
│   │   ├── Message/       # 消息组件
│   │   └── ...
│   ├── layouts/           # 布局组件
│   │   ├── components/    # 布局子组件
│   │   └── index.vue      # 主布局
│   ├── router/            # 路由配置
│   ├── store/             # Pinia 状态管理
│   │   └── modules/       # 状态模块
│   ├── utils/             # 工具函数
│   ├── views/             # 页面视图
│   │   ├── login.vue      # 登录页
│   │   ├── MailBox/       # 消息邮箱
│   │   ├── settings/      # 设置页面
│   │   └── ...
│   ├── App.vue            # 根组件
│   ├── main.ts            # 入口文件
│   ├── settings.ts        # 应用配置
│   └── settings.default.ts # 默认配置
├── vite/                  # Vite 插件配置
├── .env.*                 # 环境变量文件
├── eslint.config.js       # ESLint 配置
├── package.json           # 项目依赖
└── vite.config.ts         # Vite 主配置
```

## 🔒 安全注意事项

### ⚠️ 重要安全提示

1. **请勿在生产环境提交敏感信息**
   - 不要将 `.env.production` 中的真实 API 密钥提交到代码仓库
   - 确保 `.gitignore` 中已排除敏感配置文件

2. **WebSocket 连接安全**
   - 生产环境必须使用 `wss://` (WebSocket Secure)
   - 开发环境的 `ws://` 仅适用于本地测试

3. **文件上传安全**
   - 应用已配置常见文件类型白名单
   - 生产环境建议添加文件大小限制和病毒扫描

4. **XSS 防护**
   - 本项目已修复已知的 XSS 漏洞
   - 开发时避免使用 `v-html` 或 `innerHTML` 渲染用户输入内容
   - 使用 `textContent` 替代 `innerHTML` 插入文本

5. **CORS 配置**
   - 确保后端 API 正确配置 CORS，限制允许的域名
   - 不要将 `Access-Control-Allow-Origin` 设置为 `*`

## 🧪 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm build            # 生产环境构建
pnpm build:test       # 测试环境构建

# 代码质量
pnpm lint             # 运行所有 lint 检查
pnpm lint:tsc         # TypeScript 类型检查
pnpm lint:eslint      # ESLint 检查并修复
pnpm lint:stylelint   # Stylelint 检查并修复

# 其他
pnpm new              # 使用模板生成新组件/页面
pnpm svgo             # 优化 SVG 图标
pnpm serve            # 预览生产构建
```

## 🌐 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

**注意**：音视频通话功能需要浏览器支持 WebRTC，建议使用最新版本的 Chrome 或 Firefox。

## 🔧 常见问题

### 1. 安装依赖失败

确保使用 pnpm 安装依赖：

```bash
npm install -g pnpm
pnpm install
```

### 2. WebSocket 连接失败

检查 `.env.development` 中的 `VITE_APP_BASE_WS_URL` 配置是否正确，确保后端服务已启动。

### 3. 音视频通话无法建立

- 确保使用 HTTPS 或 localhost（WebRTC 要求安全上下文）
- 检查浏览器权限，允许访问摄像头和麦克风
- 检查 STUN/TURN 服务器配置

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request。在提交代码前，请确保：

1. 代码通过 ESLint 和 Stylelint 检查
2. 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
3. 不要提交包含敏感信息的代码

---

<p align="center">
  如果这个项目对你有帮助，欢迎点个 ⭐ Star！
</p>
