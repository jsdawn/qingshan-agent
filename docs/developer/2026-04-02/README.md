# 🤖 AI Agent Monorepo

一个完整的企业级 TurboRepo Monorepo 项目，集成 DeepSeek AI、Express 后端和 React 前端，提供流式聊天功能。

## 📋 项目简介

这是一个生产级别的 AI 聊天应用骨架，具有以下特点：

- **TurboRepo Monorepo 结构**：统一管理前端、后端和共享模块
- **实时流式聊天**：支持 SSE 流式输出，实现打字机效果
- **DeepSeek AI 集成**：使用免费的 DeepSeek API，兼容 OpenAI 格式
- **完整的 TypeScript**：全栈 TypeScript 开发，类型安全
- **企业级代码规范**：清晰的代码注释、一致的命名规范、模块化设计
- **即插即用**：仅需配置 API Key，即可启动运行

## 🏗️ 项目结构

```
ai-agent-monorepo/
├── apps/
│   ├── web/                # 前端 React 应用 (Vite + TS)
│   │   ├── src/
│   │   │   ├── App.tsx      # 聊天主界面
│   │   │   ├── App.css      # 样式文件
│   │   │   ├── main.tsx     # 入口文件
│   │   │   └── vite-env.d.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .env.example
│   └── server/             # 后端 Express 应用 (Node.js + TS)
│       ├── src/
│       │   ├── index.ts     # 服务器入口，配置路由和 AI 接口
│       │   └── types.ts     # 类型定义
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example
├── packages/
│   └── shared/            # 共享模块（前后端通用）
│       ├── src/
│       │   ├── types/      # 共享类型定义
│       │   └── utils/      # 共享工具函数
│       ├── tsconfig.json
│       └── package.json
├── package.json           # 根目录配置（workspace 配置）
├── turbo.json             # TurboRepo 配置
├── tsconfig.json          # 根目录 TypeScript 配置
└── .gitignore
```

## 🚀 快速开始

### 前置要求

- **Node.js**：>= 18.0.0
- **pnpm**：>= 9.0.0（包管理器）
- **DeepSeek API Key**：从 https://platform.deepseek.com/api_keys 获取（免费注册）

### 1️⃣ 获取 DeepSeek API Key

1. 访问 [DeepSeek API 平台](https://platform.deepseek.com/api_keys)
2. 注册或登录账户
3. 点击"创建新的 API 密钥"
4. 复制生成的 API Key（免费账户有较高的免费额度）

### 2️⃣ 安装依赖

```bash
# 进入项目目录
cd ai-agent-monorepo

# 使用 pnpm 安装所有依赖
# 如果还没有安装 pnpm，先运行：npm install -g pnpm@9.0.0
pnpm install
```

### 3️⃣ 配置环境变量

**后端配置：**

1. 进入后端项目目录
   ```bash
   cd apps/server
   ```

2. 复制 `.env.example` 为 `.env`
   ```bash
   cp .env.example .env
   ```

3. 编辑 `.env` 文件，填入您的 DeepSeek API Key
   ```env
   DEEPSEEK_API_KEY=sk_live_your_api_key_here
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

**前端配置（可选）：**

1. 进入前端项目目录
   ```bash
   cd apps/web
   ```

2. 复制 `.env.example` 为 `.env`
   ```bash
   cp .env.example .env
   ```

3. 确认环境变量（默认即可）
   ```env
   REACT_APP_API_URL=http://localhost:3000
   ```

### 4️⃣ 启动项目

在项目根目录运行：

```bash
# 同时启动前端（5173 端口）和后端（3000 端口）
pnpm dev
```

或分别启动：

```bash
# 仅启动后端
pnpm --filter @ai-agent/server dev

# 仅启动前端
pnpm --filter @ai-agent/web dev
```

### 5️⃣ 访问应用

打开浏览器访问：http://localhost:5173

你应该看到聊天界面。现在可以开始与 AI 对话了！

## 💬 功能說明

### 前端功能

- **实时聊天界面**：简洁美观的聊天 UI
- **流式打字机效果**：AI 响应逐字显示，增强交互体验
- **聊天历史管理**：自动保存对话历史
- **错误提示**：清晰的错误消息显示
- **响应式设计**：适配桌面和移动设备

### 后端功能

- **SSE 流式传输**：支持服务端事件（Server-Sent Events）流式输出
- **DeepSeek AI 集成**：使用 Vercel AI SDK 对接 DeepSeek API
- **CORS 支持**：跨域资源共享配置
- **错误处理**：完善的错误捕获和响应
- **环境变量管理**：灵活的配置管理

## 🔧 API 接口文档

### POST /api/chat

流式聊天接口，支持 SSE 实时流传输。

**请求体：**

```json
{
  "messages": [
    {
      "id": "msg_xxx",
      "role": "user",
      "content": "Hello, how are you?"
    },
    {
      "id": "msg_yyy",
      "role": "assistant",
      "content": "I'm doing well, thank you!"
    }
  ],
  "systemPrompt": "Optional system message"
}
```

**响应：** SSE 流格式

```
data: {"content": "I", "type": "text"}
data: {"content": "'m", "type": "text"}
data: {"content": " happy", "type": "text"}
...
data: {"type":"complete","processingTime":1234,"timestamp":"2024-01-01T00:00:00.000Z"}
```

**错误响应：**

```json
{
  "status": "error",
  "error": {
    "code": "CHAT_ERROR",
    "message": "Error description"
  }
}
```

### GET /health

健康检查接口。

**响应：**

```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧰 技术栈

### 共享技术

- **TypeScript**：类型安全的 JavaScript
- **pnpm**：高效的包管理器
- **TurboRepo**：高性能 Monorepo 管理工具

### 前端技术

- **React 18**：UI 框架
- **Vite**：下一代前端构建工具
- **@ai-sdk/react**：AI 聊天集成
- **CSS3**：现代样式表

### 后端技术

- **Express**：Web 框架
- **Node.js**：运行时
- **@vercel/ai**：AI SDK
- **@ai-sdk/openai-compatible**：OpenAI 兼容 API 适配
- **CORS**：跨域资源共享中间件

### AI 服务

- **DeepSeek API**：免费、高性能的 AI 模型

## 🔐 环境变量说明

### 后端环境变量

| 变量名 | 说明 | 必需 | 默认值 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ 是 | - |
| `PORT` | 服务器监听端口 | ❌ 否 | 3000 |
| `NODE_ENV` | 运行环境 | ❌ 否 | development |
| `FRONTEND_URL` | 前端 URL（CORS） | ❌ 否 | http://localhost:5173 |

### 前端环境变量

| 变量名 | 说明 | 必需 | 默认值 |
| --- | --- | --- | --- |
| `REACT_APP_API_URL` | 后端 API URL | ❌ 否 | http://localhost:3000 |

## 🧪 测试功能

### 测试流式聊天

1. 打开前端应用（http://localhost:5173）
2. 在输入框输入消息，例如："你好，请用中文自我介绍"
3. 点击发送按钮或回车
4. 观察 AI 的实时流式响应

### 测试后端 API

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "Say hello"
      }
    ]
  }'
