# 共享模块（前后端通用）

## 开发指南

代码变更后，需 `pnpm build` 打包产物后，使用 `@ai-agent/shared` 消费

```ts
import { validateChatMessages } from '@ai-agent/shared';
import type { ChatMessage, ChatRequest } from '@ai-agent/shared';
```
