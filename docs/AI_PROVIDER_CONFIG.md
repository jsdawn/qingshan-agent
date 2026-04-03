# AI 提供商配置指南

## 概述

系统使用 **OpenAI 兼容的通用 API** 接口，支持任意 OpenAI 兼容的 AI 提供商。  
修改配置项即可切换不同的 AI 提供商，**无需修改源代码**。

## 配置方式

所有 AI 相关配置均通过环境变量设置，在 `apps/server/.env` 或 `apps/server/.env.local` 中配置：

```bash
AI_BASE_URL=<API 地址>
AI_MODEL=<模型名称>
AI_API_KEY=<API 密钥>
AI_TEMPERATURE=<温度参数>
AI_MAX_TOKENS=<最大 tokens数>
```

## 支持的 AI 提供商

### 1. 硅基流动（推荐）⭐

**优点：** 速度快、成本低、模型多、中文支持好

```bash
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
AI_API_KEY=sk_xxxxxxxxxxxx
```

**获取 API Key：** https://cloud.siliconflow.cn/account/api-keys

**支持的模型示例：**
- `meta-llama/Meta-Llama-3.1-70B-Instruct` （推荐）
- `meta-llama/Meta-Llama-3-70B-Instruct`
- `Qwen/Qwen2-72B-Instruct`
- 更多模型见：https://docs.siliconflow.cn/docs/model-list

### 2. OpenAI

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4
AI_API_KEY=sk-xxxxxxxxxxxx
```

**获取 API Key：** https://platform.openai.com/api-keys

**支持的模型：**
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### 3. DeepSeek

```bash
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_API_KEY=sk_xxxxxxxxxxxx
```

**获取 API Key：** https://platform.deepseek.com/api_keys

**支持的模型：**
- `deepseek-chat`
- `deepseek-coder`

### 4. Anthropic Claude

```bash
AI_BASE_URL=https://api.anthropic.com/v1
AI_MODEL=claude-3-opus-20240229
AI_API_KEY=sk_xxxxxxxxxxxx
```

**获取 API Key：** https://console.anthropic.com/

**支持的模型：**
- `claude-3-opus-20240229` （强大）
- `claude-3-sonnet-20240229` （均衡）
- `claude-3-haiku-20240307` （快速）

### 5. 本地 LLM（Ollama）

适合在本地部署 LLM，无需 API Key

```bash
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
AI_API_KEY=not-needed
```

**适用场景：** 本地私有部署、离线使用

### 6. 其他 OpenAI 兼容服务

任何兼容 OpenAI API 的服务都可以使用：
- `together.ai`
- `baseten.co`
- `replicate.com`
- 自建 OpenAI 兼容服务

## 参数说明

| 参数 | 说明 | 默认值 | 范围 |
|------|------|--------|------|
| `AI_BASE_URL` | API 基础 URL | `https://api.siliconflow.cn/v1` | 有效的 URL |
| `AI_MODEL` | 使用的模型名称 | `meta-llama/Meta-Llama-3.1-70B-Instruct` | 取决于提供商 |
| `AI_API_KEY` | API 密钥（必需） | - | 由提供商提供 |
| `AI_TEMPERATURE` | 温度参数（输出随机性） | `0.7` | 0-2 |
| `AI_MAX_TOKENS` | 单次请求最大 tokens | `2048` | 取决于模型 |

### 温度参数（Temperature）
- `0.0` - 确定性输出，每次结果相同（适合数据提取）
- `0.7` - 平衡随机性和一致性（推荐）
- `1.0-2.0` - 高创意性输出，高随机性（适合创意写作）

## 快速切换示例

### 从硅基流动切换到 OpenAI

只需修改 `.env` 文件：

```bash
# 原有配置（硅基流动）
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
AI_API_KEY=sk_xxxxxxxxxxxx

# 修改为 OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4
AI_API_KEY=sk_xxxxxxxxxxxx
```

然后重启服务器：
```bash
# Ctrl+C 停止当前服务
# 再次启动
npm run dev
```

## 验证配置

启动服务器后，检查日志输出确认 AI 提供商和模型：

```
[server] Listening on http://localhost:3000
[server] Environment: development
[server] AI Provider: https://api.openai.com/v1
[server] AI Model: gpt-4
```

或者访问健康检查端点：

```bash
curl http://localhost:3000/health
```

响应应包含：
```json
{
  "status": "ok",
  "environment": "development",
  "apiKeyConfigured": true,
  "aiProvider": "https://api.openai.com/v1",
  "aiModel": "gpt-4"
}
```

## 最佳实践

1. **开发环境**：使用低成本的提供商（如硅基流动）
2. **生产环境**：选择稳定、功能全面的提供商（如 OpenAI）
3. **本地开发**：可使用本地 Ollama 避免 API 调用费用
4. **API Key 安全**：
   - 不要提交 `.env` 到 Git
   - 使用 `.env.local` 或 `.env.local` 保存敏感信息
   - 定期轮换 API Key

## 故障排查

### 错误：API Key 缺失

```
[config] AI_API_KEY is missing. /api/chat will return HTTP 400
```

**解决：** 检查 `.env` 文件中是否设置了 `AI_API_KEY`

### 错误：无法连接到 AI API

```
AI API request failed: 401 Unauthorized
```

**解决：** 检查 API Key 是否正确、是否过期

### 错误：模型不存在

```
AI API request failed: 404 Not Found
```

**解决：** 确认 `AI_MODEL` 名称对指定提供商是否有效

## 环境变量优先级

1. 操作系统环境变量（最高）
2. `.env.local` 文件
3. `.env` 文件
4. 代码中的默认值（最低）

## 参考链接

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [硅基流动文档](https://docs.siliconflow.cn)
- [DeepSeek 文档](https://platform.deepseek.com/docs)
- [Anthropic 文档](https://docs.anthropic.com)
- [Ollama 文档](https://github.com/ollama/ollama)
