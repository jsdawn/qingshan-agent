import { generateMessageId, type ChatMessage } from '@ai-agent/shared';

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
