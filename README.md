# AI Agent Monorepo

基于 `pnpm workspace + TurboRepo` 的前后端 Monorepo：

- `apps/web`: React 18 + Vite 5 聊天界面
- `apps/server`: Express 4 API 服务
- `packages/shared`: 前后端共享类型与纯函数

当前实现基于 OpenAI-compatible Chat Completions。后端 `POST /api/chat` 返回一次性 `text/plain` 文本，前端通过 `ai/react` 的 `useChat` 配合 `streamProtocol: 'text'` 处理请求与消息状态。

## 技术栈

- TypeScript
- pnpm workspace
- TurboRepo
- React 18
- Vite 5
- Express 4
- Tailwind CSS

## 目录结构

```text
.
├─ apps/
│  ├─ server/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  └─ createApp.ts
│  │  │  ├─ config/
│  │  │  │  └─ appConfig.ts
│  │  │  ├─ features/
│  │  │  │  └─ chat/
│  │  │  │     └─ chatRoutes.ts
│  │  │  ├─ utils/
│  │  │  │  └─ chatMessages.ts
│  │  │  ├─ services/
│  │  │  │  └─ ai/
│  │  │  │     └─ callAIAPI.ts
│  │  │  ├─ types/
│  │  │  │  └─ app.ts
│  │  │  └─ main.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     ├─ src/
│     │  ├─ app/
│     │  │  └─ App.tsx
│     │  ├─ components/
│     │  │  └─ chat/
│     │  │     ├─ ChatComposer.tsx
│     │  │     ├─ ChatHeader.tsx
│     │  │     └─ ChatMessageList.tsx
│     │  ├─ config/
│     │  │  └─ api.ts
│     │  ├─ utils/
│     │  │  └─ chat/
│     │  │     └─ chatMessages.ts
│     │  ├─ index.css
│     │  └─ main.tsx
│     ├─ package.json
│     └─ tsconfig.json
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  ├─ types/index.ts
│     │  ├─ utils/index.ts
│     │  └─ index.ts
│     ├─ package.json
│     └─ tsconfig.json
├─ docs/
│  ├─ AI_PROVIDER_CONFIG.md
│  └─ developer/README.md
├─ DEVELOPMENT.md
├─ package.json
└─ turbo.json
```

## 项目结构规范

### `apps/web/src`

- `app/`: 页面级装配与入口容器，不承载大段可复用 UI 细节
- `components/`: 可复用界面组件，按领域分组
- `config/`: 前端运行时配置读取
- `utils/`: 与框架无关或弱相关的纯工具函数，按领域分组

当前约定：

- 聊天消息整理函数放在 `src/utils/chat/chatMessages.ts`
- 聊天界面组件放在 `src/components/chat/`
- `src/app/App.tsx` 只负责拼装页面与调用 hooks

### `apps/server/src`

- `main.ts`: 服务启动入口
- `app/`: 应用装配，例如中间件、全局路由注册
- `config/`: 环境变量与运行配置加载
- `features/`: 业务域模块，按能力拆分
- `services/`: 外部依赖调用，例如 AI 服务
- `types/`: 服务端内部类型定义

当前约定：

- 聊天请求规范化与路由处理都归 `features/chat/`
- 上游模型调用统一归 `services/ai/`
- 应用级配置类型归 `types/app.ts`

### `packages/shared/src`

- 仅放前后端共享的类型、校验与纯函数
- 不引入 React、Express、dotenv 或具体供应商 SDK

## 环境要求

- Node.js 18+
- pnpm 9+

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置后端环境变量

在 `apps/server/.env.local` 或 `apps/server/.env` 中至少配置：

```env
AI_API_KEY=your_api_key
```

可选配置：

```env
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

3. 配置前端环境变量

在 `apps/web/.env` 中按需配置：

```env
VITE_API_URL=http://localhost:3000
```

4. 启动开发环境

```bash
pnpm dev
```

默认地址：

- Web: `http://localhost:5173`
- Server: `http://localhost:3000`

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm clean
```

按包执行：

```bash
pnpm --filter @ai-agent/server dev
pnpm --filter @ai-agent/web dev
pnpm --filter @ai-agent/shared build
```

## API

### `POST /api/chat`

请求体：

```json
{
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello"
    }
  ],
  "systemPrompt": "Optional system prompt"
}
```

成功响应：

- `Content-Type: text/plain; charset=utf-8`
- Body 为模型生成的纯文本
- 响应头额外带有 `X-Processing-Time` 和 `X-Response-Timestamp`

错误响应：

```json
{
  "status": "error",
  "error": {
    "code": "CHAT_ERROR",
    "message": "Error description"
  }
}
```

### `GET /health`

```json
{
  "status": "ok",
  "environment": "development",
  "apiKeyConfigured": true,
  "aiProvider": "https://api.siliconflow.cn/v1",
  "aiModel": "meta-llama/Meta-Llama-3.1-70B-Instruct",
  "timestamp": "2026-04-03T00:00:00.000Z"
}
```

## 工程约定

- 后端统一使用 `AI_API_KEY`
- 前端统一使用 `VITE_API_URL`
- 共享包只保留跨端复用的类型和纯函数
- 每个包都提供 `lint`、`typecheck`、`clean` 脚本
- 目录调整后，应同步更新 `README.md` 与 `DEVELOPMENT.md`

## 故障排查

### `400 MISSING_API_KEY`

检查 `apps/server/.env.local` 或 `apps/server/.env` 是否配置了 `AI_API_KEY`，修改后重启后端。

### 前端无法连接后端

检查：

- `apps/web/.env` 中的 `VITE_API_URL`
- 后端是否监听在 `http://localhost:3000`
- `FRONTEND_URL` 是否与前端实际地址一致

### 共享包类型未生效

执行：

```bash
pnpm install
pnpm typecheck
```

## 文档

- AI开发规范 [./.cursorrules](./.cursorrules)
- 提供商配置说明见 [docs/AI_PROVIDER_CONFIG.md](./docs/AI_PROVIDER_CONFIG.md)
- 开发说明见 [DEVELOPMENT.md](./DEVELOPMENT.md)
- 开发文档入口见 [docs/developer/README.md](./docs/developer/README.md)
