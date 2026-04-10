import * as shared from '@ai-agent/shared';

/**
 * 流式聊天请求参数。
 */
interface ReadChatStreamOptions {
  /** 聊天接口地址。 */
  api: string;
  /** 请求体。 */
  request: shared.ChatRequest;
  /** 中断信号。 */
  signal?: AbortSignal;
  /** 每收到一条流事件时的回调。 */
  onEvent: (event: shared.ChatStreamEvent) => void | Promise<void>;
}

/**
 * 通过 `fetch + SSE` 读取后端流式聊天响应。
 *
 * @param options 流式请求参数。
 * @returns 读取完成后的 Promise。
 */
export async function readChatStream({
  api,
  request,
  signal,
  onEvent,
}: ReadChatStreamOptions): Promise<void> {
  const response = await fetch(api, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response));
  }

  if (!response.body) {
    throw new Error('聊天响应流为空。');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = shared.createServerSentEventParser();
  let hasReceivedStart = false;
  let hasReceivedTerminalEvent = false;

  const handleStreamEvent = async (event: shared.ChatStreamEvent): Promise<void> => {
    if (event.type === 'start') {
      hasReceivedStart = true;
    }

    if (event.type === 'done' || event.type === 'error') {
      hasReceivedTerminalEvent = true;
    }

    await onEvent(event);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      for (const event of parser.feed(chunk)) {
        await handleStreamEvent(parseChatStreamEvent(event.data));
      }
    }

    const tail = decoder.decode();
    if (tail) {
      for (const event of parser.feed(tail)) {
        await handleStreamEvent(parseChatStreamEvent(event.data));
      }
    }

    for (const event of parser.flush()) {
      await handleStreamEvent(parseChatStreamEvent(event.data));
    }

    if (!signal?.aborted && !hasReceivedTerminalEvent) {
      throw new Error(
        hasReceivedStart
          ? 'The chat stream ended unexpectedly before completion.'
          : 'The chat stream closed before any response was produced.',
      );
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 判断当前错误是否为用户取消或请求中断导致。
 *
 * @param error 捕获到的未知错误。
 * @returns 是否为中断错误。
 */
export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * 解析单条聊天流事件，并做最小运行时校验。
 *
 * @param rawData SSE 中的 JSON 字符串。
 * @returns 解析后的聊天流事件。
 */
function parseChatStreamEvent(rawData: string): shared.ChatStreamEvent {
  let event: unknown;

  try {
    event = JSON.parse(rawData);
  } catch {
    throw new Error(`收到无法解析的流事件：${rawData.slice(0, 200)}`);
  }

  if (!event || typeof event !== 'object' || typeof (event as { type?: unknown }).type !== 'string') {
    throw new Error('收到格式不合法的流事件。');
  }

  return event as shared.ChatStreamEvent;
}

/**
 * 从失败的 HTTP 响应中提取可展示的错误文本。
 *
 * @param response `fetch` 返回的响应对象。
 * @returns 适合展示给用户的错误消息。
 */
async function getResponseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const data = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (typeof data.error?.message === 'string' && data.error.message.trim().length > 0) {
        return data.error.message;
      }
    } catch {
      return `请求失败，状态码 ${response.status}。`;
    }
  }

  const text = await response.text().catch(() => '');
  return text.trim() || `请求失败，状态码 ${response.status}。`;
}
