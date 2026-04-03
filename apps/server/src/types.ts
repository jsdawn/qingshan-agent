/**
 * 后端特定的类型定义
 */

import type { ChatRequest, ChatResponse } from '@ai-agent/shared';

/**
 * 扩展的聊天请求，包含可选的元数据
 */
export interface ExtendedChatRequest extends ChatRequest {
  /** 可选的用户 ID 用于追踪 */
  userId?: string;
  /** 可选的会话 ID */
  sessionId?: string;
}

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production';
  aiApiKey: string;
  frontendUrl: string;
}

/**
 * AI 工具定义，用于未来的 AI Agent 扩展
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * 扩展的聊天响应，包含元数据
 */
export interface ExtendedChatResponse extends ChatResponse {
  /** 请求处理时间（毫秒） */
  processingTime?: number;
  /** 令牌使用信息 */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * AI SDK 的流式文本选项
 */
export interface StreamTextOptions {
  model: string;
  tools?: Record<string, ToolDefinition>;
  temperature?: number;
  maxTokens?: number;
}
