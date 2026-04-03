import { validateChatMessages, type ChatMessage } from '@ai-agent/shared';

/** 前端界面使用的消息类型，当前与共享消息结构保持一致。 */
type UIMessage = ChatMessage;

/** 来自 UI 或第三方库的宽松消息结构。 */
interface MessageCandidate {
  /** 消息唯一标识。 */
  id?: string;
  /** 消息角色。 */
  role?: string;
  /** 消息内容。 */
  content?: string;
}

/**
 * 将宽松消息对象标准化为 UI 可用的消息结构。
 *
 * @param message 待标准化的原始消息。
 * @param index 当前消息在列表中的索引，用于补全默认 ID。
 * @returns 合法时返回标准消息，否则返回 `null`。
 */
function normalizeToUIMessage(message: MessageCandidate, index: number): UIMessage | null {
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  if (typeof message.content !== 'string' || message.content.trim().length === 0) {
    return null;
  }

  return {
    id:
      typeof message.id === 'string' && message.id.trim().length > 0 ? message.id : `msg_${index}`,
    role: message.role,
    content: message.content,
  };
}

/**
 * 过滤并标准化消息列表，确保提交给后端的数据结构稳定。
 *
 * @param messages 待处理的消息列表。
 * @returns 可安全用于请求的消息数组。
 */
export function normalizeMessagesForRequest(messages: MessageCandidate[]): UIMessage[] {
  return messages
    .map((message, index) => normalizeToUIMessage(message, index))
    .filter((message): message is UIMessage => message !== null);
}

/**
 * 基于共享校验规则返回聊天消息的错误信息。
 *
 * @param messages 已标准化的消息列表。
 * @returns 可直接展示给用户的错误信息数组。
 */
export function getChatValidationErrors(messages: UIMessage[]): string[] {
  if (messages.length === 0) {
    return [];
  }

  const result = validateChatMessages(messages);
  return result.isValid ? [] : result.errors;
}