```

## 🐛 常见问题

### 1. 错误：DEEPSEEK_API_KEY 未设置

**解决方案：**
- 确保在 `apps/server/.env` 文件中配置了 `DEEPSEEK_API_KEY`
- 验证 API Key 格式是否正确（应以 `sk_` 开头）

### 2. 错误：ECONNREFUSED 连接被拒绝

**解决方案：**
- 确保后端已启动（运行 `pnpm dev`）
- 检查后端是否在 http://localhost:3000 监听
- 验证 CORS 配置是否正确

### 3. 前端显示空白

**解决方案：**
- 打开浏览器开发者工具（F12）查看控制台错误
- 确保 React 应用已正确编译
- 清除浏览器缓存后重新加载

### 4. AI 响应缓慢或超时

**解决方案：**
- 检查网络连接
- 验证 DeepSeek API 配额是否充足
- 查看后端日志了解详细错误信息

## 🎯 后续开发建议

### 1. AI Agent 能力扩展

- **工具调用**：在 `apps/server/src/index.ts` 中的 `tools` 部分添加自定义工具
- **RAG（检索增强生成）**：集成向量数据库实现知识库查询
- **记忆系统**：添加对话历史持久化和上下文管理

### 2. UI 增强

- 添加暗色模式支持
- 实现聊天导出功能
- 添加消息编辑和删除功能
- 支持富文本和代码高亮

### 3. 后端优化

- 添加数据库集成（PostgreSQL、MongoDB）
- 实现用户认证和授权
- 添加日志系统和监控
- 实现速率限制和请求验证

### 4. 部署

- Docker 容器化
- GitHub Actions CI/CD
- Vercel/Railway 云部署
- 负载均衡和自动扩展

## 📚 关键文件说明

### `packages/shared/src/types/index.ts`

定义前后端共享的类型接口：
- `ChatMessage`：聊天消息类型
- `ChatRequest`：聊天请求类型
- `ChatResponse`：聊天响应类型
- `AIStreamResponse`：AI 流处理响应类型

### `packages/shared/src/utils/index.ts`

提供前后端共享的工具函数：
- `AI_CONFIG`：AI 配置常量
- `formatMessagesForAPI()`：消息格式化
- `generateMessageId()`：ID 生成
- `createMessage()`：消息创建
- `getErrorMessage()`：错误处理

### `apps/server/src/index.ts`

后端服务器主文件：
- Express 应用配置
- CORS 和中间件设置
- `/api/chat` 端点实现（SSE 流处理）
- DeepSeek AI 集成
- 错误处理和日志记录

### `apps/web/src/App.tsx`

前端主组件：
- React 组件实现
- 使用 `useChat` 钩子管理聊天状态
- 流式消息显示和打字机效果
- 用户输入处理
- 错误显示

## 📄 学习资源

- [TurboRepo 文档](https://turbo.build/docs)
- [Vercel AI SDK 指南](https://sdk.vercel.ai)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [React 官方文档](https://react.dev)
- [Express.js 指南](https://expressjs.com)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📝 许可证

MIT License

## 💡 相关资源

- [Vercel AI SDK GitHub](https://github.com/vercel/ai)
- [DeepSeek 官网](https://www.deepseek.com)
- [TurboRepo GitHub](https://github.com/vercel/turborepo)

---

**祝你使用愉快！如有任何问题，欢迎提出。** 🚀
