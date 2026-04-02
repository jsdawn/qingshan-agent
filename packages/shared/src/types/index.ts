/**
 * AI Agent Monorepo 的共享类型定义
 * 前后端都会使用
 */

/**
 * 聊天消息类型 - 表示对话中的一条消息
 */
export interface ChatMessage {
  /** 消息的唯一标识符 */
  id: string;
  /** 发送者角色：'user' 或 'assistant' */
  role: 'user' | 'assistant';
  /** 消息内容 */
  content: string;
  /** 消息创建的时间戳 */
  timestamp?: number;
}

/**
 * AI 流式响应类型 - 表示来自 AI API 的响应
 */
export interface AIStreamResponse {
  /** 响应状态：'success' 或 'error' */
  status: 'success' | 'error';
  /** 响应消息或错误描述 */
  message?: string;
  /** 当状态为 'error' 时的错误详情 */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 聊天请求类型 - 从前端发送到后端
 */
export interface ChatRequest {
  /** 对话中的消息数组 */
  messages: ChatMessage[];
  /** 系统提示词（可选） */
  systemPrompt?: string;
}

/**
 * 聊天响应类型 - 聊天 API 响应的基础结构
 */
export interface ChatResponse extends AIStreamResponse {
  /** 生成的响应内容（在非流式模式下使用） */
  content?: string;
}
