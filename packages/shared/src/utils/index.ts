/**
 * AI Agent monorepo 的共享工具函数。
 */

import type { ChatMessage } from '../types/index';

export interface MessageValidationResult {
  /** 消息列表是否通过校验。 */
  isValid: boolean;
  /** 校验失败时的错误信息集合。 */
  errors: string[];
}

/**
 * OpenAI 兼容服务的配置类型约束。
 */
export interface AIProviderConfig {
  /** API 基础地址。 */
  baseUrl: string;
  /** 调用使用的模型名称。 */
  model: string;
  /** 采样温度。 */
  temperature: number;
  /** 单次请求允许的最大输出 token 数。 */
  maxTokens: number;
}

/**
 * 将未知输入校验为 `ChatMessage[]`。
 * 这样可以保证前后端对消息格式的约束保持一致。
 *
 * @param messages 待校验的消息列表。
 * @returns 校验结果以及对应错误信息。
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
 * 将共享消息结构转换为上游 API 所需格式。
 *
 * @param messages 标准化后的消息列表。
 * @returns 仅保留角色和内容的消息数组。
 */
export function formatMessagesForAPI(
  messages: ChatMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * 生成唯一消息标识。
 *
 * @returns 由时间戳和随机串组成的消息 ID。
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 将未知错误安全转换为可读文本。
 *
 * @param error 捕获到的未知错误对象。
 * @returns 适合展示或记录的错误信息。
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
