import type { AIProviderConfig } from '@ai-agent/shared';

/**
 * 上游聊天补全接口的消息结构。
 */
interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 调用上游 AI 接口所需的参数。
 */
interface AIRequestOptions {
  ai: AIProviderConfig;
  apiKey: string;
  messages: ChatCompletionMessage[];
}

/**
 * 上游聊天补全接口的最小响应结构。
 */
interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * 调用兼容 OpenAI Chat Completions 的上游 AI 服务。
 *
 * @param options AI 请求参数。
 * @returns 模型生成的文本内容。
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
