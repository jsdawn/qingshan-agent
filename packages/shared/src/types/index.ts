/**
 * 前后端共用的聊天领域类型定义。
 */

/**
 * 单条聊天消息。
 */
export interface ChatMessage {
  /** 消息唯一标识。 */
  id: string;
  /** 消息发送方角色。 */
  role: 'user' | 'assistant';
  /** 消息正文内容。 */
  content: string;
  /** 消息时间戳，单位为毫秒。 */
  timestamp?: number;
}

/**
 * 聊天接口请求体。
 */
export interface ChatRequest {
  /** 按时间顺序排列的消息列表。 */
  messages: ChatMessage[];
  /** 可选的系统提示词。 */
  systemPrompt?: string;
}

/**
 * 流式响应中的错误结构。
 */
export interface ChatStreamError {
  /** 稳定错误码。 */
  code: string;
  /** 面向用户的错误描述。 */
  message: string;
}

/**
 * 流式响应开始事件。
 */
export interface ChatStreamStartEvent {
  type: 'start';
  /** 当前助手消息的唯一 ID。 */
  messageId: string;
  /** 流开始时间戳。 */
  createdAt: number;
}

/**
 * 流式文本增量事件。
 */
export interface ChatStreamDeltaEvent {
  type: 'delta';
  /** 本次新增的文本片段。 */
  delta: string;
}

/**
 * 流式响应结束事件。
 */
export interface ChatStreamDoneEvent {
  type: 'done';
  /** 最终生成的助手消息。 */
  message: ChatMessage;
  /** 后端处理耗时，单位为毫秒。 */
  responseTimeMs: number;
}

/**
 * 流式响应错误事件。
 */
export interface ChatStreamErrorEvent {
  type: 'error';
  /** 错误详情。 */
  error: ChatStreamError;
}

/**
 * 聊天流事件联合类型。
 */
export type ChatStreamEvent =
  | ChatStreamStartEvent
  | ChatStreamDeltaEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;
