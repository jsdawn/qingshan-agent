/**
 * Shared utility functions for the AI Agent monorepo.
 */

import type { ChatMessage } from '../types/index';

export interface MessageValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * AI 提供商配置接口 - 支持 OpenAI 兼容的 API
 * 支持的提供商：OpenAI、硅基流动、DeepSeek 等任何 OpenAI 兼容的服务
 */
export interface AIProviderConfig {
  /** API 基础 URL 例如: https://api.openai.com/v1 */
  baseUrl: string;
  /** 使用的模型名称 */
  model: string;
  /** 温度参数 (0-2)，控制输出的随机性 */
  temperature: number;
  /** 最大 tokens 数 */
  maxTokens: number;
}

/**
 * 默认 AI 配置
 * 实际配置通过环境变量在服务器端加载（见 apps/server/src/index.ts）
 * 支持的环境变量:
 *   AI_BASE_URL - API 基础 URL
 *   AI_MODEL - 模型名称
 *   AI_TEMPERATURE - 温度参数
 *   AI_MAX_TOKENS - 最大 tokens
 */
export const AI_CONFIG: AIProviderConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Runtime type guard for a single chat message.
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;
  const hasValidRole = candidate.role === 'user' || candidate.role === 'assistant';
  const hasValidTimestamp =
    candidate.timestamp === undefined || typeof candidate.timestamp === 'number';

  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    hasValidRole &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0 &&
    hasValidTimestamp
  );
}

/**
 * Validate an unknown value as `ChatMessage[]`.
 * This keeps message format rules aligned between frontend and backend.
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
 * Convert shared messages to API format.
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
 * Generate a unique message id.
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a typed message object.
 */
export function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

/**
 * Safely convert unknown errors to a readable message.
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
