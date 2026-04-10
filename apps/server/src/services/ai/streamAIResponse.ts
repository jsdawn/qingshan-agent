import { createServerSentEventParser, type AIProviderConfig } from '@ai-agent/shared';

/**
 * 发送给上游聊天补全接口的消息结构。
 */
interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 上游流式调用参数。
 */
interface AIStreamRequestOptions {
  ai: AIProviderConfig;
  apiKey: string;
  messages: ChatCompletionMessage[];
  signal?: AbortSignal;
}

const UPSTREAM_STREAM_TIMEOUT_MS = 90_000;

/**
 * 上游流式分片中的最小字段集合。
 */
interface ChatCompletionStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

/**
 * 调用上游 OpenAI-compatible 流式接口，并按文本增量产出内容。
 *
 * @param options 流式请求参数。
 * @returns 文本增量异步生成器。
 */
export async function* streamAIResponse({
  ai,
  apiKey,
  messages,
  signal,
}: AIStreamRequestOptions): AsyncGenerator<string> {
  const upstreamTimeoutSignal = AbortSignal.timeout(UPSTREAM_STREAM_TIMEOUT_MS);
  const requestSignal = signal
    ? AbortSignal.any([signal, upstreamTimeoutSignal])
    : upstreamTimeoutSignal;
  let response: Response;

  try {
    response = await fetch(`${ai.baseUrl}/chat/completions`, {
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
        stream: true,
      }),
      signal: requestSignal,
    });
  } catch (error) {
    if (upstreamTimeoutSignal.aborted) {
      throw new Error(`AI API stream timed out after ${UPSTREAM_STREAM_TIMEOUT_MS}ms.`);
    }

    throw error;
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `AI API request failed: ${response.status} ${response.statusText}${
        detail ? ` - ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  if (!response.body) {
    throw new Error('AI API returned an empty stream body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createServerSentEventParser();
  let isCompleted = false;

  try {
    while (true) {
      let done: boolean;
      let value: Uint8Array | undefined;

      try {
        ({ done, value } = await reader.read());
      } catch (error) {
        if (upstreamTimeoutSignal.aborted) {
          throw new Error(`AI API stream timed out after ${UPSTREAM_STREAM_TIMEOUT_MS}ms.`);
        }

        throw error;
      }

      if (done || isCompleted) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      for (const event of parser.feed(chunk)) {
        if (isStreamDoneEvent(event.data)) {
          isCompleted = true;
          break;
        }

        yield* extractTextDelta(event.data);
      }
    }

    const tail = decoder.decode();
    if (tail && !isCompleted) {
      for (const event of parser.feed(tail)) {
        if (isStreamDoneEvent(event.data)) {
          isCompleted = true;
          break;
        }

        yield* extractTextDelta(event.data);
      }
    }

    for (const event of parser.flush()) {
      if (isStreamDoneEvent(event.data)) {
        break;
      }

      yield* extractTextDelta(event.data);
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 从单条上游 SSE 数据中提取文本增量。
 *
 * @param rawData 原始 SSE `data` 字段内容。
 * @returns 文本增量生成器。
 */
function* extractTextDelta(rawData: string): Generator<string> {
  const payload = rawData.trim();

  if (!payload || payload === '[DONE]') {
    return;
  }

  let chunk: ChatCompletionStreamChunk;

  try {
    chunk = JSON.parse(payload) as ChatCompletionStreamChunk;
  } catch {
    throw new Error(`AI API stream returned invalid JSON: ${payload.slice(0, 200)}`);
  }

  if (chunk.error?.message) {
    throw new Error(chunk.error.message);
  }

  for (const choice of chunk.choices ?? []) {
    const delta = choice.delta?.content;
    if (typeof delta === 'string' && delta.length > 0) {
      yield delta;
    }
  }
}

/**
 * 判断当前上游 SSE 数据块是否表示流式输出已结束。
 * @param rawData 原始 SSE `data` 字段内容。
 * @returns 若为 `[DONE]` 结束标记则返回 `true`。
 */
function isStreamDoneEvent(rawData: string): boolean {
  return rawData.trim() === '[DONE]';
}
