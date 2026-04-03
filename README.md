# AI Agent Monorepo

一个基于 `pnpm workspace + TurboRepo` 的前后端 Monorepo。

- `apps/web`: React 18 + Vite 5 聊天界面
- `apps/server`: Express 4 API 服务
- `packages/shared`: 前后端共享类型和纯函数

当前实现走 OpenAI-compatible Chat Completions。后端的 `POST /api/chat` 返回一次性 `text/plain` 文本，前端通过 `ai/react` 的 `useChat` 和 `streamProtocol: 'text'` 处理请求与消息状态。

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
│  │  │  ├─ ai.ts
│  │  │  ├─ app.ts
│  │  │  ├─ config.ts
│  │  │  ├─ index.ts
│  │  │  ├─ messages.ts
│  │  │  └─ types.ts
│  │  ├─ .env.example
│  │  └─ package.json
│  └─ web/
│     ├─ src/
│     │  ├─ lib/chatMessages.ts
│     │  ├─ App.tsx
│     │  ├─ config.ts
│     │  └─ main.tsx
│     ├─ .env.example
│     └─ package.json
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  ├─ types/index.ts
│     │  ├─ utils/index.ts
│     │  └─ index.ts
│     └─ package.json
├─ docs/
│  ├─ AI_PROVIDER_CONFIG.md
│  └─ developer/README.md
├─ DEVELOPMENT.md
├─ package.json
└─ turbo.json
```

## 环境要求

- Node.js 18+
- pnpm 9+

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置后端环境变量

复制 `apps/server/.env.example` 到 `apps/server/.env.local` 或 `apps/server/.env`，至少填写：

```env
AI_API_KEY=your_api_key
```

3. 配置前端环境变量

复制 `apps/web/.env.example` 到 `apps/web/.env`，按需修改：

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
- 响应头额外带上 `X-Processing-Time` 和 `X-Response-Timestamp`

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
- 历史开发文档已移除，当前文档以仓库根目录和 `docs/` 下文件为准

## 故障排查

### `400 MISSING_API_KEY`

检查 `apps/server/.env.local` 或 `apps/server/.env` 是否设置了 `AI_API_KEY`，修改后重启后端。

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

- 提供商配置说明见 [docs/AI_PROVIDER_CONFIG.md](./docs/AI_PROVIDER_CONFIG.md)
- 开发说明见 [DEVELOPMENT.md](./DEVELOPMENT.md)
- 开发文档入口见 [docs/developer/README.md](./docs/developer/README.md)
