import { generateMessageId, type ChatMessage } from '@ai-agent/shared';

/**
 * 将请求体中的未知消息列表整理为合法的聊天消息数组。
 *
 * @param messages 来自客户端请求的原始消息数据。
 * @returns 过滤并补齐字段后的消息数组。
 */
export function normalizeRequestMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const normalizedMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      continue;
    }

    const candidate = message as Partial<ChatMessage>;

    if (candidate.role !== 'user' && candidate.role !== 'assistant') {
      continue;
    }

    if (typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
      continue;
    }

    normalizedMessages.push({
      id:
        typeof candidate.id === 'string' && candidate.id.trim().length > 0
          ? candidate.id
          : generateMessageId(),
      role: candidate.role,
      content: candidate.content,
      ...(typeof candidate.timestamp === 'number' ? { timestamp: candidate.timestamp } : {}),
    });
  }

  return normalizedMessages;
}
