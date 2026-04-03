import { validateChatMessages, type ChatMessage } from '@ai-agent/shared';

/**
 * 前端界面层使用的聊天消息类型。
 */
export type UIChatMessage = ChatMessage;

/**
 * 前端收到的候选消息结构。
 */
interface MessageCandidate {
  id?: string;
  role?: string;
  content?: string;
}

/**
 * 将候选消息转换为可用于界面展示的标准消息对象。
 *
 * @param message 原始候选消息。
 * @param index 当前消息下标，用于补齐默认 ID。
 * @returns 合法消息对象；若消息无效则返回 `null`。
 */
function normalizeToUIMessage(message: MessageCandidate, index: number): UIChatMessage | null {
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  if (typeof message.content !== 'string' || message.content.trim().length === 0) {
    return null;
  }

  return {
    id: typeof message.id === 'string' && message.id.trim().length > 0 ? message.id : `msg_${index}`,
    role: message.role,
    content: message.content,
  };
}

/**
 * 标准化前端消息列表，过滤非法消息并补齐缺省字段。
 *
 * @param messages 原始消息列表。
 * @returns 可直接发送给后端的标准消息数组。
 */
export function normalizeMessagesForRequest(messages: MessageCandidate[]): UIChatMessage[] {
  return messages
    .map((message, index) => normalizeToUIMessage(message, index))
    .filter((message): message is UIChatMessage => message !== null);
}

/**
 * 返回当前消息列表的校验错误。
 *
 * @param messages 已标准化的消息列表。
 * @returns 面向界面展示的错误信息数组。
 */
export function getChatValidationErrors(messages: UIChatMessage[]): string[] {
  if (messages.length === 0) {
    return [];
  }

  const result = validateChatMessages(messages);
  return result.isValid ? [] : result.errors;
}
