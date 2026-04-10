/**
 * 共享工具函数与通用 AI 配置类型。
 */

import type { ChatMessage } from '../types/index';

/**
 * 消息校验结果。
 */
export interface MessageValidationResult {
  /** 是否通过校验。 */
  isValid: boolean;
  /** 校验失败时收集到的错误信息。 */
  errors: string[];
}

/**
 * OpenAI-compatible 服务的基础配置。
 */
export interface AIProviderConfig {
  /** 上游服务基础地址。 */
  baseUrl: string;
  /** 请求所用模型名。 */
  model: string;
  /** 采样温度。 */
  temperature: number;
  /** 单次响应的最大 token 数。 */
  maxTokens: number;
}

/**
 * 通用 SSE 事件结构。
 */
export interface ServerSentEvent {
  /** 事件名。 */
  event: string;
  /** 原始事件数据。 */
  data: string;
  /** 可选事件 ID。 */
  id?: string;
  /** 可选重试间隔。 */
  retry?: number;
}

/**
 * 创建一个可增量消费文本块的 SSE 解析器。
 *
 * @returns 包含 `feed` 和 `flush` 的解析器对象。
 */
export function createServerSentEventParser(): {
  feed: (chunk: string) => ServerSentEvent[];
  flush: () => ServerSentEvent[];
} {
  let buffer = '';
  let eventName = 'message';
  let eventData: string[] = [];
  let eventId: string | undefined;
  let eventRetry: number | undefined;

  const dispatchEvent = (): ServerSentEvent[] => {
    if (eventData.length === 0) {
      eventName = 'message';
      eventId = undefined;
      eventRetry = undefined;
      return [];
    }

    const nextEvent: ServerSentEvent = {
      event: eventName,
      data: eventData.join('\n'),
      ...(eventId !== undefined ? { id: eventId } : {}),
      ...(eventRetry !== undefined ? { retry: eventRetry } : {}),
    };

    eventName = 'message';
    eventData = [];
    eventId = undefined;
    eventRetry = undefined;

    return [nextEvent];
  };

  const processLine = (line: string): ServerSentEvent[] => {
    if (line === '') {
      return dispatchEvent();
    }

    if (line.startsWith(':')) {
      return [];
    }

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);

    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    switch (field) {
      case 'event':
        eventName = value || 'message';
        return [];
      case 'data':
        eventData.push(value);
        return [];
      case 'id':
        eventId = value;
        return [];
      case 'retry': {
        const retry = Number(value);
        if (Number.isFinite(retry)) {
          eventRetry = retry;
        }
        return [];
      }
      default:
        return [];
    }
  };

  return {
    feed(chunk: string): ServerSentEvent[] {
      buffer += chunk.replace(/\r\n/g, '\n');

      const events: ServerSentEvent[] = [];
      let newlineIndex = buffer.indexOf('\n');

      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        events.push(...processLine(line));
        newlineIndex = buffer.indexOf('\n');
      }

      return events;
    },
    flush(): ServerSentEvent[] {
      const events: ServerSentEvent[] = [];

      if (buffer.length > 0) {
        events.push(...processLine(buffer));
        buffer = '';
      }

      events.push(...dispatchEvent());
      return events;
    },
  };
}

/**
 * 校验未知输入是否满足聊天消息列表结构。
 *
 * @param messages 待校验的消息列表。
 * @returns 校验结果。
 */
export function validateChatMessages(messages: unknown): MessageValidationResult {
  if (!Array.isArray(messages)) {
    return {
      isValid: false,
      errors: ['`messages` must be an array.'],
    };
  }

  if (messages.length === 0) {
    return {
      isValid: false,
      errors: ['`messages` cannot be empty.'],
    };
  }

  const errors: string[] = [];

  messages.forEach((message, index) => {
    if (!message || typeof message !== 'object') {
      errors.push(`messages[${index}] must be an object.`);
      return;
    }

    const candidate = message as Partial<ChatMessage>;

    if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
      errors.push(`messages[${index}].id must be a non-empty string.`);
    }

    if (candidate.role !== 'user' && candidate.role !== 'assistant') {
      errors.push(`messages[${index}].role must be 'user' or 'assistant'.`);
    }

    if (typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
      errors.push(`messages[${index}].content must be a non-empty string.`);
    }

    if (candidate.timestamp !== undefined && typeof candidate.timestamp !== 'number') {
      errors.push(`messages[${index}].timestamp must be a number when provided.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 将共享消息结构转换为上游接口所需格式。
 *
 * @param messages 已标准化消息列表。
 * @returns 仅保留角色与内容的消息数组。
 */
export function formatMessagesForAPI(
  messages: ChatMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

/**
 * 生成消息唯一标识。
 *
 * @returns 基于时间戳与随机串的消息 ID。
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 将未知错误安全地转换为可读文本。
 *
 * @param error 捕获到的异常对象。
 * @returns 可直接展示或记录的错误消息。
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred.';
}
