# 📚 开发指南

## 项目架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用 (5173)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React App (@ai-sdk/react - useChat Hook)       │  │
│  │  ├─ App.tsx (UI Components)                     │  │
│  │  ├─ 聊天界面、消息展示、输入框                  │  │
│  │  └─ 流式打字机效果                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP POST /api/chat
                     │ SSE 流传输
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 后端服务器 (3000)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Express Server + Vercel AI SDK                 │  │
│  │  ├─ GET  /health (健康检查)                    │  │
│  │  ├─ POST /api/chat (聊天接口)                  │  │
│  │  │  ├─ 接收消息                                │  │
│  │  │  ├─ 调用 formatMessagesForAPI               │  │
│  │  │  ├─ 调用 Vercel AI SDK streamText          │  │
│  │  │  └─ SSE 流式返回响应                        │  │
│  │  └─ CORS 中间件 (跨域处理)                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │ OpenAI-compatible API
                     │ (DeepSeek API)
                     ↓
┌─────────────────────────────────────────────────────────┐
│        DeepSeek AI (https://api.deepseek.com/v1)        │
│  • 模型: deepseek-chat                                  │
│  • 温度: 0.7 (可配置)                                   │
│  • Max Tokens: 2048 (可配置)                            │
└─────────────────────────────────────────────────────────┘

共享模块 (@ai-agent/shared)
├─ Types: ChatMessage, ChatRequest, ChatResponse
├─ Utils: formatMessagesForAPI, generateMessageId, etc.
└─ Config: AI_CONFIG (API 配置常量)
```

## 核心模块详解

### 1️⃣ 前端模块 (apps/web)

#### 关键文件

| 文件 | 作用 |
|------|------|
| `src/App.tsx` | 主应用组件，聊天 UI 交互 |
| `src/App.css` | 样式表 |
| `src/main.tsx` | React 入口 |
| `vite.config.ts` | Vite 构建配置 |

#### 核心逻辑

```typescript
// useChat 钩子自动处理：
// • 消息状态管理
// • API 请求
// • 流式响应处理
// • 加载状态

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: `${apiUrl}/api/chat`,
})
```

#### 功能模块

- **聊天消息显示**：支持不同角色样式区分
- **流式打字机效果**：自动实现，无需额外插件
- **自动滚动**：新消息时自动滚动到底部
- **错误处理**：显示友好的错误提示
- **响应式设计**：适配各种屏幕尺寸

### 2️⃣ 后端模块 (apps/server)

#### 关键文件

| 文件 | 作用 |
|------|------|
| `src/index.ts` | 服务器主文件，路由和 AI 逻辑 |
| `src/types.ts` | 类型定义 |
| `.env.example` | 环境变量模板 |

#### 核心逻辑

```typescript
// 1. 接收请求
const { messages, systemPrompt } = req.body as ChatRequest

// 2. 格式化消息
const formattedMessages = formatMessagesForAPI(messages)

// 3. 流式调用 AI
const { stream } = await streamText({
  model: deepseekClient(AI_CONFIG.MODEL),
  system: systemMessage,
  messages: formattedMessages,
})

// 4. SSE 流式返回
for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
}
```

#### API 端点

**POST /api/chat**
- 请求：聊天消息数组
- 响应：SSE 流式事件
- 支持：自定义 system prompt

**GET /health**
- 用途：健康检查
- 响应：服务器状态

### 3️⃣ 共享模块 (packages/shared)

#### 类型系统

```typescript
// ChatMessage - 聊天消息
interface ChatMessage {
  id: string;           // 唯一 ID
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// ChatRequest - API 请求
interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;  // 可选的系统提示
}

// ChatResponse - API 响应
interface ChatResponse {
  status: 'success' | 'error';
  content?: string;
}
```

#### 工具函数

| 函数 | 作用 |
|------|------|
| `AI_CONFIG` | AI 配置常量 |
| `formatMessagesForAPI()` | 格式化消息 |
| `generateMessageId()` | 生成唯一 ID |
| `createMessage()` | 创建消息对象 |
| `getErrorMessage()` | 错误处理 |

## 开发工作流

### 添加新功能

#### 场景 1：添加新的 API 端点

1. **定义类型**（`packages/shared/src/types/`）
   ```typescript
   export interface NewFeatureRequest {
     // 定义请求类型
   }
   ```

2. **实现后端端点**（`apps/server/src/index.ts`）
   ```typescript
   app.post('/api/new-feature', async (req: Request, res: Response) => {
     // 实现逻辑
   })
   ```

3. **在前端调用**（`apps/web/src/App.tsx`）
   ```typescript
   const response = await fetch(`${apiUrl}/api/new-feature`, {
     method: 'POST',
     body: JSON.stringify(data),
   })
   ```

#### 场景 2：扩展 AI 能力（添加工具调用）

在后端 `apps/server/src/index.ts` 中：

```typescript
const { stream } = await streamText({
  model: deepseekClient(AI_CONFIG.MODEL),
  system: systemMessage,
  messages: formattedMessages,
  tools: {
    // 定义可用的工具
    search: {
      description: 'Search the web',
      parameters: z.object({
        query: z.string(),
      }),
    },
    calculate: {
      description: 'Perform calculations',
      parameters: z.object({
        expression: z.string(),
      }),
    },
  },
})
```

#### 场景 3：自定义 System Prompt

前端：
```typescript
// 发送自定义系统提示
await fetch(`${apiUrl}/api/chat`, {
  method: 'POST',
  body: JSON.stringify({
    messages: content,
    systemPrompt: '你是一个 Python 编程专家...',
  }),
})
```

## 编码规范

### TypeScript 规范

✅ **好的实践：**
```typescript
// 1. 为所有函数添加参数和返回值类型
function greet(name: string): string {
  return `Hello, ${name}`
}

