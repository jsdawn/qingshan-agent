/**
 * 前后端共用的领域类型定义。
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

export interface ChatRequest {
  /** 按时间顺序排列的对话消息列表。 */
  messages: ChatMessage[];
  /** 可选的系统提示词，用于覆盖默认行为。 */
  systemPrompt?: string;
}
