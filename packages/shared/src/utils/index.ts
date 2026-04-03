/**
 * 共享工具函数与通用 AI 配置类型。
 */

import type { ChatMessage } from '../types/index';

/**
 * 聊天消息校验结果。
 */
export interface MessageValidationResult {
  /** 消息列表是否通过校验。 */
  isValid: boolean;
  /** 校验失败时收集到的错误信息。 */
  errors: string[];
}

/**
 * OpenAI 兼容服务的基础配置。
 */
export interface AIProviderConfig {
  /** 上游 AI 服务的基础地址。 */
  baseUrl: string;
  /** 请求时使用的模型名称。 */
  model: string;
  /** 模型采样温度。 */
  temperature: number;
  /** 单次请求允许返回的最大 token 数。 */
  maxTokens: number;
}

/**
 * 校验未知输入是否满足共享消息结构。
 *
 * @param messages 待校验的消息列表。
 * @returns 校验状态与错误信息集合。
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
 * 将共享消息结构转换为上游聊天补全接口需要的格式。
 *
 * @param messages 已标准化的消息列表。
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
 * 生成消息唯一标识。
 *
 * @returns 由时间戳和随机串组成的消息 ID。
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 将未知错误安全地转换为可读文本。
 *
 * @param error 捕获到的未知错误对象。
 * @returns 可直接展示或记录的错误信息。
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
