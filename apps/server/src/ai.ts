import type { AIProviderConfig } from '@ai-agent/shared';

interface ChatCompletionMessage {
  /** 消息角色。 */
  role: 'system' | 'user' | 'assistant';
  /** 消息内容。 */
  content: string;
}

interface AIRequestOptions {
  /** AI 服务配置。 */
  ai: AIProviderConfig;
  /** 鉴权使用的 API Key。 */
  apiKey: string;
  /** 发送给模型的完整上下文消息。 */
  messages: ChatCompletionMessage[];
}

interface ChatCompletionResponse {
  /** 上游返回的候选结果列表。 */
  choices?: Array<{
    message?: {
      /** 模型返回的文本内容。 */
      content?: string;
    };
  }>;
}

/**
 * 调用 OpenAI 兼容接口生成回复文本。
 *
 * @param options AI 请求参数。
 * @returns 模型生成的首条文本回复。
 */
export async function callAIAPI({ ai, apiKey, messages }: AIRequestOptions): Promise<string> {
  const response = await fetch(`${ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ai.model,
      messages,
      temperature: ai.temperature,
      max_tokens: ai.maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `AI API request failed: ${response.status} ${response.statusText}${
        detail ? ` - ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  return data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
}
