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

- `src/app/App.tsx`: 聊天页面装配、提交逻辑、错误处理
- `src/components/chat/ChatHeader.tsx`: 页面头部
- `src/components/chat/ChatMessageList.tsx`: 消息列表、加载态、错误展示
- `src/components/chat/ChatComposer.tsx`: 输入框与发送按钮
- `src/config/api.ts`: 读取 `VITE_API_URL`
- `src/utils/chat/chatMessages.ts`: 将 `useChat` 消息格式规范化为共享消息结构
- `src/main.tsx`: React 入口

实现说明：

- 前端使用 `ai/react` 的 `useChat`
- `streamProtocol: 'text'` 与后端返回的 `text/plain` 对齐
- `experimental_prepareRequestBody` 会把消息整理成后端期望的 `ChatMessage[]`
- UI 错误来自两处：`useChat` 请求错误，以及共享校验函数返回的结构错误

目录约定：

- `app/` 放页面装配层
- `components/` 放可复用 UI
- `config/` 放配置读取
- `utils/` 放纯工具函数

### `apps/server`

关键文件：

- `src/main.ts`: 加载配置并启动服务
- `src/app/createApp.ts`: 注册中间件、健康检查与业务路由
- `src/config/appConfig.ts`: 读取 `.env.local`、`.env`，组装运行配置
- `src/features/chat/chatMessages.ts`: 规范化请求里的消息数组
- `src/features/chat/chatRoutes.ts`: 聊天路由与业务处理
- `src/services/ai/callAIAPI.ts`: 调用上游 OpenAI-compatible Chat Completions 接口
- `src/types/app.ts`: 服务内部配置类型

请求流程：

1. `POST /api/chat` 从请求体读取 `messages` 和 `systemPrompt`
2. 若 `AI_API_KEY` 缺失，直接返回 `400 MISSING_API_KEY`
3. `normalizeRequestMessages()` 过滤非法消息并补齐缺失 `id`
4. `validateChatMessages()` 进行结构校验
5. `formatMessagesForAPI()` 把消息转成上游接口需要的 `role/content`
6. `callAIAPI()` 请求 `{AI_BASE_URL}/chat/completions`
7. 把第一条回复内容作为纯文本返回

目录约定：

- `main.ts` 是进程入口
- `app/` 放应用装配代码
- `config/` 放配置加载代码
- `features/` 按业务域拆分
- `services/` 放外部服务访问层
- `types/` 放服务端内部类型

### `packages/shared`

当前对外导出：

- 类型：`ChatMessage`、`ChatRequest`
- 工具：`validateChatMessages`、`formatMessagesForAPI`、`generateMessageId`、`getErrorMessage`
- 配置类型：`AIProviderConfig`

这个包只放跨端共享的类型和纯函数，不放 Express、React、dotenv 或具体供应商 SDK。

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
2. 如需校验规则，同步更新 `packages/shared/src/utils/index.ts`
3. 再让前后端分别接入，避免两端消息结构漂移

### 调整聊天请求

1. 先检查 `apps/web/src/utils/chat/chatMessages.ts`
2. 再检查 `apps/server/src/features/chat/chatMessages.ts`
3. 最后确认 `packages/shared/src/utils/index.ts` 的校验规则仍然成立

### 替换模型服务

1. 修改 `apps/server/.env.local`
2. 确认目标服务兼容 OpenAI Chat Completions
3. 访问 `/health` 检查配置是否生效

### 调整目录结构

1. 先明确文件职责属于 `app`、`components`、`config`、`utils`、`features`、`services` 还是 `types`
2. 移动文件后同步修正 import
3. 更新 `README.md` 和 `DEVELOPMENT.md`
4. 至少执行一次 `pnpm typecheck`

## 质量基线

- Web 包开启了 `noUnusedLocals` 和 `noUnusedParameters`
- 共享逻辑优先收敛到 `packages/shared`
- 根目录通过 Turbo 统一跑 `lint`、`typecheck`、`build`
- 当前仓库没有测试目录，回归主要依赖静态检查和手动联调
