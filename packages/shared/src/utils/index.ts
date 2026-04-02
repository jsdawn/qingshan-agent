/**
 * AI Agent Monorepo 的共享工具函数
 * 包含 AI 配置、消息格式化和辅助函数
 */

import type { ChatMessage } from '../types/index.js';

/**
 * AI 配置常量
 * 用于配置到 DeepSeek API 的连接
 */
export const AI_CONFIG = {
  // DeepSeek API 配置（兼容 OpenAI）
  BASE_URL: 'https://api.deepseek.com/v1',
  MODEL: 'deepseek-chat',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2048,
};

/**
 * 格式化消息用于 API 请求
 * 将 ChatMessage 数组转换为 DeepSeek API 期需的格式
 *
 * @param messages - ChatMessage 对象数组
 * @returns 格式化后的消息数组
 */
export function formatMessagesForAPI(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * 生成唯一的消息 ID
 * 使用时间戳和随机数不保证唯一性
 *
 * @returns 唯一的消息 ID 字符串
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新的聊天消息
 * 帮厩函数，用于创建类型正确的 ChatMessage 对象
 *
 * @param role - 发送者角色（'user' 或 'assistant'）
 * @param content - 消息内容
 * @returns ChatMessage 对象
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
 * 从各种错误类型中提取错误消息
 * 处理 Error、string 和未知类型的错误
 *
 * @param error - 错误对象或消息
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '发生了未知错误';
}
