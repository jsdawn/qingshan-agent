# 开发指南

## 当前架构

```text
apps/web (http://localhost:5173)
  └─ useChat('text') -> POST /api/chat

apps/server (http://localhost:3000)
  ├─ GET /health
  └─ POST /api/chat
       ├─ 规范化请求消息
       ├─ 校验消息结构
       ├─ 调用 OpenAI-compatible /chat/completions
       └─ 返回 text/plain

packages/shared
  ├─ ChatMessage / ChatRequest
  └─ 消息校验、格式转换、错误处理工具
```

## 包职责

### `apps/web`

关键文件：

- `src/App.tsx`: 聊天 UI、提交逻辑、错误提示、自动滚动
- `src/config.ts`: 读取 `VITE_API_URL`
- `src/lib/chatMessages.ts`: 将 `useChat` 消息格式规范化为共享消息结构
- `src/main.tsx`: React 入口

实现说明：

- 前端使用 `ai/react` 的 `useChat`
- `streamProtocol: 'text'` 与后端返回的 `text/plain` 对齐
- `experimental_prepareRequestBody` 会把消息整理成后端期望的 `ChatMessage[]`
- UI 错误来自两处：`useChat` 的请求错误，以及共享校验函数返回的结构错误

### `apps/server`

关键文件：

- `src/index.ts`: 加载配置并启动服务
- `src/config.ts`: 读取 `.env.local`、`.env`，组装运行配置
- `src/app.ts`: 注册中间件和 API 路由
- `src/messages.ts`: 规范化请求里的消息数组
- `src/ai.ts`: 调用上游 OpenAI-compatible Chat Completions 接口
- `src/types.ts`: 服务内部配置类型

请求流程：

1. `POST /api/chat` 从请求体读取 `messages` 和 `systemPrompt`
2. 若 `AI_API_KEY` 缺失，直接返回 `400 MISSING_API_KEY`
3. `normalizeRequestMessages()` 过滤非法消息并补齐缺失 `id`
4. `validateChatMessages()` 进行结构校验
5. `formatMessagesForAPI()` 把消息转成上游接口需要的 `role/content`
6. `callAIAPI()` 请求 `{AI_BASE_URL}/chat/completions`
7. 把第一条回复内容作为纯文本返回

当前路由：

- `GET /health`: 返回环境、模型和密钥是否已配置
- `POST /api/chat`: 返回模型回复纯文本
- 其他路径统一返回 `404 NOT_FOUND`

### `packages/shared`

当前对外导出：

- 类型：`ChatMessage`、`ChatRequest`
- 工具：`validateChatMessages`、`formatMessagesForAPI`、`generateMessageId`、`getErrorMessage`
- 配置类型：`AIProviderConfig`

这个包只放跨端共享的类型和纯函数，不放 Express、React、dotenv 或具体提供商 SDK。

## 环境变量

### 后端

读取顺序：

1. `apps/server/.env.local`
2. `apps/server/.env`

由于 `dotenv` 默认不覆盖已有变量，所以 `.env.local` 优先级更高。

变量列表：

- `AI_API_KEY`: 必填；为空时 `/api/chat` 会返回 400
- `AI_BASE_URL`: 可选；默认 `https://api.siliconflow.cn/v1`
- `AI_MODEL`: 可选；默认 `meta-llama/Meta-Llama-3.1-70B-Instruct`
- `AI_TEMPERATURE`: 可选；默认 `0.7`
- `AI_MAX_TOKENS`: 可选；默认 `2048`
- `PORT`: 可选；默认 `3000`
- `NODE_ENV`: 可选；仅区分 `development` / `production`
- `FRONTEND_URL`: 可选；默认 `http://localhost:5173`

### 前端

- `VITE_API_URL`: 后端地址，默认回退到 `http://localhost:3000`

## 开发命令

仓库根目录：

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

## 变更约定

### 新增共享字段

1. 先改 `packages/shared/src/types/index.ts`
2. 如果需要校验，同步更新 `packages/shared/src/utils/index.ts`
3. 前后端再分别接入，避免两端消息结构漂移

### 调整聊天请求

1. 先检查 `apps/web/src/lib/chatMessages.ts`
2. 再检查 `apps/server/src/messages.ts`
3. 最后确认 `packages/shared/src/utils/index.ts` 的校验规则仍然成立

### 更换模型服务

1. 修改 `apps/server/.env.local`
2. 确认目标服务兼容 OpenAI Chat Completions
3. 访问 `/health` 检查配置是否生效

## 质量基线

- Web 包开启了 `noUnusedLocals` 和 `noUnusedParameters`
- 共享逻辑优先收敛到 `packages/shared`
- 根目录通过 Turbo 统一跑 `lint`、`typecheck`、`build`
- 当前仓库没有测试目录，回归主要依赖静态检查和手动联调
