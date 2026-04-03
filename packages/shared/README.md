# @ai-agent/shared

前后端共享模块，只放跨端复用的类型和纯函数。

当前导出：

- 类型：`ChatMessage`、`ChatRequest`
- 工具：`validateChatMessages`、`formatMessagesForAPI`、`generateMessageId`、`getErrorMessage`
- 配置类型：`AIProviderConfig`

示例：

```ts
import {
  formatMessagesForAPI,
  generateMessageId,
  getErrorMessage,
  validateChatMessages,
} from '@ai-agent/shared';
import type { AIProviderConfig, ChatMessage, ChatRequest } from '@ai-agent/shared';
```

职责边界：

- 可以放：共享消息结构、纯函数校验、格式转换
- 不放：React Hook、Express 中间件、dotenv、具体模型服务 SDK
