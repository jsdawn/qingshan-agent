import type { AIProviderConfig } from '@ai-agent/shared';

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequestOptions {
  ai: AIProviderConfig;
  apiKey: string;
  messages: ChatCompletionMessage[];
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

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