// 2. 谨慎使用 any，优先使用具体类型
const messages: ChatMessage[] = []  // ✅ 好

// 3. 使用 interface 定义复杂对象
interface Config {
  apiKey: string
  timeout: number
}

// 4. 为异步函数明确标记
async function fetchData(): Promise<Data> {
  // ...
}
```

❌ **避免的做法：**
```typescript
// 1. 不用 any（除非万不得已）
const data: any = {}

// 2. 不明确的类型
function process(data) {  // 缺少类型
  return data
}

// 3. 忽视错误处理
await fetchData()  // 无错误处理
```

### 文件组织

```
apps/
├── server/
│   ├── src/
│   │   ├── index.ts          # 主文件（含所有路由）
│   │   ├── types.ts          # 类型定义
│   │   ├── middleware/       # 中间件（如需要）
│   │   ├── routes/           # 路由模块（如需要）
│   │   └── services/         # 业务逻辑（如需要）
│   └── package.json
│
└── web/
    ├── src/
    │   ├── App.tsx           # 主组件
    │   ├── App.css           # 样式
    │   ├── components/       # 可复用组件（如需要）
    │   ├── hooks/            # 自定义钩子（如需要）
    │   ├── utils/            # 工具函数（如需要）
    │   └── main.tsx          # 入口
    └── package.json
```

### 命名规范

| 对象 | 规范 | 例子 |
|------|------|------|
| 变量 | camelCase | `messageCount`, `isLoading` |
| 函数 | camelCase | `handleSubmit`, `formatMessage` |
| 类 / 接口 | PascalCase | `ChatMessage`, `ApiResponse` |
| 常量 | UPPER_SNAKE_CASE | `MAX_TOKENS`, `API_BASE_URL` |
| 文件 | kebab-case (components) | `chat-message.tsx` |
| 文件 | index.ts | 库主入口 |

## 性能优化

### 前端优化

1. **消息虚拟化**：当消息数量很多时，考虑使用虚拟列表
2. **防抖输入**：对输入框进行防抖处理
3. **代码分割**：支持按需加载模块
4. **缓存**：利用浏览器缓存减少请求

### 后端优化

1. **连接池**：使用数据库连接池（如需数据库）
2. **缓存**：缓存频繁访问的数据
3. **速率限制**：防止 API 滥用
4. **日志记录**：记录关键操作用于调试

## 部署指南

### Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["pnpm", "start"]
```

### 环境配置

**生产环境 `.env`：**
```env
DEEPSEEK_API_KEY=sk_live_xxx
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
```

### 监控和日志

```typescript
// 添加日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// 错误日志
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason)
})
```

## 测试

### 单元测试示例

```typescript
// __tests__/utils.test.ts
import { generateMessageId, createMessage } from '@ai-agent/shared'

describe('Shared Utils', () => {
  test('generateMessageId should create unique IDs', () => {
    const id1 = generateMessageId()
    const id2 = generateMessageId()
    expect(id1).not.toBe(id2)
  })

  test('createMessage should create valid message', () => {
    const msg = createMessage('user', 'Hello')
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
  })
})
```

## 常见问题解答

### Q: 如何添加数据库支持？
A: 安装 ORM（如 Prisma）并在后端添加数据库层即可，不影响现有逻辑。

### Q: 如何实现用户认证？
A: 添加认证中间件，在 `/api/chat` 前进行 token 验证。

### Q: 如何处理长时间对话？
A: 在数据库中存储对话历史，允许用户加载历史消息。

### Q: 可以使用其他 AI 模型吗？
A: 可以，修改 `AI_CONFIG.MODEL` 即可，只要模型支持 OpenAI API 格式。

---

**准备好开发了吗？祝你编码愉快！** 🎉
