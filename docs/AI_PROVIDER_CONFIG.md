# AI Provider Config

后端通过 OpenAI-compatible Chat Completions 接口访问模型服务，固定请求：

```text
POST {AI_BASE_URL}/chat/completions
```

## 配置文件位置

后端会按下面顺序读取环境变量：

1. `apps/server/.env.local`
2. `apps/server/.env`

建议把私密配置放到 `.env.local`。

## 必填项

```env
AI_API_KEY=your_api_key
```

当前服务端要求 `AI_API_KEY` 为非空字符串；如果没有配置，`POST /api/chat` 会直接返回 `400 MISSING_API_KEY`。

## 可选项

```env
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 提供商示例

### SiliconFlow

```env
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
AI_API_KEY=your_siliconflow_api_key
```

### OpenAI

```env
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=your_openai_api_key
```

### DeepSeek

```env
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_API_KEY=your_deepseek_api_key
```

### Ollama

```env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3
AI_API_KEY=dummy-key
```

说明：当前后端实现总是发送 `Authorization: Bearer ${AI_API_KEY}`，所以即使目标服务不校验密钥，也需要配置一个非空占位值。

## 健康检查

启动后端后访问：

```bash
curl http://localhost:3000/health
```

示例响应：

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

如果 `apiKeyConfigured` 为 `false`，说明服务没有读取到 `AI_API_KEY`。

## 排错

### `AI_API_KEY is missing`

- 检查 `apps/server/.env.local` 或 `apps/server/.env`
- 修改后重启开发服务器

### `401 Unauthorized`

- 检查 API Key 是否正确
- 检查 `AI_BASE_URL` 是否为对应服务的 OpenAI-compatible 根路径

### `404 Not Found`

- 检查 `AI_BASE_URL` 是否缺少 `/v1`
- 检查目标服务是否真的提供 `/chat/completions`
- 检查 `AI_MODEL` 是否可用
